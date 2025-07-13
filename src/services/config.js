// API Configuration
// Replace these with your actual API keys from Google Cloud Console

export const API_CONFIG = {
  // Google Cloud Vision API Key
  // Get from: https://console.cloud.google.com/apis/credentials
  GOOGLE_CLOUD_VISION_API_KEY: process.env.GOOGLE_CLOUD_VISION_API_KEY || 'YOUR_VISION_API_KEY_HERE',
  
  // Google Translate API Key  
  // Get from: https://console.cloud.google.com/apis/credentials
  GOOGLE_TRANSLATE_API_KEY: process.env.GOOGLE_TRANSLATE_API_KEY || 'YOUR_TRANSLATE_API_KEY_HERE',
  
  // Enable/disable API usage (set to false to use mock data only)
  USE_REAL_APIS: false, // Set to true when you have API keys
};

// API URLs
export const API_URLS = {
  VISION: `https://vision.googleapis.com/v1/images:annotate?key=${API_CONFIG.GOOGLE_CLOUD_VISION_API_KEY}`,
  TRANSLATE: `https://translation.googleapis.com/language/translate/v2?key=${API_CONFIG.GOOGLE_TRANSLATE_API_KEY}`,
};