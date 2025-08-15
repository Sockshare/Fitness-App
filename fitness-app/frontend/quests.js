// This event listener ensures that the script runs only after the entire HTML document has been loaded.
document.addEventListener('DOMContentLoaded', () => {

    // --- User Authentication ---
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'login.html';
        return; // Stop script execution if no user is logged in
    }

    // --- Element Selectors ---
    const dailyQuestsContainer = document.getElementById('daily-quests-container');
    const weeklyQuestsContainer = document.getElementById('weekly-quests-container');

    // --- API Path Configuration ---
    // This endpoint now returns the user's specific completion status for each quest.
    const QUESTS_API_PATH = `/api/user/${currentUser.id}/quests`;


    // --- UI Rendering Function ---

    /**
     * Renders a list of quests into a specified container element.
     * It now correctly uses the 'completed' property from the API.
     * @param {Array} quests - An array of quest objects from the API.
     * @param {HTMLElement} container - The container element to render the quests into.
     */
    const renderQuests = (quests, container) => {
        container.innerHTML = ''; // Clear the "Loading..." message

        if (!quests || quests.length === 0) {
            container.innerHTML = '<p>No quests available at this time. Check back later!</p>';
            return;
        }

        quests.forEach(quest => {
            const questElement = document.createElement('div');
            // The 'completed' class is now applied based on live data from the backend.
            questElement.className = `quest-item ${quest.completed ? 'completed' : ''}`;

            questElement.innerHTML = `
                <div class="quest-info">
                    <h3 class="quest-title">${quest.title}</h3>
                    <p class="quest-description">${quest.description}</p>
                </div>
                <div class="quest-reward">
                    <span>+${quest.reward_xp} XP</span>
                </div>
                <div class="quest-status">
                    <!-- Display a checkmark only if the quest is completed -->
                    ${quest.completed ? '<span>✔</span>' : ''}
                </div>
            `;
            container.appendChild(questElement);
        });
    };


    // --- Main Data Fetching Function ---

    /**
     * Fetches all active quests and the user's completion status from the backend.
     */
    const loadQuests = async () => {
        try {
            const response = await fetch(QUESTS_API_PATH);

            if (!response.ok) {
                throw new Error('Failed to load quest data.');
            }

            const data = await response.json();
            
            // The API returns an object with two arrays: 'daily' and 'weekly'.
            // Each quest object inside these arrays now has a 'completed' boolean property.
            renderQuests(data.daily, dailyQuestsContainer);
            renderQuests(data.weekly, weeklyQuestsContainer);

        } catch (error) {
            console.error('Error loading quests:', error);
            dailyQuestsContainer.innerHTML = '<p class="error-message">Could not load quests.</p>';
            weeklyQuestsContainer.innerHTML = ''; // Keep it clean
        }
    };

    // --- Initial Page Load ---
    loadQuests();
});
