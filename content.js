import { YoutubeTranscript } from 'youtube-transcript';

// Main function to extract transcript
async function extractTranscript() {
    try {
        // Get video ID from current URL
        const url = window.location.href;
        const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
        
        if (!videoId) {
            throw new Error('Could not find a valid YouTube video ID');
        }

        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        if (!transcript || transcript.length === 0) {
            throw new Error('No transcript available for this video');
        }

        // Format the transcript
        const formattedTranscript = transcript
            .map(entry => {
                const timestamp = formatTimestamp(entry.offset / 1000);
                return `${timestamp} ${entry.text}`;
            })
            .join('\n');

        return formattedTranscript;

    } catch (error) {
        console.error('Transcript extraction error:', error);
        return `⚠ ${error.message}`;
    }
}

function formatTimestamp(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Make it available to the popup
window.extractTranscript = extractTranscript;