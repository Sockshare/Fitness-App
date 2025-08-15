// This event listener ensures that the script runs only after the entire HTML document has been loaded.
document.addEventListener('DOMContentLoaded', () => {

    // --- User Authentication ---
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // --- Element Selectors ---
    const addFriendForm = document.getElementById('add-friend-form');
    const friendUsernameInput = document.getElementById('friend-username');
    const friendRequestMessage = document.getElementById('friend-request-message');
    const pendingRequestsContainer = document.getElementById('pending-requests-container');
    const friendsListContainer = document.getElementById('friends-list-container');
    const leaderboardList = document.getElementById('leaderboard-list');

    // --- API Path Configuration ---
    const FRIENDS_API_BASE = `/api/user/${currentUser.id}/friends`;
    const LEADERBOARD_API_PATH = `/api/leaderboard`; // A friend-only version would be more complex


    // --- UI Rendering Functions ---

    /**
     * Renders the list of pending friend requests with Accept/Decline buttons.
     */
    const renderPendingRequests = (requests) => {
        pendingRequestsContainer.innerHTML = '';
        if (!requests || requests.length === 0) {
            pendingRequestsContainer.innerHTML = '<p>No new friend requests.</p>';
            return;
        }

        requests.forEach(req => {
            const reqElement = document.createElement('div');
            reqElement.className = 'friend-item pending';
            reqElement.innerHTML = `
                <span class="friend-name">${req.username}</span>
                <div class="friend-actions">
                    <button class="button-accept" data-requester-id="${req.id}">Accept</button>
                    <button class="button-decline" data-requester-id="${req.id}">Decline</button>
                </div>
            `;
            pendingRequestsContainer.appendChild(reqElement);
        });
    };

    /**
     * Renders the user's current friends list.
     */
    const renderFriendsList = (friends) => {
        friendsListContainer.innerHTML = '';
        if (!friends || friends.length === 0) {
            friendsListContainer.innerHTML = "<p>You haven't added any friends yet.</p>";
            return;
        }
        
        friends.forEach(friend => {
            const friendElement = document.createElement('div');
            friendElement.className = 'friend-item';
            friendElement.innerHTML = `<span class="friend-name">${friend.username} (Level ${friend.level})</span>`;
            friendsListContainer.appendChild(friendElement);
        });
    };

    /**
     * Renders the weekly leaderboard.
     */
    const renderLeaderboard = (leaderboard) => {
        leaderboardList.innerHTML = '';
        if (!leaderboard || leaderboard.length === 0) {
            leaderboardList.innerHTML = '<p>Leaderboard data is currently unavailable.</p>';
            return;
        }
        // For now, this is a global leaderboard. A friend-only one would be filtered here.
        leaderboard.forEach((entry, index) => {
            const item = document.createElement('li');
            item.className = `leaderboard-item ${entry.id === currentUser.id ? 'current-user' : ''}`;
            item.innerHTML = `
                <span class="rank">${index + 1}</span>
                <span class="name">${entry.username}</span>
                <span class="xp">${entry.weekly_xp} XP</span>
            `;
            leaderboardList.appendChild(item);
        });
    };


    // --- API Interaction Functions ---

    /**
     * Fetches all friends data and the leaderboard from the backend.
     */
    const loadPageData = async () => {
        try {
            const [friendsResponse, leaderboardResponse] = await Promise.all([
                fetch(FRIENDS_API_BASE),
                fetch(LEADERBOARD_API_PATH)
            ]);

            if (!friendsResponse.ok) throw new Error('Failed to load friends data.');
            if (!leaderboardResponse.ok) throw new Error('Failed to load leaderboard data.');

            const friendsData = await friendsResponse.json();
            const leaderboardData = await leaderboardResponse.json();

            renderPendingRequests(friendsData.pending_requests);
            renderFriendsList(friendsData.friends);
            renderLeaderboard(leaderboardData);
        } catch (error) {
            console.error('Error:', error);
            friendsListContainer.innerHTML = '<p class="error-message">Could not load friend data.</p>';
        }
    };

    /**
     * Sends a new friend request to the server.
     */
    const sendFriendRequest = async (username) => {
        try {
            const response = await fetch(`${FRIENDS_API_BASE}/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username_to_add: username })
            });
            const data = await response.json();
            friendRequestMessage.textContent = data.message;
            friendRequestMessage.className = response.ok ? 'form-message success' : 'form-message error';
            
            // If successful, clear the success message after a few seconds
            if(response.ok) {
                setTimeout(() => friendRequestMessage.textContent = '', 3000);
            }
        } catch (error) {
            friendRequestMessage.textContent = 'A network error occurred.';
            friendRequestMessage.className = 'form-message error';
        }
    };

    /**
     * Responds to a pending friend request (accept or decline).
     */
    const respondToRequest = async (requesterId, action) => {
        try {
            const response = await fetch(`${FRIENDS_API_BASE}/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requester_id: parseInt(requesterId), action: action })
            });

            if (response.ok) {
                loadPageData(); // Refresh the entire friends list and pending requests
            } else {
                const data = await response.json();
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            alert('A network error occurred.');
        }
    };


    // --- Event Listeners ---
    addFriendForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = friendUsernameInput.value.trim();
        if (username) {
            sendFriendRequest(username);
            friendUsernameInput.value = '';
        }
    });

    pendingRequestsContainer.addEventListener('click', (e) => {
        const target = e.target;
        const requesterId = target.dataset.requesterId;
        if (requesterId) {
            if (target.classList.contains('button-accept')) {
                respondToRequest(requesterId, 'accept');
            } else if (target.classList.contains('button-decline')) {
                respondToRequest(requesterId, 'decline');
            }
        }
    });


    // --- Initial Page Load ---
    loadPageData();
});
