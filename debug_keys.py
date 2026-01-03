# debug_keys.py
import json
import sys
import re

try:
    with open('renamed_tracks_map.json', 'r', encoding='utf-8') as f:
        renamed_tracks_map_content = f.read()
        first_brace = renamed_tracks_map_content.find('{')
        last_brace = renamed_tracks_map_content.rfind('}')
        if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
            cleaned_json_string = renamed_tracks_map_content[first_brace : last_brace + 1]
        else:
            raise ValueError("Could not find a valid JSON object structure in renamed_tracks_map.json")
        renamed_tracks_map = json.loads(cleaned_json_string)

    print("--- Keys from renamed_tracks_map.json ---")
    for key in renamed_tracks_map.keys():
        print(f"Map Key: '{key}'")

    with open('tracks.json', 'r', encoding='utf-8') as f:
        tracks = json.load(f)

    print("\n--- Lookup Keys generated from tracks.json ---")
    for track in tracks:
        # Get the filename part from track.src. 
        # Example: "tracks/\"DON'T ASK ABOUT ME\".mp4" -> "\"DON'T ASK ABOUT ME\".mp4"
        lookup_key = track['src'].replace('tracks/', '')
        print(f"Lookup Key from track.src: '{lookup_key}' (Original src: '{track['src']}')")


except Exception as e:
    print(f"// Error: {e}", file=sys.stderr)
