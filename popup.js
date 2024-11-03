document.getElementById('extract').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const transcriptArea = document.getElementById('transcript');
    
    try {
        transcriptArea.value = 'Loading transcript...';
        
        const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => window.extractTranscript()
        });
        
        const transcript = result[0].result;
        if (transcript.startsWith('⚠')) {
            transcriptArea.value = transcript;
        } else {
            transcriptArea.value = transcript || '⚠ No transcript content found';
        }
    } catch (error) {
        console.error('Script execution error:', error);
        transcriptArea.value = '⚠ Error: Make sure you are on a YouTube video page with the transcript panel open';
    }
});