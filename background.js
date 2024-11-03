// Import the package
import { YoutubeTranscript } from 'youtube-transcript';

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getTranscript') {
        YoutubeTranscript.fetchTranscript(request.videoId)
            .then(transcript => {
                const formattedTranscript = formatTranscript(transcript);
                sendResponse({ success: true, transcript: formattedTranscript });
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });
        return true; // Required for async response
    }
});

function formatTranscript(transcript) {
    return transcript
        .map(entry => {
            const timestamp = formatTimestamp(entry.offset);
            return `${timestamp} ${entry.text}`;
        })
        .join('\n');
}

function formatTimestamp(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
} 