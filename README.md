# Fitness App Quick Start Guide

This guide provides the exact steps to set up and run the Fitness Application Prototype on your local machine.

---

### **1. Prerequisites**

Before you begin, ensure you have **Python 3** and **pip** installed. You can verify this by running:
```sh
python3 --version
pip --version
```

---

### **2. Setup Instructions**

Follow these steps in order. All commands are run from your terminal.

**Step A: Get the Project**

Clone the project repository to your local machine.```sh
git clone <your-repository-url>
cd fitness-app
```

**Step B: Configure the Backend**

This is the most important part. You must be inside the `backend` directory to run these commands.

1.  **Navigate into the backend folder:**
    ```sh
    cd backend
    ```

2.  **Create and activate a Python virtual environment:**
    ```sh
    # Create the venv folder
    python3 -m venv venv

    # Activate it (for macOS/Linux)
    source venv/bin/activate

    # On Windows, use this command instead:
    # venv\Scripts\activate
    ```
    *(You will see `(venv)` at the start of your terminal prompt when it's active.)*

3.  **Install the required packages:**
    ```sh
    pip install -r requirements.txt
    ```

4.  **Initialize the application's database (One-Time Step):**
    ```sh
    python3 generate_data.py
    ```
    *(This creates the `exercises.json` file and an empty `users.json` file.)*

---

### **3. How to Run the Application**

1.  **Start the Server**
    -   Ensure you are still in the `backend` directory and your virtual environment is active.
    -   Run the main application file:
        ```sh
        python3 app.py
        ```
    -   Your terminal will show that the server is running on `http://127.0.0.1:5000`. **Leave this terminal open.**

2.  **Use the App**
    -   Open your web browser.
    -   Navigate to the address: **`http://127.0.0.1:5000`**
    -   The login page should appear. You can now register a new user and use the application.

---

### **4. Troubleshooting Common Issues**

-   **Error: `ModuleNotFoundError: No module named 'flask'`**
    -   **Cause:** Your virtual environment is not active, or you forgot to install the requirements.
    -   **Solution:** Stop the server (`Ctrl+C`), run `source venv/bin/activate`, run `pip install -r requirements.txt`, then run `python3 app.py` again.

-   **Error: `FileNotFoundError: [Errno 2] No such file or directory: 'data/exercises.json'`**
    -   **Cause:** You did not run the one-time database initialization script.
    -   **Solution:** Stop the server, run `python3 generate_data.py`, then restart the server with `python3 app.py`.

-   **Error: Browser shows `This site can’t be reached`**
    -   **Cause:** Your backend server is not running.
    -   **Solution:** Check your terminal. If the server isn't running, navigate to the `backend` folder, activate the venv, and run `python3 app.py`.
