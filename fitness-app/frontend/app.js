// This event listener ensures that the script runs only after the entire HTML document has been loaded.
document.addEventListener('DOMContentLoaded', () => {

    // --- User Authentication and Data ---

    // 1. Get the current user's data from localStorage.
    // This is the data that was saved by auth.js during a successful login.
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    // 2. Client-side security check.
    // If no user is logged in, redirect back to the login page immediately.
    if (!currentUser) {
        window.location.href = 'login.html';
        return; // Stop the script from running further on this page.
    }

    // --- Element Selectors ---
    const usernameDisplay = document.getElementById('username-display');
    const goalDisplay = document.getElementById('goal-display');
    const logoutBtn = document.getElementById('logout-btn'); // The button we need to fix.
    const generateWorkoutBtn = document.getElementById('generate-workout-btn');
    const workoutRoutineDiv = document.getElementById('workout-routine');
    const equipmentFilter = document.getElementById('equipment-filter');
    const exerciseListDiv = document.getElementById('exercise-list');

    // --- API Path Configuration ---
    const EXERCISES_API_PATH = '/api/exercises';
    const WORKOUT_API_PATH = '/api/workout';


    // --- Core Functions ---

    /**
     * Populates the header with the logged-in user's information.
     */
    const populateUserInfo = () => {
        if (usernameDisplay) {
            usernameDisplay.textContent = currentUser.username;
        }
        if (goalDisplay) {
            goalDisplay.textContent = currentUser.goals;
        }
    };

    /**
     * FIX: This function handles the user logout process.
     * It will be attached to the logout button's click event.
     */
    const logout = () => {
        // Remove the user's data from the browser's storage.
        localStorage.removeItem('currentUser');
        // Redirect the user back to the login page.
        window.location.href = 'login.html';
    };

    /**
     * Fetches exercises from the backend.
     */
    const fetchExercises = async () => {
        const selectedEquipment = equipmentFilter.value;
        let url = EXERCISES_API_PATH;
        if (selectedEquipment) {
            url += `?equipment=${selectedEquipment}`;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok.');
            const exercises = await response.json();
            displayExercises(exercises);
        } catch (error) {
            console.error('Error fetching exercises:', error);
            exerciseListDiv.innerHTML = '<p style="color: red;">Could not load exercises.</p>';
        }
    };

    /**
     * Generates a workout by sending the current user's data to the backend.
     */
    const generateWorkout = async () => {
        workoutRoutineDiv.innerHTML = '<p>Generating your personalized workout...</p>';
        try {
            const response = await fetch(WORKOUT_API_PATH, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentUser),
            });
            if (!response.ok) throw new Error(`Server responded with an error: ${response.statusText}`);
            const workout = await response.json();
            displayWorkout(workout);
        } catch (error) {
            console.error('Error generating workout:', error);
            workoutRoutineDiv.innerHTML = '<p style="color: red;">Could not generate a workout. Please try again.</p>';
        }
    };


    // --- UI Display Functions (No changes here) ---
    const displayExercises = (exercises) => {
        exerciseListDiv.innerHTML = '';
        if (exercises.length === 0) {
            exerciseListDiv.innerHTML = '<p>No exercises found for this filter.</p>';
            return;
        }
        exercises.forEach(ex => {
            const exerciseEl = document.createElement('div');
            exerciseEl.className = 'exercise-item';
            exerciseEl.innerHTML = `<h3>${ex.name}</h3><p>${ex.description}</p><div class="details"><strong>Muscle Group:</strong> ${ex.muscle_group} | <strong>Difficulty:</strong> ${ex.difficulty} | <strong>Equipment:</strong> ${ex.equipment}</div>`;
            exerciseListDiv.appendChild(exerciseEl);
        });
    };

    const displayWorkout = (workout) => {
        workoutRoutineDiv.innerHTML = '<h4>Your Recommended Routine:</h4>';
        if (workout.length === 0) {
            workoutRoutineDiv.innerHTML += '<p>Could not generate a full routine.</p>';
            return;
        }
        workout.forEach(ex => {
            const workoutItemEl = document.createElement('div');
            workoutItemEl.className = 'exercise-item';
            workoutItemEl.innerHTML = `<h3>${ex.name}</h3><p><strong>Suggested:</strong> 3 Sets of 8-12 Reps</p><div class="details"><strong>Muscle Group:</strong> ${ex.muscle_group} | <strong>Equipment:</strong> ${ex.equipment}</div>`;
            workoutRoutineDiv.appendChild(workoutItemEl);
        });
    };


    // --- Event Listeners ---
    
    // FIX: This ensures the 'logout' function is called whenever the logout button is clicked.
    // The `if (logoutBtn)` check is a safeguard to prevent errors if the button is not found.
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    if (generateWorkoutBtn) {
        generateWorkoutBtn.addEventListener('click', generateWorkout);
    }
    
    if (equipmentFilter) {
        equipmentFilter.addEventListener('change', fetchExercises);
    }

    
    // --- Initial Page Load ---
    populateUserInfo(); // Populate the header with the logged-in user's data.
    fetchExercises();   // Fetch the initial list of all exercises.
});
