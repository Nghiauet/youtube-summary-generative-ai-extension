# Youtube Summary Generative AI Extension

## Installation

1. Clone this repository
2. Install dependencies:
```bash
npm install
```
3. Build the extension:
```bash
npm run dev
```
4. Load the extension in Chrome by navigating to `chrome://extensions/` and clicking "Load unpacked". Select the folder.
# Google Gemini API Integration

This project uses the Google Gemini API for AI functionality. Follow these steps to set up your API key.

## Getting Started

### 1. Get Your API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your generated API key

### 2. Configure Environment Variables
1. Create a `.env` file in the root directory of the project
2. Add your API key to the `.env` file:
```env
GOOGLE_API_KEY=your_api_key_here
```

### Important Notes
- Never commit your `.env` file to version control
- Keep your API key secure and private
- Make sure `.env` is listed in your `.gitignore` file

## Usage
The application will automatically load the API key from your `.env` file when needed.
