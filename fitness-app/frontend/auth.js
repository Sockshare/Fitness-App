// This event listener ensures that the script runs only after the entire HTML document has been loaded.
document.addEventListener('DOMContentLoaded', () => {

    // --- Element Selectors ---
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const errorMessageDiv = document.getElementById('error-message');

    // --- API Path Configuration ---
    const LOGIN_API_PATH = '/api/login';
    const REGISTER_API_PATH = '/api/register';


    // --- Login Form Logic ---

    // This code only runs if the script finds a login form on the page.
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            // 1. Prevent the default browser action of reloading the page on form submission.
            event.preventDefault();

            // 2. Clear any previous error messages.
            errorMessageDiv.textContent = '';

            // 3. Get the username and password from the form inputs.
            const username = loginForm.username.value;
            const password = loginForm.password.value;

            try {
                // 4. Send a POST request to the login API endpoint.
                const response = await fetch(LOGIN_API_PATH, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                });

                const data = await response.json();

                // 5. Check if the login was successful.
                if (response.ok) { // response.ok is true for statuses 200-299
                    // Login successful: Store user data in localStorage.
                    // The JSON.stringify() method converts the user object to a string for storage.
                    localStorage.setItem('currentUser', JSON.stringify(data));
                    
                    // Redirect the user to the main dashboard.
                    window.location.href = 'dashboard.html';
                } else {
                    // Login failed: Display the error message from the server.
                    errorMessageDiv.textContent = data.message || 'An error occurred.';
                }
            } catch (error) {
                console.error('Login error:', error);
                errorMessageDiv.textContent = 'Could not connect to the server. Please try again later.';
            }
        });
    }


    // --- Registration Form Logic ---
    
    // This code only runs if the script finds a register form on the page.
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            // 1. Prevent the default page reload.
            event.preventDefault();
            errorMessageDiv.textContent = '';

            // 2. Get all the values from the form.
            const username = registerForm.username.value;
            const password = registerForm.password.value;
            const goals = registerForm.goals.value;

            // For checkboxes, we need to find all that are checked and get their values.
            const equipmentCheckboxes = registerForm.querySelectorAll('input[name="equipment"]:checked');
            const equipment = Array.from(equipmentCheckboxes).map(checkbox => checkbox.value);

            try {
                // 3. Send a POST request to the register API endpoint.
                const response = await fetch(REGISTER_API_PATH, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password, goals, equipment }),
                });

                const data = await response.json();

                // 4. Check if the registration was successful.
                if (response.ok) { // Status 201 Created
                    // Registration successful: Redirect to the login page with a success message.
                    // (A more advanced app might show a message on the same page).
                    window.location.href = 'login.html?registered=true';
                } else {
                    // Registration failed: Display the error message from the server (e.g., "Username already exists").
                    errorMessageDiv.textContent = data.message || 'An error occurred during registration.';
                }
            } catch (error) {
                console.error('Registration error:', error);
                errorMessageDiv.textContent = 'Could not connect to the server. Please try again later.';
            }
        });
    }

    // --- Display "Registered Successfully" Message on Login Page ---
    // This small bonus feature checks if the user was just redirected from the register page.
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('registered') && errorMessageDiv) {
        errorMessageDiv.style.color = 'green'; // Make the success message green
        errorMessageDiv.textContent = 'Registration successful! Please log in.';
    }
});
