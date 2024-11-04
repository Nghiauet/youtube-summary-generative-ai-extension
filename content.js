import { YoutubeTranscript } from 'youtube-transcript';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";

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

async function generateSummary(text) {
    try {
        // Input validation
        if (!text || text.trim().length === 0) {
            throw new Error('No text provided to summarize');
        }

        // Initialize Gemini AI with safety settings
        const apiKey = "AIzaSyD71WGdepjZOC4uf3smuqY4zkYRtzYHKHw";
        const genAI = new GoogleGenerativeAI(apiKey);

        // Configure comprehensive safety settings
        const safetySettings = [
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            }
        ];

        // Initialize model with enhanced configuration
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            safetySettings,
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        });

        // Craft a detailed prompt for better summaries
        const prompt = `
            Please provide a comprehensive yet concise summary of the following video transcript.
            Focus on:
            - Main topics and key points
            - Important conclusions or takeaways
            - Any significant data or statistics mentioned
            - Key relationships between concepts
            
            If the transcript is not in English, please translate it first.
            Format the summary with clear sections and bullet points where appropriate.
            
            Transcript:
            ${text}
        `;

        // Generate content with error handling
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const summary = response.text();

        // Validate output
        if (!summary || summary.trim().length === 0) {
            throw new Error('Failed to generate a meaningful summary');
        }

        // Format summary for better readability
        const formattedSummary = summary
            .replace(/•/g, '◆')  // Replace bullets with diamonds
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n\n');

        console.log("Summary generated successfully:", formattedSummary);
        return formattedSummary;

    } catch (error) {
        console.error('Summary generation error:', error);
        
        // Enhanced error handling with specific messages
        if (error.message.includes('API key')) {
            throw new Error('❌ Invalid API key or quota exceeded. Please try again later.');
        }
        if (error.message.includes('SAFETY')) {
            throw new Error('⚠️ Content was blocked by safety filters. Please check the content and try again.');
        }
        if (error.message.includes('timeout')) {
            throw new Error('⏳ Request timed out. Please try again with a shorter transcript.');
        }
        
        throw new Error(`🔴 Summary generation failed: ${error.message}`);
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

// Function to create and add the transcript button to YouTube's player controls
function createTranscriptButton() {
    if (document.querySelector('.transcript-btn')) return;

    const playerControls = document.querySelector('.ytp-right-controls');
    if (!playerControls) return;

    const transcriptButton = document.createElement('button');
    transcriptButton.className = 'ytp-button transcript-btn';
    transcriptButton.title = 'Show Transcript';
    transcriptButton.innerHTML = `
        <svg height="100%" viewBox="0 0 24 24" width="100%">
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6zm0 4h8v2H6zm10 0h2v2h-2zm-6-4h8v2h-8z" fill="currentColor"/>
        </svg>
    `;

    transcriptButton.addEventListener('click', () => {
        const panel = document.getElementById('transcript-panel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        } else {
            createTranscriptPanel();
        }
    });

    playerControls.appendChild(transcriptButton);
}

// Function to create and inject the transcript panel
function createTranscriptPanel() {
    if (document.getElementById('transcript-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'transcript-panel';
    panel.className = 'transcript-panel';
    
    panel.innerHTML = `
        <div class="transcript-header">
            <h2>YouTube Transcript</h2>
            <div class="transcript-controls">
                <button id="getTranscript" class="transcript-btn">
                    <svg height="16" viewBox="0 0 16 16" width="16">
                        <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z" fill="currentColor"/>
                        <path d="M8 3.5a.5.5 0 01.5.5v4a.5.5 0 01-.5.5H4a.5.5 0 010-1h3.5V4a.5.5 0 01.5-.5z" fill="currentColor"/>
                    </svg>
                    Extract
                </button>
                <button id="copyTranscript" class="transcript-btn">
                    <svg height="16" viewBox="0 0 16 16" width="16">
                        <path d="M4 2a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V2z" fill="currentColor"/>
                        <path d="M2 4a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-8a2 2 0 00-2-2H2z" fill="currentColor"/>
                    </svg>
                    Copy
                </button>
                <button id="summarizeTranscript" class="transcript-btn">
                    <svg height="16" viewBox="0 0 16 16" width="16">
                        <path d="M2 2a1 1 0 011-1h10a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V2z" fill="currentColor"/>
                        <path d="M4 4h8v2H4V4zm0 3h8v2H4V7zm0 3h4v2H4v-2z" fill="currentColor"/>
                    </svg>
                    Summarize
                </button>
            </div>
        </div>
        <div class="transcript-content">
            <textarea id="transcript-text" placeholder="Transcript will appear here..." readonly></textarea>
            <div id="summary" style="display: none;"></div>
        </div>`;

    // Find the primary content area
    const primaryContent = document.querySelector('#primary-inner') || 
                          document.querySelector('#primary');
    
    if (primaryContent) {
        // Insert after the video player but before the comments
        const videoPlayer = primaryContent.querySelector('#player');
        if (videoPlayer) {
            videoPlayer.parentNode.insertBefore(panel, videoPlayer.nextSibling);
        } else {
            primaryContent.insertBefore(panel, primaryContent.firstChild);
        }
    }

    // Initialize event listeners
    initializeEventListeners();
}

// Initialize event listeners for the panel buttons
function initializeEventListeners() {
    const getTranscriptBtn = document.getElementById('getTranscript');
    const copyTranscriptBtn = document.getElementById('copyTranscript');
    const summarizeBtn = document.getElementById('summarizeTranscript');

    getTranscriptBtn?.addEventListener('click', handleGetTranscript);
    copyTranscriptBtn?.addEventListener('click', handleCopyTranscript);
    summarizeBtn?.addEventListener('click', handleSummarize);
}

// Handler for getting the transcript
async function handleGetTranscript() {
    const transcriptArea = document.getElementById('transcript-text');
    let dots = '';
    const loadingInterval = setInterval(() => {
        dots = dots.length < 3 ? dots + '.' : '';
        transcriptArea.value = `Extracting transcript${dots}`;
    }, 500);
    
    try {
        const transcript = await extractTranscript();
        clearInterval(loadingInterval);
        if (typeof transcript === 'string' && transcript.startsWith('⚠')) {
            transcriptArea.value = transcript;
            return;
        }
        transcriptArea.value = transcript;
    } catch (error) {
        clearInterval(loadingInterval);
        transcriptArea.value = '⚠ Error extracting transcript: ' + error.message;
    }
}

// Handler for copying the transcript
function handleCopyTranscript() {
    const transcriptArea = document.getElementById('transcript-text');
    transcriptArea.select();
    document.execCommand('copy');
    
    // Visual feedback
    const copyBtn = document.getElementById('copyTranscript');
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
        copyBtn.textContent = originalText;
    }, 2000);
}

// Handler for summarizing the transcript
async function handleSummarize() {
    const transcriptArea = document.getElementById('transcript-text');
    const summaryDiv = document.getElementById('summary');
    
    if (!transcriptArea.value) {
        alert('Please extract the transcript first.');
        return;
    }

    if (!summaryDiv) {
        console.error('Summary div not found');
        return;
    }

    let dots = '';
    const loadingInterval = setInterval(() => {
        dots = dots.length < 3 ? dots + '.' : '';
        summaryDiv.textContent = `Generating summary${dots}`;
    }, 500);
    summaryDiv.style.display = 'block';

    try {
        const summary = await generateSummary(transcriptArea.value);
        clearInterval(loadingInterval);
        summaryDiv.innerHTML = summary;
    } catch (error) {
        clearInterval(loadingInterval);
        if (summaryDiv) {
            summaryDiv.textContent = '⚠ Error generating summary: ' + error.message;
        }
    }
}

// Format transcript for display
function formatTranscript(transcript) {
    return transcript.map(entry => {
        const time = formatTimestamp(entry.start);
        return `[${time}] ${entry.text}`;
    }).join('\n');
}

// Function to initialize the extension
function initializeExtension() {
    createTranscriptButton();
    createTranscriptPanel();
}

// Watch for YouTube navigation (since YouTube is a SPA)
const observer = new MutationObserver((mutations) => {
    if (window.location.pathname === '/watch' && !document.querySelector('.transcript-btn')) {
        initializeExtension();
    }
});

// Start observing
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Initial run
if (window.location.pathname === '/watch') {
    initializeExtension();
}