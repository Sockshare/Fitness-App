from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import json
import random
import os
from datetime import datetime, timedelta

# --- App Initialization ---
app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

# --- Gamification Configuration ---
LEVEL_XP_MAP = {1: 100, 2: 150, 3: 200, 4: 250, 5: 300, 6: 400, 7: 500, 8: 600, 9: 750, 10: 1000}
BASE_WORKOUT_XP = 50

# --- Helper Functions ---
def load_data(filename):
    filepath = os.path.join(os.path.dirname(__file__), 'data', filename)
    try:
        with open(filepath, 'r') as f: return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError): return []

def save_data(filename, data):
    filepath = os.path.join(os.path.dirname(__file__), 'data', filename)
    with open(filepath, 'w') as f: json.dump(data, f, indent=4)


# --- NEW: Master Rewards Logic ---
def _check_and_award_rewards(user, workout_log):
    """Checks for and awards quests and badges. Modifies the user object directly."""
    newly_completed_quests = []
    newly_earned_badges = []
    total_bonus_xp = 0

    # --- 1. Quest Completion Check ---
    all_quests = load_data('quests.json')
    user_completed_quests = user.get('completed_quests', [])
    
    for quest in all_quests:
        if quest['id'] not in user_completed_quests: # Check only uncompleted quests
            # This is a simplified check. A real system would check daily/weekly resets.
            is_complete = False
            criteria = quest['criteria']
            if criteria['type'] == 'first_workout_of_day':
                is_complete = True # The event of completing a workout is enough for this
            elif criteria['type'] == 'muscle_group_in_workout':
                if any(ex['muscle_group'] in criteria['value'] for ex in workout_log[-1]['workout']):
                    is_complete = True
            
            if is_complete:
                user['xp'] += quest['reward_xp']
                total_bonus_xp += quest['reward_xp']
                user_completed_quests.append(quest['id'])
                newly_completed_quests.append(quest)

    user['completed_quests'] = user_completed_quests

    # --- 2. Badge Unlocking Check ---
    all_badges = load_data('badges.json')
    user_unlocked_badges = user.get('unlocked_badges', [])

    for badge in all_badges:
        if badge['id'] not in user_unlocked_badges:
            is_earned = False
            criteria = badge['criteria']
            if criteria['type'] == 'total_workouts' and len(workout_log) >= criteria['value']:
                is_earned = True
            elif criteria['type'] == 'level_reached' and user['level'] >= criteria['value']:
                is_earned = True
            elif criteria['type'] == 'streak' and user['streak_count'] >= criteria['value']:
                is_earned = True
            elif criteria['type'] == 'quests_completed' and len(user['completed_quests']) >= criteria['value']:
                is_earned = True
            
            if is_earned:
                user_unlocked_badges.append(badge['id'])
                newly_earned_badges.append(badge)
    
    user['unlocked_badges'] = user_unlocked_badges

    return total_bonus_xp, newly_completed_quests, newly_earned_badges


# --- Frontend Serving Routes ---
# (No changes here)
@app.route('/')
def serve_login(): return send_from_directory(app.static_folder, 'login.html')
@app.route('/register.html')
def serve_register(): return send_from_directory(app.static_folder, 'register.html')
@app.route('/dashboard.html')
def serve_dashboard(): return send_from_directory(app.static_folder, 'dashboard.html')
@app.route('/profile.html')
def serve_profile(): return send_from_directory(app.static_folder, 'profile.html')
@app.route('/quests.html')
def serve_quests(): return send_from_directory(app.static_folder, 'quests.html')
@app.route('/friends.html')
def serve_friends(): return send_from_directory(app.static_folder, 'friends.html')


# --- Core User Auth & Workout API ---
@app.route('/api/register', methods=['POST'])
def register_user():
    data = request.json
    users = load_data('users.json')
    if any(u['username'].lower() == data.get('username', '').lower() for u in users):
        return jsonify({"message": "Username already exists."}), 409
    new_user = {"id": max([u['id'] for u in users] + [0]) + 1, "username": data.get('username'),
                "password_hash": generate_password_hash(data.get('password')), "goals": data.get('goals'),
                "available_equipment": data.get('equipment'), "level": 1, "xp": 0, "streak_count": 0,
                "last_workout_date": None, "unlocked_badges": [], "completed_quests": []}
    users.append(new_user)
    save_data('users.json', users)
    return jsonify({"message": "User registered successfully!"}), 201

