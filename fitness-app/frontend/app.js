// This event listener ensures that the script runs only after the entire HTML document has been loaded.
document.addEventListener('DOMContentLoaded', () => {

    // --- User Authentication ---
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // --- Element Selectors for the HUD ---
    const usernameDisplay = document.getElementById('username-display');
    const levelDisplay = document.getElementById('level-display');
    const xpBarFill = document.getElementById('xp-bar-fill');
    const xpText = document.getElementById('xp-text');
    const mascotImage = document.querySelector('#mascot-container img');
    const mascotMessage = document.getElementById('mascot-message');
    const logoutBtn = document.getElementById('logout-btn');
    const generateWorkoutBtn = document.getElementById('generate-workout-btn');
    const completeWorkoutBtn = document.getElementById('complete-workout-btn');
    const workoutRoutineDiv = document.getElementById('workout-routine');

    let currentWorkout = [];

    // --- API Path Configuration ---
    const USER_STATS_API_PATH = `/api/user/${currentUser.id}/stats`;
    const WORKOUT_API_PATH = '/api/workout';
    const COMPLETE_WORKOUT_API_PATH = '/api/workout/complete';


    // --- Core Gamification & UI Functions ---

    /**
     * Updates all HUD elements (Level, XP Bar, Username).
     */
    const updateHud = (stats) => {
        usernameDisplay.textContent = stats.username;
        levelDisplay.textContent = stats.level;
        const xpForNextLevel = stats.xp_needed_for_next_level || 100;
        const xpPercentage = Math.min((stats.xp / xpForNextLevel) * 100, 100);
        xpBarFill.style.width = `${xpPercentage}%`;
        xpText.textContent = `${stats.xp} / ${xpForNextLevel} XP`;
    };

    /**
     * Changes the mascot's image and message. (Requires asset files to work)
     */
    const updateMascot = (state) => {
        if (!mascotImage || !mascotMessage) return;
        switch(state) {
            case 'working':
                mascotImage.src = 'assets/images/mascot-working.png';
                mascotMessage.textContent = "Let's get it done!";
                break;
            case 'celebrating':
                mascotImage.src = 'assets/images/mascot-celebrating.png';
                mascotMessage.textContent = "Amazing work!";
                break;
            case 'idle':
            default:
                mascotImage.src = 'assets/images/mascot-idle.png';
                mascotMessage.textContent = "Ready for a workout!";
                break;
        }
    };

    /**
     * NEW: Creates a temporary pop-up notification for rewards.
     * @param {string} text - The message to display (e.g., "Badge Unlocked!").
     * @param {string} type - The type of reward ('quest' or 'badge').
     */
    const showRewardNotification = (text, type) => {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = text;
        document.body.appendChild(notification);
        
        // Trigger the animation
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Remove the notification after a few seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 4000);
    };

    /**
     * Displays the generated workout plan.
     */
    const displayWorkout = (workout) => {
        workoutRoutineDiv.innerHTML = '';
        currentWorkout = workout;
        if (workout.length === 0) {
            workoutRoutineDiv.innerHTML = '<p class="placeholder-text">Could not generate a workout.</p>';
            completeWorkoutBtn.style.display = 'none';
            return;
        }
        workout.forEach(ex => {
            const el = document.createElement('div');
            el.className = 'exercise-item';
            el.innerHTML = `<h3>${ex.name}</h3><video class="exercise-video" src="${ex.video_url}" loop autoplay muted playsinline></video><div class="details"><p>${ex.description}</p><span><strong>Suggested:</strong> 3 Sets of 8-12 Reps</span></div>`;
            workoutRoutineDiv.appendChild(el);
        });
        completeWorkoutBtn.style.display = 'block';
    };
    
    const logout = () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    };


    // --- API Interaction Functions ---

    const loadUserStats = async () => {
        try {
            const response = await fetch(USER_STATS_API_PATH);
            if (!response.ok) throw new Error('Failed to load user stats.');
            updateHud(await response.json());
        } catch (error) { console.error('Error loading user stats:', error); }
    };

    const generateWorkout = async () => {
        workoutRoutineDiv.innerHTML = '<p class="placeholder-text">Generating your mission...</p>';
        updateMascot('working');
        try {
            const response = await fetch(WORKOUT_API_PATH, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentUser),
            });
            if (!response.ok) throw new Error('Server could not generate a workout.');
            displayWorkout(await response.json());
        } catch (error) {
            console.error('Error generating workout:', error);
            workoutRoutineDiv.innerHTML = '<p class="error-message">Could not generate workout.</p>';
            updateMascot('idle');
        }
    };

    /**
     * UPDATED: Sends completed workout and handles the detailed rewards response.
     */
    const completeWorkout = async () => {
        if (currentWorkout.length === 0) return;
        updateMascot('celebrating');
        
        try {
            const response = await fetch(COMPLETE_WORKOUT_API_PATH, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id, workout: currentWorkout }),
            });
            if (!response.ok) throw new Error('Failed to save workout progress.');
            const result = await response.json();
            
            workoutRoutineDiv.innerHTML = `<div class="workout-complete-message"><h2>Mission Complete!</h2><p>You gained <strong>${result.xp_gained} XP</strong>!</p>${result.leveled_up ? '<p class="level-up-message">LEVEL UP!</p>' : ''}</div>`;
            completeWorkoutBtn.style.display = 'none';

            loadUserStats(); // Fetch latest stats to update the HUD

            // --- NEW: Display notifications for quests and badges ---
            let notificationDelay = 500; // Start with a small delay
            if (result.newly_completed_quests && result.newly_completed_quests.length > 0) {
                result.newly_completed_quests.forEach(quest => {
                    setTimeout(() => showRewardNotification(`Quest Complete: ${quest.title}`, 'quest'), notificationDelay);
                    notificationDelay += 1000; // Stagger notifications
                });
            }
            if (result.newly_earned_badges && result.newly_earned_badges.length > 0) {
                result.newly_earned_badges.forEach(badge => {
                    setTimeout(() => showRewardNotification(`Badge Unlocked: ${badge.name}`, 'badge'), notificationDelay);
                    notificationDelay += 1000;
                });
            }

            setTimeout(() => updateMascot('idle'), 3000);
        } catch (error) {
            console.error('Error completing workout:', error);
            workoutRoutineDiv.innerHTML = '<p class="error-message">Error saving progress. Please try again.</p>';
            updateMascot('idle');
        }
    };

    // --- Event Listeners & Initial Load ---
    logoutBtn.addEventListener('click', logout);
    generateWorkoutBtn.addEventListener('click', generateWorkout);
    completeWorkoutBtn.addEventListener('click', completeWorkout);
    loadUserStats();
});
