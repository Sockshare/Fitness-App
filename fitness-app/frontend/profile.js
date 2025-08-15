// This event listener ensures that the script runs only after the entire HTML document has been loaded.
document.addEventListener('DOMContentLoaded', () => {

    // --- User Authentication ---
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'login.html';
        return; // Stop script execution if no user is logged in
    }

    // --- Element Selectors ---
    const usernameDisplay = document.getElementById('username-display');
    const levelDisplay = document.getElementById('level-display');
    const streakDisplay = document.getElementById('streak-display');
    const xpBarFill = document.getElementById('xp-bar-fill');
    const xpText = document.getElementById('xp-text');
    const badgesGrid = document.getElementById('badges-grid');
    const workoutHistoryList = document.getElementById('workout-history-list');

    // --- API Path Configuration (for new endpoints we will create in app.py) ---
    // This single endpoint will fetch all extended stats for the logged-in user.
    const USER_STATS_API_PATH = `/api/user/${currentUser.id}/stats`; 
    // This endpoint will fetch the user's workout log.
    const WORKOUT_HISTORY_API_PATH = `/api/user/${currentUser.id}/history`;


    // --- UI Rendering Functions ---

    /**
     * Populates the user's core stats and updates the XP bar.
     * @param {object} stats - The user stats object from the API.
     */
    const renderStats = (stats) => {
        usernameDisplay.textContent = stats.username;
        levelDisplay.textContent = stats.level;
        streakDisplay.textContent = `🔥 ${stats.streak_count} Days`;

        // XP Bar Logic
        const xpForNextLevel = stats.xp_needed_for_next_level || 100; // Default to 100 if not provided
        const xpPercentage = (stats.xp / xpForNextLevel) * 100;
        
        xpBarFill.style.width = `${xpPercentage}%`;
        xpText.textContent = `${stats.xp} / ${xpForNextLevel} XP`;
    };

    /**
     * Renders the grid of unlocked badges.
     * @param {Array} badges - An array of badge objects the user has unlocked.
     */
    const renderBadges = (badges) => {
        badgesGrid.innerHTML = ''; // Clear the placeholder text
        if (!badges || badges.length === 0) {
            badgesGrid.innerHTML = '<p>No badges unlocked yet. Complete workouts and quests to earn them!</p>';
            return;
        }

        badges.forEach(badge => {
            const badgeElement = document.createElement('div');
            badgeElement.className = 'badge-item';
            // Use the title attribute to show the description on hover (tooltip)
            badgeElement.title = badge.description; 
            
            badgeElement.innerHTML = `
                <img src="${badge.image_url}" alt="${badge.name}">
                <p class="badge-name">${badge.name}</p>
            `;
            badgesGrid.appendChild(badgeElement);
        });
    };

    /**
     * Renders the list of recently completed workouts.
     * @param {Array} history - An array of workout log objects.
     */
    const renderHistory = (history) => {
        workoutHistoryList.innerHTML = ''; // Clear placeholder
        if (!history || history.length === 0) {
            workoutHistoryList.innerHTML = '<li>No workouts completed yet. Let\'s get started!</li>';
            return;
        }

        // Show the most recent workouts first
        history.reverse().slice(0, 10).forEach(log => { // Show max 10 recent
            const listItem = document.createElement('li');
            // Format the date to be more readable
            const workoutDate = new Date(log.date).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
            const exerciseNames = log.workout.map(ex => ex.name).join(', ');
            
            listItem.innerHTML = `<strong>${workoutDate}:</strong> Completed ${log.workout.length} exercises (${exerciseNames}). <span>+${log.xp_gained} XP</span>`;
            workoutHistoryList.appendChild(listItem);
        });
    };


    // --- Main Data Fetching Function ---

    /**
     * Fetches all necessary data for the profile page from the backend.
     */
    const loadProfileData = async () => {
        try {
            // Fetch stats and history concurrently for faster loading
            const [statsResponse, historyResponse] = await Promise.all([
                fetch(USER_STATS_API_PATH),
                fetch(WORKOUT_HISTORY_API_PATH)
            ]);

            if (!statsResponse.ok) throw new Error('Failed to load user stats.');
            if (!historyResponse.ok) throw new Error('Failed to load workout history.');

            const stats = await statsResponse.json();
            const history = await historyResponse.json();
            
            // Call the rendering functions with the fetched data
            renderStats(stats);

            // The 'unlocked_badges' will be part of the main stats object
            renderBadges(stats.unlocked_badges); 
            
            renderHistory(history);

        } catch (error) {
            console.error('Error loading profile data:', error);
            // Display an error message on the page if data fails to load
            const mainContent = document.querySelector('main');
            if (mainContent) {
                mainContent.innerHTML = '<p class="error-message">Could not load profile data. Please try refreshing the page.</p>';
            }
        }
    };

    // --- Initial Page Load ---
    loadProfileData();
});