@app.route('/api/login', methods=['POST'])
def login_user():
    data = request.json
    user = next((u for u in load_data('users.json') if u['username'].lower() == data.get('username', '').lower()), None)
    if user and check_password_hash(user.get('password_hash', ''), data.get('password')):
        return jsonify({"id": user['id'], "username": user['username'], "goals": user['goals'],
                        "available_equipment": user['available_equipment']}), 200
    return jsonify({"message": "Invalid username or password."}), 401

@app.route('/api/workout', methods=['POST'])
def generate_workout():
    data = request.json
    exercises = load_data('exercises.json')
    equipment = data.get('available_equipment', ['None'])
    available = [ex for ex in exercises if ex['equipment'] in equipment]
    if not available: return jsonify({"error": "No exercises found."}), 400
    return jsonify(random.sample(available, min(len(available), 5)))

@app.route('/api/workout/complete', methods=['POST'])
def complete_workout():
    data = request.json
    user_id = data.get('userId')
    
    users = load_data('users.json')
    user, user_index = next(((u, i) for i, u in enumerate(users) if u['id'] == user_id), (None, -1))
    if not user: return jsonify({"message": "User not found"}), 404

    # --- 1. Grant Base XP & Handle Leveling ---
    xp_gained = BASE_WORKOUT_XP + (len(data.get('workout', [])) * 5)
    user['xp'] += xp_gained
    leveled_up = False
    xp_needed = LEVEL_XP_MAP.get(user['level'], 1000)
    while user['xp'] >= xp_needed:
        user['level'] += 1
        user['xp'] -= xp_needed
        xp_needed = LEVEL_XP_MAP.get(user['level'], 1000)
        leveled_up = True

    # --- 2. Update Streak & Log Workout ---
    today = datetime.utcnow().date()
    if user.get('last_workout_date'):
        last_workout = datetime.strptime(user['last_workout_date'], '%Y-%m-%d').date()
        if today == last_workout + timedelta(days=1): user['streak_count'] += 1
        elif today > last_workout: user['streak_count'] = 1
    else:
        user['streak_count'] = 1
    user['last_workout_date'] = today.strftime('%Y-%m-%d')
    
    progress = load_data('user_progress.json')
    user_progress = [p for p in progress if p['userId'] == user_id]
    user_progress.append({"userId": user_id, "date": datetime.utcnow().isoformat(), "workout": data.get('workout'), "xp_gained": xp_gained})
    # Save only this user's progress back to the main log
    other_progress = [p for p in progress if p['userId'] != user_id]
    save_data('user_progress.json', other_progress + user_progress)

    # --- 3. Check for Quests & Badges ---
    bonus_xp, quests, badges = _check_and_award_rewards(user, user_progress)
    xp_gained += bonus_xp
    
    # --- 4. Save User and Return ---
    users[user_index] = user
    save_data('users.json', users)
    
    return jsonify({"message": "Workout complete!", "xp_gained": xp_gained, "level": user['level'],
                    "xp": user['xp'], "leveled_up": leveled_up,
                    "newly_completed_quests": quests, "newly_earned_badges": badges}), 200


# --- Profile, Quests, Friends & Leaderboard API (FULLY FUNCTIONAL) ---
@app.route('/api/user/<int:user_id>/stats', methods=['GET'])
def get_user_stats(user_id):
    user = next((u for u in load_data('users.json') if u['id'] == user_id), None)
    if not user: return jsonify({"message": "User not found"}), 404
    badges = [b for b in load_data('badges.json') if b['id'] in user.get('unlocked_badges', [])]
    return jsonify({"username": user['username'], "level": user['level'], "xp": user['xp'],
                    "xp_needed_for_next_level": LEVEL_XP_MAP.get(user['level'], 1000),
                    "streak_count": user['streak_count'], "unlocked_badges": badges})

