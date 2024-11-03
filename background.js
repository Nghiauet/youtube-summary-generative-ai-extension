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



function formatTimestamp(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
} 

function formatTranscript(transcript) {
    return transcript
        .map(entry => {
            const timestamp = formatTimestamp(entry.offset);
            // Clean up the text by decoding HTML entities
            const cleanText = decodeHTMLEntities(entry.text);
            return `${timestamp} ${cleanText}`;
        })
        .join('\n');
}

// Add this new function to decode HTML entities
function decodeHTMLEntities(text) {
    const entities = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&apos;': "'",
        '&#x27;': "'",
        '&#x2F;': '/',
        '&#x60;': '`',
        '&nbsp;': ' '
    };
    
    return text.replace(/&[#\w]+;/g, entity => {
        // Use the mapping if available, otherwise try to decode using textarea
        if (entities[entity]) {
            return entities[entity];
        }
        const textarea = document.createElement('textarea');
        textarea.innerHTML = entity;
        return textarea.value;
    });
}