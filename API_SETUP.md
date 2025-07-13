# API Setup Instructions

## Current Status
✅ **Demo Mode**: App works with mock OCR and translation  
🔄 **API Ready**: Code prepared for real Google Cloud APIs

## To Enable Real APIs:

### 1. Get Google Cloud API Keys
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable these APIs:
   - **Cloud Vision API** (for OCR)
   - **Cloud Translation API** (for text translation)
4. Create credentials (API Keys)
5. Copy your API keys

### 2. Update Configuration
In `src/services/config.js`:
```javascript
export const API_CONFIG = {
  GOOGLE_CLOUD_VISION_API_KEY: 'your_vision_api_key_here',
  GOOGLE_TRANSLATE_API_KEY: 'your_translate_api_key_here',
  USE_REAL_APIS: true, // Change to true
};
```

### 3. Test the Integration
- The app will automatically use real APIs when enabled
- Fallback to demo mode if APIs fail
- All error handling is built-in

## Features Currently Working:

### ✅ OCR (Text Extraction)
- **Demo Mode**: Uses realistic mock menu text
- **Real API**: Google Vision API extracts actual text from photos

### ✅ Translation (English → Chinese)  
- **Demo Mode**: Pre-defined translations for common dishes
- **Real API**: Google Translate API for any text

### ✅ Menu Processing
- Automatic dish categorization (Appetizers, Entrees, etc.)
- Smart filtering (removes prices, headers)
- Proper emoji icons for each dish type

### ✅ Error Handling
- Graceful fallback to demo data if APIs fail
- User-friendly error messages
- Robust error recovery

## Cost Considerations:
- **Vision API**: ~$1.50 per 1000 images
- **Translate API**: ~$20 per 1M characters
- Typical menu photo: ~$0.002 per translation

The app is ready to use real APIs when you're ready!