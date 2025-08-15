import os
from PIL import Image, ImageDraw, ImageFont

# --- SCRIPT CONFIGURATION ---
# This script is designed to be run from the root of your 'fitness-app' directory.

# --- Asset Definitions ---
# This section lists all the assets we need to create.
ASSET_CONFIG = {
    "base_path": "frontend/assets",
    "images": {
        "path": "images",
        "mascots": [
            {"name": "mascot-idle.png", "text": "IDLE", "color": "#3a3a5e", "size": (300, 300)},
            {"name": "mascot-working.png", "text": "WORKING", "color": "#00a0aa", "size": (300, 300)},
            {"name": "mascot-celebrating.png", "text": "CELEBRATING", "color": "#00ff7f", "size": (300, 300)},
        ],
        "badges": {
            "path": "badges",
            "files": [
                {"name": "first_step.png", "text": "First Step"}, {"name": "warrior.png", "text": "Warrior"},
                {"name": "veteran.png", "text": "Veteran"}, {"name": "level_5.png", "text": "LVL 5"},
                {"name": "level_10.png", "text": "LVL 10"}, {"name": "streak_7.png", "text": "Streak 7"},
                {"name": "streak_30.png", "text": "Streak 30"}, {"name": "bodyweight.png", "text": "Bodyweight"},
                {"name": "quest.png", "text": "Quest"}, {"name": "early_bird.png", "text": "Early Bird"},
                {"name": "night_owl.png", "text": "Night Owl"},
            ]
        }
    },
    "videos": {
        "path": "videos",
        "files": [
            "pushup.mp4", "squat.mp4", "pullup.mp4", "plank.mp4", "bicep_curl.mp4",
            "shoulder_press.mp4", "lunge.mp4", "deadlift.mp4", "running.mp4",
        ]
    }
}

# --- Image Generation Function ---
def create_placeholder_image(path, text, size=(300, 300), bg_color="#ff00ff", font_color="#FFFFFF"):
    """Creates a colored placeholder image with centered text."""
    try:
        img = Image.new('RGB', size, color=bg_color)
        draw = ImageDraw.Draw(img)
        
        # Use a basic font, with a fallback for systems that don't have Arial
        try:
            font_size = int(size[1] / 5) # Dynamic font size
            font = ImageFont.truetype("arial.ttf", font_size)
        except IOError:
            font = ImageFont.load_default()
            
        # Calculate text position to center it
        text_bbox = draw.textbbox((0, 0), text, font=font)
        text_width, text_height = text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1]
        position = ((size[0] - text_width) / 2, (size[1] - text_height) / 2)
        
        draw.text(position, text, font=font, fill=font_color)
        img.save(path)
        print(f"  [SUCCESS] Created placeholder image: {path}")
    except Exception as e:
        print(f"  [ERROR] Could not create image {path}: {e}")

# --- Empty File Creation Function ---
def create_empty_file(path):
    """Creates a zero-byte file to serve as a placeholder."""
    try:
        with open(path, 'w') as f:
            pass
        print(f"  [SUCCESS] Created empty placeholder file: {path}")
    except Exception as e:
        print(f"  [ERROR] Could not create file {path}: {e}")

# --- Main Execution Block ---
if __name__ == "__main__":
    print("--- Starting Fitness App Asset Generator ---\n")

    # Define base paths
    base_dir = ASSET_CONFIG['base_path']
    images_dir = os.path.join(base_dir, ASSET_CONFIG['images']['path'])
    badges_dir = os.path.join(images_dir, ASSET_CONFIG['images']['badges']['path'])
    videos_dir = os.path.join(base_dir, ASSET_CONFIG['videos']['path'])

    # 1. Create directory structure
    print("Step 1: Creating directory structure...")
    os.makedirs(badges_dir, exist_ok=True)
    os.makedirs(videos_dir, exist_ok=True)
    print("  [SUCCESS] All directories are ready.\n")

    # 2. Generate Mascot Images
    print("Step 2: Generating Mascot images...")
    for asset in ASSET_CONFIG['images']['mascots']:
        file_path = os.path.join(images_dir, asset["name"])
        create_placeholder_image(file_path, asset["text"], size=asset["size"], bg_color=asset["color"])
    print("  -> Mascot generation complete.\n")
    
    # 3. Generate Badge Icons
    print("Step 3: Generating Badge icons...")
    for asset in ASSET_CONFIG['images']['badges']['files']:
        file_path = os.path.join(badges_dir, asset["name"])
        create_placeholder_image(file_path, asset["text"], size=(150, 150), bg_color="#ff00ff")
    print("  -> Badge generation complete.\n")

    # 4. Generate empty video files (to fix 404s)
    print("Step 4: Generating empty video file placeholders...")
    for filename in ASSET_CONFIG['videos']['files']:
        file_path = os.path.join(videos_dir, filename)
        create_empty_file(file_path)
    print("  -> Video placeholder generation complete.\n")

    print("--- ✅ All assets have been generated successfully! ---")
    print("You can now restart your application.")
