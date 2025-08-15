from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import json
import random
import os

# --- Flask App Initialization ---
app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)


# --- Helper Functions ---
def load_data(filename):
    """A helper function to load data from a JSON file."""
    filepath = os.path.join(os.path.dirname(__file__), 'data', filename)
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

def save_data(filename, data):
    """A helper function to save data to a JSON file."""
    filepath = os.path.join(os.path.dirname(__file__), 'data', filename)
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=4)


# --- Frontend Serving Routes ---
@app.route('/')
def serve_login():
    """Serves the login.html file."""
    return send_from_directory(app.static_folder, 'login.html')

@app.route('/register.html')
def serve_register():
    """Serves the register.html file."""
    return send_from_directory(app.static_folder, 'register.html')

@app.route('/dashboard.html')
def serve_dashboard():
    """Serves the dashboard.html file."""
    return send_from_directory(app.static_folder, 'dashboard.html')


# --- API Endpoints ---
@app.route('/api/register', methods=['POST'])
def register_user():
    """Handles new user registration."""
    data = request.json
    username = data.get('username')
    password = data.get('password')
    goals = data.get('goals')
    equipment = data.get('equipment')

    if not username or not password:
        return jsonify({"message": "Username and password are required."}), 400

    users = load_data('users.json')
    if any(u['username'].lower() == username.lower() for u in users):
        return jsonify({"message": "Username already exists."}), 409

    password_hash = generate_password_hash(password)
    new_user_id = max([u['id'] for u in users] + [0]) + 1
    new_user = {
        "id": new_user_id, "username": username, "password_hash": password_hash,
        "goals": goals, "available_equipment": equipment
    }
    users.append(new_user)
    save_data('users.json', users)
    return jsonify({"message": "User registered successfully!"}), 201

@app.route('/api/login', methods=['POST'])
def login_user():
    """Handles user authentication."""
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Username and password are required."}), 400

    users = load_data('users.json')
    user = next((u for u in users if u['username'].lower() == username.lower()), None)

    if user and check_password_hash(user.get('password_hash', ''), password):
        user_data_to_return = {
            "id": user['id'], "username": user['username'],
            "goals": user['goals'], "available_equipment": user['available_equipment']
        }
        return jsonify(user_data_to_return), 200
    
    return jsonify({"message": "Invalid username or password."}), 401

@app.route('/api/exercises', methods=['GET'])
def get_exercises():
    """Endpoint to get all exercises."""
    exercises = load_data('exercises.json')
    equipment_filter = request.args.get('equipment')
    if equipment_filter:
        return jsonify([ex for ex in exercises if ex['equipment'].lower() == equipment_filter.lower()])
    return jsonify(exercises)


# --- UPDATED WORKOUT GENERATION LOGIC ---
@app.route('/api/workout', methods=['POST'])
def generate_workout():
    """
    Endpoint to generate a workout.
    This logic is now restored to be more intelligent, using the user's goals
    and ensuring a balanced selection of exercises.
    """
    user_data = request.json
    all_exercises = load_data('exercises.json')
    
    user_equipment = user_data.get('available_equipment', ['None'])
    user_goal = user_data.get('goals', 'General Fitness')

    # 1. Filter exercises by the user's available equipment.
    available_exercises = [
        ex for ex in all_exercises if ex['equipment'] in user_equipment
    ]
    
    if not available_exercises:
        return jsonify({"error": "No exercises found for your available equipment."}), 400

    # 2. Build the workout plan.
    workout_plan = []
    
    # Prioritize certain muscle groups for a 'Build Strength' goal.
    if user_goal == 'Build Strength':
        muscle_groups_to_target = ['Chest', 'Back', 'Legs']
        for group in muscle_groups_to_target:
            group_exercises = [e for e in available_exercises if e['muscle_group'] == group]
            if group_exercises:
                chosen_exercise = random.choice(group_exercises)
                if chosen_exercise not in workout_plan:
                    workout_plan.append(chosen_exercise)

    # 3. Fill the rest of the workout with random exercises to reach a total of 5.
    while len(workout_plan) < 5:
        # Stop if we run out of unique exercises to add.
        if len(workout_plan) >= len(available_exercises):
            break
        
        chosen_exercise = random.choice(available_exercises)
        # Add the exercise only if it's not already in the plan.
        if chosen_exercise not in workout_plan:
            workout_plan.append(chosen_exercise)
            
    return jsonify(workout_plan)


# --- Main Execution ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)
