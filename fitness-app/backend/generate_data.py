import json
import os

def create_exercise_data():
    """Creates and saves a list of sample exercises to a JSON file."""
    
    # First, ensure the 'data' directory exists where the files will be stored.
    # The exist_ok=True argument prevents an error if the directory already exists.
    os.makedirs('data', exist_ok=True)
    
    exercises = [
        {
            "id": 1, 
            "name": "Push-up", 
            "muscle_group": "Chest", 
            "difficulty": "Beginner", 
            "equipment": "None", 
            "description": "A classic bodyweight exercise that builds strength in the chest, shoulders, and triceps."
        },
        {
            "id": 2, 
            "name": "Squat", 
            "muscle_group": "Legs", 
            "difficulty": "Beginner", 
            "equipment": "None", 
            "description": "A fundamental lower body exercise that targets the quadriceps, hamstrings, and glutes."
        },
        {
            "id": 3, 
            "name": "Pull-up", 
            "muscle_group": "Back", 
            "difficulty": "Intermediate", 
            "equipment": "Pull-up Bar", 
            "description": "An advanced upper body exercise for building a wide, strong back and biceps."
        },
        {
            "id": 4, 
            "name": "Plank", 
            "muscle_group": "Core", 
            "difficulty": "Beginner", 
            "equipment": "None", 
            "description": "An isometric core strength exercise that involves maintaining a position similar to a push-up for the maximum possible time."
        },
        {
            "id": 5, 
            "name": "Dumbbell Bicep Curl", 
            "muscle_group": "Arms", 
            "difficulty": "Beginner", 
            "equipment": "Dumbbells", 
            "description": "An isolation exercise that targets the biceps muscles of the upper arm."
        },
        {
            "id": 6, 
            "name": "Dumbbell Shoulder Press", 
            "muscle_group": "Shoulders", 
            "difficulty": "Intermediate", 
            "equipment": "Dumbbells", 
            "description": "A compound exercise for building shoulder strength and size."
        },
        {
            "id": 7, 
            "name": "Lunge", 
            "muscle_group": "Legs", 
            "difficulty": "Beginner", 
            "equipment": "None", 
            "description": "A single-leg bodyweight exercise that works the quadriceps, glutes, and hamstrings."
        },
        {
            "id": 8, 
            "name": "Barbell Deadlift", 
            "muscle_group": "Back", 
            "difficulty": "Advanced", 
            "equipment": "Barbell", 
            "description": "A full-body compound exercise that develops the back, legs, and grip strength."
        },
        {
            "id": 9, 
            "name": "Running (Treadmill)", 
            "muscle_group": "Cardio", 
            "difficulty": "Beginner", 
            "equipment": "None", 
            "description": "An excellent cardiovascular exercise for improving endurance and heart health."
        }
    ]
    
    # Write the list of exercises to the JSON file
    with open('data/exercises.json', 'w') as f:
        # indent=4 makes the JSON file human-readable
        json.dump(exercises, f, indent=4)
        
    print("-> Successfully created data/exercises.json")

def create_user_data():
    """Creates a sample user for testing purposes."""
    
    # In a real application, passwords should always be hashed for security.
    # This is just a placeholder for the prototype.
    users = [
        {
            "id": 1, 
            "username": "testuser", 
            "password": "password123", # WARNING: Not secure! For demo only.
            "goals": "Build Strength", 
            "available_equipment": ["None", "Dumbbells"], 
            "preferred_style": "Strength Training"
        }
    ]
    
    with open('data/users.json', 'w') as f:
        json.dump(users, f, indent=4)
        
    print("-> Successfully created data/users.json")

def initialize_progress_data():
    """Creates an empty file to track user progress."""
    
    # The progress file starts as an empty list. The app will append workout logs to it.
    progress = []
    
    with open('data/user_progress.json', 'w') as f:
        json.dump(progress, f, indent=4)
        
    print("-> Successfully created data/user_progress.json")


# This standard Python construct ensures that the functions are called
# only when the script is executed directly.
if __name__ == '__main__':
    print("Generating initial data for the fitness application...")
    create_exercise_data()
    create_user_data()
    initialize_progress_data()
    print("✅ All data files have been created.")
