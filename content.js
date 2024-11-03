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
        // const summary = await getSummary(formattedTranscript);

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
        if (!text) {
            throw new Error('No text provided to summarize');
        }

        console.log('Starting getSummary function with text length:', text.length);
        
        if (!apiKey) {
            throw new Error('API key is not configured');
        }
        console.log('API Key loaded');
        
        const genAI = new GoogleGenerativeAI(apiKey);
        console.log('GenAI instance created');
        
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: {
                maxOutputTokens: 1000,
                temperature: 0.4
            }
        });
        console.log('Model configured');

        // Use the actual transcript text instead of 'Hello'
        const prompt = `Please summarize the following transcript:\n\n${text}`;
    
        const result = await model.generateContentStream(prompt);

        // Print text as it comes in.
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
                process.stdout.write(chunkText);
                }
        return response;
    } catch (error) {
        console.error('Detailed error in getSummary:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        throw new Error(`Failed to generate summary: ${error.message}`);
    }
}

// Automatically generate summary after getting transcrip

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