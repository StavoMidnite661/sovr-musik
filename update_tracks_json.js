// update_tracks_json.js
const fs = require('fs');
const path = require('path');

const tracksJsonPath = path.join(__dirname, 'tracks.json');
const renamedTracksMapPath = path.join(__dirname, 'renamed_tracks_map.json');

try {
    let renamedTracksMapContent = fs.readFileSync(renamedTracksMapPath, 'utf8');
    let renamedTracksMap;
    try {
        renamedTracksMap = JSON.parse(renamedTracksMapContent.trim());
    } catch (e) {
        console.error("Error parsing renamed_tracks_map.json:", e.message);
        console.error("Problematic content (first 500 chars):", renamedTracksMapContent.substring(0, 500));
        throw e;
    }

    const tracksJsonContent = fs.readFileSync(tracksJsonPath, 'utf8');
    const tracks = JSON.parse(tracksJsonContent); 

    const updatedTracks = tracks.map(track => {
        const keyForLookup = track.src.replace(/^tracks\//, ''); 

        let mappedFilename = null;

        if (renamedTracksMap[keyForLookup]) {
            mappedFilename = renamedTracksMap[keyForLookup];
        }
        
        if (mappedFilename) {
            track.src = `tracks/${mappedFilename}`;
        } else {
            console.warn(`Warning: Could not find a mapping for original track source: ${track.src} (Lookup key used: '${keyForLookup}')`);
        }
        
        return track;
    });

    fs.writeFileSync(tracksJsonPath, JSON.stringify(updatedTracks, null, 4), 'utf8');

    console.log('tracks.json updated successfully with new filenames.');
} catch (error) {
    console.error('Error updating tracks.json:', error);
}
