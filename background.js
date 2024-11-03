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