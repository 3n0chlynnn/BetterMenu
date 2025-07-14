import { API_CONFIG, API_URLS } from './config';

// OAuth token cache
let accessToken = null;
let tokenExpiry = null;

export const extractTextFromImage = async (imageUri) => {
  // If APIs are disabled, return demo text
  if (!API_CONFIG.USE_REAL_APIS) {
    return getMockOCRText();
  }

  try {
    // Get access token
    const token = await getAccessToken();
    
    // Convert image to base64
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const base64 = await convertBlobToBase64(blob);
    
    // Remove data:image/jpeg;base64, prefix if present
    const base64Data = base64.split(',')[1] || base64;
    
    const requestBody = {
      requests: [
        {
          image: {
            content: base64Data,
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 1,
            },
          ],
        },
      ],
    };

    const apiResponse = await fetch(API_URLS.VISION, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    const result = await apiResponse.json();
    
    if (result.error) {
      throw new Error(`Vision API Error: ${result.error.message}`);
    }

    const detectedText = result.responses[0]?.textAnnotations?.[0]?.description || '';
    return detectedText;
  } catch (error) {
    console.error('OCR Error:', error);
    // Fallback to mock data if API fails
    return getMockOCRText();
  }
};

// Generate JWT and get OAuth access token
export const getAccessToken = async () => {
  // Return cached token if still valid
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    // For now, return mock token since RSA signing is problematic
    // This will be replaced with proper authentication later
    throw new Error('Real API authentication not implemented yet');
  } catch (error) {
    console.error('Authentication Error:', error);
    throw error;
  }
};

// Mock OCR text for development/demo
const getMockOCRText = () => {
  return `APPETIZERS
Caesar Salad
Fresh romaine lettuce with parmesan
$12.95

Tomato Soup
Creamy tomato basil soup
$8.95

ENTREES
Grilled Salmon
Atlantic salmon with herbs
$24.95

Beef Ribeye Steak
Prime cut with garlic butter
$32.95

Chicken Parmesan
Breaded chicken with marinara
$19.95

DESSERTS
Chocolate Cake
Rich chocolate layer cake
$7.95

Apple Pie
Traditional apple pie with cinnamon
$6.95

BEVERAGES
Coffee
Freshly brewed house blend
$3.95

Orange Juice
Freshly squeezed
$4.95`;
};

// Helper function to convert blob to base64
const convertBlobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};