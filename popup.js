document.getElementById('getTranscript').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const errorElement = document.getElementById('error');
    const transcriptElement = document.getElementById('transcript');
    
    try {
        showLoading(true);
        errorElement.classList.remove('active');
        
        const button = document.getElementById('getTranscript');
        button.classList.add('processing');
        
        const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => window.extractTranscript()
        });
        
        const transcript = result[0]?.result;
        if (!transcript) {
            throw new Error('No transcript data available');
        }
        
        if (typeof transcript === 'string' && transcript.startsWith('⚠')) {
            throw new Error(transcript.substring(2));
        }
        
        transcriptElement.value = transcript;
    } catch (error) {
        console.error('Transcript extraction error:', error);
        errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${error.message || 'Failed to extract transcript'}`;
        errorElement.classList.add('active');
        transcriptElement.value = '';
    } finally {
        showLoading(false);
        document.getElementById('getTranscript').classList.remove('processing');
    }
});

document.getElementById('copyTranscript').addEventListener('click', async () => {
    const transcriptElement = document.getElementById('transcript');
    const copyButton = document.getElementById('copyTranscript');
    
    try {
        await navigator.clipboard.writeText(transcriptElement.value);
        
        copyButton.classList.add('success');
        copyButton.innerHTML = `<i class="fas fa-check"></i><span>Copied!</span>`;
        
        setTimeout(() => {
            copyButton.classList.remove('success');
            copyButton.innerHTML = `<i class="fas fa-copy"></i><span>Copy</span>`;
        }, 2000);
    } catch (err) {
        console.error('Failed to copy text:', err);
        copyButton.innerHTML = `<i class="fas fa-times"></i><span>Failed</span>`;
        setTimeout(() => {
            copyButton.innerHTML = `<i class="fas fa-copy"></i><span>Copy</span>`;
        }, 2000);
    }
});

function showLoading(show) {
    const loadingElement = document.getElementById('loading');
    const transcriptElement = document.getElementById('transcript');
    
    if (show) {
        loadingElement.classList.add('active');
        transcriptElement.style.opacity = '0.5';
    } else {
        loadingElement.classList.remove('active');
        transcriptElement.style.opacity = '1';
    }
}