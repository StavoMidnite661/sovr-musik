import os
import re
import json

TRACKS_JSON_PATH = "tracks.json"
TRACKS_DIR = "tracks"

def clean_string_for_title(text):
    # This cleaning is for the title field, which can be more permissive than filenames
    # Replace smart quotes with standard ASCII equivalents
    cleaned_text = text.replace('“', '"').replace('”', '"')
    cleaned_text = cleaned_text.replace('’', "'").replace('‘', "'")
    cleaned_text = cleaned_text.replace('–', '-') # En dash to hyphen
    
    # Normalize spaces: replace multiple spaces with single space, then strip
    cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()
    return cleaned_text

def clean_filename_for_match(filename):
    # This should match the cleaning logic used for actual file renames
    cleaned_name = filename.replace('“', '').replace('”', '') # Remove smart double quotes
    cleaned_name = cleaned_name.replace('’', "'").replace('‘', "'") # Replace smart single quotes with ASCII
    cleaned_name = cleaned_name.replace('–', '-') # En dash to hyphen
    
    invalid_chars_pattern = r'[<>:"/\\|?*]'
    cleaned_name = re.sub(invalid_chars_pattern, '', cleaned_name)

    cleaned_name = re.sub(r'\s+', ' ', cleaned_name).strip()
    return cleaned_name


def update_tracks_json():
    print(f"Starting to update '{TRACKS_JSON_PATH}'...")
    
    # 1. Read existing tracks.json
    try:
        with open(TRACKS_JSON_PATH, 'r', encoding='utf-8') as f:
            tracks_data = json.load(f)
    except FileNotFoundError:
        print(f"Error: '{TRACKS_JSON_PATH}' not found.")
        return
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON from '{TRACKS_JSON_PATH}': {e}")
        return

    # 2. Get current list of filenames in the tracks directory
    try:
        current_physical_filenames = os.listdir(TRACKS_DIR)
        # Create a map from cleaned filename to actual filename for easy lookup
        physical_file_map = {clean_filename_for_match(f): f for f in current_physical_filenames if f.lower().endswith(('.mp4', '.mp3', '.wav'))}
        physical_file_set = set(physical_file_map.keys())
    except FileNotFoundError:
        print(f"Error: Directory '{TRACKS_DIR}' not found.")
        return

    updated_tracks_data = []
    num_updates = 0
    num_missing_files = 0

    for track in tracks_data:
        original_src = track.get('src')
        if not original_src:
            updated_tracks_data.append(track) # Keep track if no src
            continue

        # Extract just the filename from the src path
        original_filename_in_json = os.path.basename(original_src)
        
        # Clean the filename from JSON using the same logic as the physical files
        cleaned_filename_in_json = clean_filename_for_match(original_filename_in_json)

        # Check if this cleaned filename exists in our physical file set
        if cleaned_filename_in_json in physical_file_set:
            # Found a match, use the actual physical filename (from physical_file_map)
            # to ensure correct casing etc.
            actual_physical_filename = physical_file_map[cleaned_filename_in_json]
            new_src_path = f"{TRACKS_DIR}/{actual_physical_filename}" # Use forward slashes for web paths
            
            if track['src'] != new_src_path:
                track['src'] = new_src_path
                num_updates += 1
            
            # Also clean the title field
            cleaned_title = clean_string_for_title(track.get('title', ''))
            if track.get('title') != cleaned_title:
                track['title'] = cleaned_title
                num_updates += 1

            updated_tracks_data.append(track)
        else:
            print(f"Warning: Track '{original_filename_in_json}' (from JSON) does not have a corresponding physical file in '{TRACKS_DIR}'. Keeping its entry.")
            num_missing_files += 1
            updated_tracks_data.append(track) # Append even if missing, user can decide to remove later.
            
    # 3. Write updated tracks.json
    if num_updates > 0 or num_missing_files > 0: # Only write if changes or warnings occurred
        try:
            with open(TRACKS_JSON_PATH, 'w', encoding='utf-8') as f:
                json.dump(updated_tracks_data, f, indent=4, ensure_ascii=False)
            print(f"Successfully updated '{TRACKS_JSON_PATH}'. {num_updates} fields updated, {num_missing_files} physical files missing from JSON entries.")
        except Exception as e:
            print(f"Error writing to '{TRACKS_JSON_PATH}': {e}")
    else:
        print(f