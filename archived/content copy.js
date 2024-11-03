async function extractTranscript() {
    try {
        // Get video ID from current URL
        const videoId = new URLSearchParams(window.location.search).get('v');
        if (!videoId) {
            return '⚠ Could not find video ID. Make sure you are on a YouTube video page.';
        }

        const YT_INITIAL_PLAYER_RESPONSE_RE = /ytInitialPlayerResponse\s*=\s*({.+?})\s*;\s*(?:var\s+(?:meta|head)|<\/script|\n)/;
        let player = window.ytInitialPlayerResponse;

        if (!player || videoId !== player.videoDetails?.videoId) {
            const response = await fetch('https://www.youtube.com/watch?v=' + videoId);
            const body = await response.text();
            
            const playerResponse = body.match(YT_INITIAL_PLAYER_RESPONSE_RE);
            if (!playerResponse) {
                return '⚠ Unable to parse player response';
            }
            player = JSON.parse(playerResponse[1]);
        }

        const metadata = {
            title: player.videoDetails.title,
            duration: player.videoDetails.lengthSeconds,
            author: player.videoDetails.author,
            views: player.videoDetails.viewCount
        };

        // Get the tracks and sort them by priority
        const tracks = player.captions?.playerCaptionsTracklistRenderer?.captionTracks;
        if (!tracks?.length) {
            return '⚠ No captions available for this video';
        }

        tracks.sort(compareTracks);

        // Get the transcript
        const transcriptResponse = await fetch(tracks[0].baseUrl + '&fmt=json3');
        const transcript = await transcriptResponse.json();

        const parsedTranscript = transcript.events
            // Remove invalid segments
            .filter(x => x.segs)
            // Concatenate into single long string with timestamps
            .map(x => {
                const timestamp = formatTimestamp(x.tStartMs / 1000);
                const text = x.segs
                    .map(y => y.utf8)
                    .join(' ')
                    .trim();
                return `${timestamp} ${text}`;
            })
            .join('\n')
            // Remove invalid characters
            .replace(/[\u200B-\u200D\uFEFF]/g, '')
            // Replace multiple spaces with single space
            .replace(/\s+/g, ' ');

        return parsedTranscript;

    } catch (error) {
        console.error('Transcript extraction error:', error);
        return `⚠ Error extracting transcript: ${error.message}`;
    }
}

// Helper function to format timestamp
function formatTimestamp(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Helper function to compare and sort caption tracks
function compareTracks(track1, track2) {
    const langCode1 = track1.languageCode;
    const langCode2 = track2.languageCode;

    if (langCode1 === 'en' && langCode2 !== 'en') {
        return -1; // English comes first
    } else if (langCode1 !== 'en' && langCode2 === 'en') {
        return 1; // English comes first
    } else if (track1.kind !== 'asr' && track2.kind === 'asr') {
        return -1; // Non-ASR comes first
    } else if (track1.kind === 'asr' && track2.kind !== 'asr') {
        return 1; // Non-ASR comes first
    }

    return 0; // Preserve order if both have same priority
}

// Execute and return result
extractTranscript();