@app.route('/api/user/<int:user_id>/history', methods=['GET'])
def get_workout_history(user_id):
    return jsonify([log for log in load_data('user_progress.json') if log['userId'] == user_id])

@app.route('/api/user/<int:user_id>/quests', methods=['GET'])
def get_user_quests(user_id):
    user = next((u for u in load_data('users.json') if u['id'] == user_id), None)
    if not user: return jsonify({"message": "User not found"}), 404
    
    quests = load_data('quests.json')
    user_completed = user.get('completed_quests', [])
    for q in quests:
        q['completed'] = q['id'] in user_completed
    
    return jsonify({"daily": [q for q in quests if q['type'] == 'daily'],
                    "weekly": [q for q in quests if q['type'] == 'weekly']})

@app.route('/api/user/<int:user_id>/friends', methods=['GET'])
def get_friends(user_id):
    friends_data = load_data('friends_data.json')
    users = load_data('users.json')
    
    friends = []
    pending_requests = []
    
    for rel in friends_data:
        if rel['status'] == 'accepted' and user_id in [rel['requester_id'], rel['receiver_id']]:
            friend_id = rel['receiver_id'] if rel['requester_id'] == user_id else rel['requester_id']
            friend = next((u for u in users if u['id'] == friend_id), None)
            if friend: friends.append({"id": friend['id'], "username": friend['username'], "level": friend['level']})
        elif rel['status'] == 'pending' and rel['receiver_id'] == user_id:
            requester = next((u for u in users if u['id'] == rel['requester_id']), None)
            if requester: pending_requests.append({"id": requester['id'], "username": requester['username']})

    return jsonify({"friends": friends, "pending_requests": pending_requests})

@app.route('/api/user/<int:user_id>/friends/request', methods=['POST'])
def send_friend_request(user_id):
    data = request.json
    username_to_add = data.get('username_to_add', '').lower()
    
    users = load_data('users.json')
    friend_to_add = next((u for u in users if u['username'].lower() == username_to_add), None)
    
    if not friend_to_add: return jsonify({"message": "User not found."}), 404
    if friend_to_add['id'] == user_id: return jsonify({"message": "You cannot add yourself."}), 400
    
    friends_data = load_data('friends_data.json')
    if any(user_id in [r['requester_id'], r['receiver_id']] and friend_to_add['id'] in [r['requester_id'], r['receiver_id']] for r in friends_data):
        return jsonify({"message": "Request already sent or you are already friends."}), 409
        
    friends_data.append({"requester_id": user_id, "receiver_id": friend_to_add['id'], "status": "pending"})
    save_data('friends_data.json', friends_data)
    return jsonify({"message": "Friend request sent!"}), 200

@app.route('/api/user/<int:user_id>/friends/respond', methods=['POST'])
def respond_friend_request(user_id):
    data = request.json
    requester_id = data.get('requester_id')
    action = data.get('action') # 'accept' or 'decline'
    
    friends_data = load_data('friends_data.json')
    request_index = next((i for i, r in enumerate(friends_data) if r['requester_id'] == requester_id and r['receiver_id'] == user_id and r['status'] == 'pending'), -1)
    
    if request_index == -1: return jsonify({"message": "Request not found."}), 404
    
    if action == 'accept':
        friends_data[request_index]['status'] = 'accepted'
        friends_data[request_index]['since'] = datetime.utcnow().isoformat()
    else: # decline
        friends_data.pop(request_index)
        
    save_data('friends_data.json', friends_data)
    return jsonify({"message": f"Request {action}ed."}), 200

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    # This is still a global leaderboard for simplicity. A friend-only one is more complex.
    users = load_data('users.json')
    leaderboard = sorted([{"id": u['id'], "username": u['username'], "weekly_xp": u.get('xp', 0)} for u in users],
                         key=lambda x: x['weekly_xp'], reverse=True)
    return jsonify(leaderboard)


# --- Main Execution ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)
