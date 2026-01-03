# clean_tracks_json.py
import json
import sys

try:
    # Use 'utf-8-sig' to handle BOM correctly
    with open('tracks.json', 'r', encoding='utf-8-sig') as f:
        data = json.load(f)
    # Write back with standard 'utf-8' and proper indentation
    with open('tracks.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    print("tracks.json cleaned and re-written successfully.")
except Exception as e:
    print(f"Error cleaning tracks.json: {e}", file=sys.stderr)