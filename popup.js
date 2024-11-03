document.getElementById('getTranscript').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error');
    const transcriptElement = document.getElementById('transcript');
    
    try {
        loadingElement.classList.add('active');
        errorElement.classList.remove('active');
        
        const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => window.extractTranscript()
        });
        
        // Add null check and better error handling
        const transcript = result[0]?.result;
        if (!transcript) {
            throw new Error('No transcript data available');
        }
        
        // Only check startsWith if we have a string
        if (typeof transcript === 'string' && transcript.startsWith('⚠')) {
            throw new Error(transcript.substring(2));
        }
        
        transcriptElement.value = transcript;
    } catch (error) {
        console.error('Transcript extraction error:', error);
        errorElement.textContent = `Error: ${error.message || 'Failed to extract transcript'}`;
        errorElement.classList.add('active');
        transcriptElement.value = ''; // Clear transcript area on error
    } finally {
        loadingElement.classList.remove('active');
    }
});