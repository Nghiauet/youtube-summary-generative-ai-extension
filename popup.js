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

document.getElementById('getSummary').addEventListener('click', async () => {
    const transcriptElement = document.getElementById('transcript');
    const summaryContainer = document.getElementById('summaryContainer');
    const summaryText = document.getElementById('summaryText');
    const errorElement = document.getElementById('error');
    
    if (!transcriptElement.value.trim()) {
        errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> Please get transcript first`;
        errorElement.classList.add('active');
        return;
    }
    
    try {
        showLoading(true);
        errorElement.classList.remove('active');
        
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (transcriptText) => {
                return window.getSummary(transcriptText);
            },
            args: [transcriptElement.value]
        });
        
        const summary = result[0]?.result;
        
        if (!summary) {
            throw new Error('No summary generated');
        }
        
        summaryText.textContent = summary;
        summaryContainer.style.display = 'block';
        
    } catch (error) {
        console.error('Summary generation error:', error);
        errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${error.message || 'Failed to generate summary'}`;
        errorElement.classList.add('active');
        summaryContainer.style.display = 'none';
    } finally {
        showLoading(false);
    }
});

function showLoading(show) {
    const loadingElement = document.getElementById('loading');
    if (show) {
        loadingElement.classList.add('active');
    } else {
        loadingElement.classList.remove('active');
    }
}