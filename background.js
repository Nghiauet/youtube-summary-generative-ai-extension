import { YoutubeTranscript } from 'youtube-transcript';

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background script received message:', request);

    // Handle fetchTranscript action
    if (request.action === 'fetchTranscript') {
        YoutubeTranscript.fetchTranscript(request.videoId)
            .then(transcript => {
                console.log('Transcript fetched successfully:', transcript);
                sendResponse({ transcript: transcript });
            })
            .catch(error => {
                console.error('Error fetching transcript:', error);
                sendResponse({ error: error.message });
            });
        
        // Return true to indicate we will send a response asynchronously
        return true;
    }
});