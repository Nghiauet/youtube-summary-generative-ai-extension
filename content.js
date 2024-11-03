import { YoutubeTranscript } from 'youtube-transcript';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";

// Main function to extract transcript
async function extractTranscript() {
    try {
        // Get video ID from current URL
        const url = window.location.href;
        const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
        
        if (!videoId) {
            throw new Error('Could not find a valid YouTube video ID');
        }

        // Try to get English transcript first
        let transcript;
        try {
            transcript = await YoutubeTranscript.fetchTranscript(videoId, {
                lang: 'en'
            });
        } catch (error) {
            // If English not available, get default transcript
            transcript = await YoutubeTranscript.fetchTranscript(videoId);
        }

        if (!transcript || transcript.length === 0) {
            throw new Error('Failed to get transcript');
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
        if (!text) {
            throw new Error('No text provided to summarize');
        }

        const apiKey = "AIzaSyD71WGdepjZOC4uf3smuqY4zkYRtzYHKHw";
        const genAI = new GoogleGenerativeAI(apiKey);

        const safetySettings = [
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
            }
        ];

        const model = genAI.getGenerativeModel({ 
            model: "gemini-pro",
            safetySettings: safetySettings
        });

        const prompt = `Please provide a concise summary of the following video transcript. Focus on the main points and key takeaways. If the transcript is not in English, please translate it to English first:\n\n${text}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const summary = response.text();

        if (!summary || summary.trim().length === 0) {
            throw new Error('Failed to generate summary');
        }

        console.log("Summary generated:", summary);
        return summary;

    } catch (error) {
        console.error('Summary generation error:', error);
        if (error.message.includes('API key')) {
            throw new Error('Invalid API key or API quota exceeded');
        }
        if (error.message.includes('SAFETY')) {
            throw new Error('Content was blocked due to safety filters');
        }
        throw error;
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