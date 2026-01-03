import os
import re

TRACKS_DIR = "tracks"

def clean_filename(filename):
    # Replace smart quotes with standard ASCII equivalents, or remove problematic ones
    cleaned_name = filename.replace('“', '').replace('”', '') # Remove smart double quotes
    cleaned_name = cleaned_name.replace('’', "'").replace('‘', "'") # Replace smart single quotes with ASCII
    cleaned_name = cleaned_name.replace('–', '-') # En dash to hyphen
    
    # Remove any other characters that are invalid in Windows filenames
    # This list is more comprehensive for Windows
    invalid_chars_pattern = r'[<>:"/\\|?*]'
    cleaned_name = re.sub(invalid_chars_pattern, '', cleaned_name)

    # Normalize spaces: replace multiple spaces with single space, then strip
    cleaned_name = re.sub(r'\s+', ' ', cleaned_name).strip()
    return cleaned_name

def main():
    print(f"Starting file renaming process in '{TRACKS_DIR}' directory...")
    
    renames_performed = []
    
    # Get all entries in the tracks directory
    try:
        current_filenames = os.listdir(TRACKS_DIR)
    except FileNotFoundError:
        print(f"Error: Directory '{TRACKS_DIR}' not found.")
        return
    except Exception as e:
        print(f"Error listing directory '{TRACKS_DIR}': {e}")
        return

    # Filter for actual media files (mp4, mp3, wav etc.) and exclude image files
    media_filenames = [f for f in current_filenames if f.lower().endswith(('.mp4', '.mp3', '.wav'))]

    for original_name in media_filenames:
        full_original_path = os.path.join(TRACKS_DIR, original_name)
        
        cleaned_name = clean_filename(original_name)
        full_new_path = os.path.join(TRACKS_DIR, cleaned_name)

        if original_name != cleaned_name:
            # Check if the cleaned_name already exists and is different from original_name
            # This can happen if two original files clean to the same name
            if os.path.exists(full_new_path) and full_new_path != full_original_path:
                print(f"Warning: Cleaned name '{cleaned_name}' for '{original_name}' already exists. Skipping rename to avoid overwrite.")
                continue

            try:
                os.rename(full_original_path, full_new_path)
                renames_performed.append((original_name, cleaned_name))
                print(f"Renamed: '{original_name}' -> '{cleaned_name}'")
            except Exception as e:
                print(f"Error renaming '{original_name}': {e}")
        else:
            print(f"'{original_name}' already clean, no rename needed.")
    
    if not renames_performed:
        print("No media files needed renaming.")
    else:
        print("\nFile renaming process completed.")

if __name__ == "__main__":
    main()
