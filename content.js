import { YoutubeTranscript } from 'youtube-transcript';
import { GoogleGenerativeAI } from "@google/generative-ai";

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
                const cleanText = decodeHTMLEntities(entry.text);
                return `${timestamp} ${cleanText}`;
            })
            .join('\n');

        return formattedTranscript;

    } catch (error) {
        console.error('Transcript extraction error:', error);
        return `⚠ ${error.message}`;
    }
}

function formatTimestamp(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Function to get summary using Gemini
async function getSummary(text) {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: {
                maxOutputTokens: 1000,
                temperature: 0.4
            }
        });

        const prompt = `Please provide a concise summary of the following video transcript. Focus on the main points and key takeaways:\n\n${text}`;

        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error('Summary generation error:', error);
        throw new Error('Failed to generate summary. Please try again.');
    }
}

// Add this new function to decode HTML entities
function decodeHTMLEntities(text) {
    // First replace common HTML entities
    const entities = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&apos;': "'",
        '&#x27;': "'",
        '&#x2F;': '/',
        '&#32;': ' ',
        '&nbsp;': ' '
    };
    
    // Replace named entities
    text = text.replace(/&[a-z]+;/gi, entity => entities[entity] || entity);
    
    // Replace numeric entities (both decimal and hexadecimal)
    text = text.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
    text = text.replace(/&#x([a-f0-9]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
    
    // Use textarea for any remaining entities
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}

// Make functions available to the popup
window.extractTranscript = extractTranscript;
window.getSummary = getSummary;