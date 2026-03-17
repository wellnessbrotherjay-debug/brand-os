
import fs from 'fs';
import path from 'path';

// Read existing exercise library
const libraryContent = fs.readFileSync('lib/lib/exercise-library.ts', 'utf-8');
const videoList = JSON.parse(fs.readFileSync('scripts/cloudflare_videos.json', 'utf-8'));

// Extract mappings from the library file
// Matches pattern: name: "...", ... video: buildVideoPath("...")
const exerciseRegex = /name:\s*"([^"]+)",[\s\S]*?video:\s*buildVideoPath\("([^"]+)"\)/g;
let match;
const localExercises = [];

while ((match = exerciseRegex.exec(libraryContent)) !== null) {
    localExercises.push({
        name: match[1],
        filename: match[2]
    });
}

console.log(`Found ${localExercises.length} local exercises with buildVideoPath references.`);

const mappings = [];
const missing = [];

for (const exercise of localExercises) {
    // Try exact filename match first
    let cloudflareVideo = videoList.find(v => v.filename === exercise.filename || v.name === exercise.filename);
    
    // If not found, try clean match (case insensitive, trimmed)
    if (!cloudflareVideo) {
        const cleanFilename = exercise.filename.toLowerCase().trim();
        cloudflareVideo = videoList.find(v => {
            const vFile = (v.filename || '').toLowerCase().trim();
            const vName = (v.name || '').toLowerCase().trim();
            return vFile === cleanFilename || vName === cleanFilename;
        });
    }

    if (cloudflareVideo) {
        mappings.push({
            exercise: exercise.name,
            filename: exercise.filename,
            cloudflareId: cloudflareVideo.id
        });
    } else {
        missing.push(exercise.filename);
    }
}

console.log(`Successfully mapped ${mappings.length} exercises.`);
if (missing.length > 0) {
    console.log(`Missing videos for ${missing.length} exercises: ${missing.join(', ')}`);
}

// Generate the updated file content
let updatedContent = libraryContent;

// We want to replace the buildVideoPath calls with the actual Cloudflare IDs
// But wait, the user might want us to keep the buildVideoPath logic and just update the mapping inside it.
// Actually, it's better to update the exercise definition directly to use the ID if we have it, 
// or keep buildVideoPath if we don't.

for (const map of mappings) {
    // Replace buildVideoPath("filename.MP4") with "cloudflareId"
    const target = `buildVideoPath("${map.filename}")`;
    const replacement = `"${map.cloudflareId}"`;
    // Escape dots in filename for regex
    const escapedTarget = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedTarget, 'g');
    updatedContent = updatedContent.replace(regex, replacement);
}

fs.writeFileSync('lib/lib/exercise-library.ts.updated', updatedContent);
console.log('Generated lib/lib/exercise-library.ts.updated');
