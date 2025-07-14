import { API_CONFIG, API_URLS } from './config';
import forge from 'node-forge';

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
            {
              type: 'OBJECT_LOCALIZATION',
              maxResults: 10,
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
    const objects = result.responses[0]?.localizedObjectAnnotations || [];
    
    // Validate if this looks like a menu
    const menuValidation = validateMenuPhoto(detectedText, objects);
    if (!menuValidation.isLikelyMenu) {
      throw new Error(`This doesn't appear to be a menu. ${menuValidation.reason}`);
    }
    
    return detectedText;
  } catch (error) {
    console.error('OCR Error:', error);
    // If it's a validation error, re-throw it to show to user
    if (error.message.includes("doesn't appear to be a menu")) {
      throw error;
    }
    // Otherwise fallback to mock data
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
    // Create JWT using node-forge
    const jwt = await createJWTToken();
    
    // Exchange JWT for access token
    const tokenResponse = await fetch(API_CONFIG.TOKEN_URI, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      throw new Error(`Token Error: ${tokenData.error_description}`);
    }

    // Cache the token
    accessToken = tokenData.access_token;
    tokenExpiry = Date.now() + (tokenData.expires_in * 1000) - 60000; // Refresh 1 min early
    
    return accessToken;
  } catch (error) {
    console.error('Authentication Error:', error);
    throw error;
  }
};

// Create JWT token using node-forge for RSA signing
const createJWTToken = async () => {
  try {
    // Create JWT header
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };

    // Create JWT payload
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: API_CONFIG.SERVICE_ACCOUNT_EMAIL,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: API_CONFIG.TOKEN_URI,
      exp: now + 3600, // 1 hour
      iat: now
    };

    // Base64URL encode header and payload
    const encodedHeader = base64URLEncode(JSON.stringify(header));
    const encodedPayload = base64URLEncode(JSON.stringify(payload));
    
    // Create signature input
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    
    // Sign with RSA-SHA256 using node-forge
    const signature = await signWithRSAForge(signatureInput, API_CONFIG.PRIVATE_KEY);
    
    // Create final JWT
    const jwt = `${signatureInput}.${signature}`;
    
    return jwt;
  } catch (error) {
    console.error('JWT creation failed:', error);
    throw new Error('Failed to create JWT token');
  }
};

// Sign data with RSA private key using node-forge
const signWithRSAForge = async (data, privateKeyPem) => {
  try {
    // Parse the private key
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    
    // Create message digest
    const md = forge.md.sha256.create();
    md.update(data, 'utf8');
    
    // Sign the digest
    const signature = privateKey.sign(md);
    
    // Convert to base64
    const base64Signature = forge.util.encode64(signature);
    
    // Convert to base64URL
    return base64URLEncode(base64Signature, true);
  } catch (error) {
    console.error('RSA signing failed:', error);
    throw new Error('Failed to sign JWT with RSA');
  }
};

// Utility functions
const base64URLEncode = (data, isSignature = false) => {
  let base64;
  if (isSignature) {
    // Already base64 encoded
    base64 = data;
  } else if (typeof data === 'string') {
    // Use btoa for encoding
    base64 = btoa(data);
  } else {
    base64 = btoa(String(data));
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

// Validate if the photo is likely a menu
const validateMenuPhoto = (text, objects) => {
  const lowerText = text.toLowerCase();
  
  // Check for menu indicators
  const menuKeywords = [
    'menu', 'appetizer', 'entree', 'dessert', 'beverage', 'drink', 'starter',
    'main course', 'soup', 'salad', 'pasta', 'pizza', 'burger', 'sandwich',
    'coffee', 'tea', 'wine', 'beer', 'cocktail', 'price', '$', '€', '£', '¥'
  ];
  
  const menuKeywordCount = menuKeywords.filter(keyword => 
    lowerText.includes(keyword)
  ).length;
  
  // Check for price patterns
  const pricePatterns = [
    /\$\d+\.?\d*/g,
    /\d+\.?\d*\$?/g,
    /£\d+\.?\d*/g,
    /€\d+\.?\d*/g,
    /¥\d+\.?\d*/g
  ];
  
  const hasPrices = pricePatterns.some(pattern => pattern.test(text));
  
  // Check text density (menus usually have lots of text)
  const wordCount = text.split(/\s+/).length;
  const lineCount = text.split('\n').length;
  
  // Check for non-menu indicators
  const nonMenuKeywords = [
    'street', 'address', 'phone', 'email', 'website', 'http', 'www',
    'receipt', 'total', 'change', 'thank you', 'visit again'
  ];
  
  const nonMenuKeywordCount = nonMenuKeywords.filter(keyword => 
    lowerText.includes(keyword)
  ).length;
  
  // Scoring system
  let score = 0;
  
  // Positive indicators
  if (menuKeywordCount >= 3) score += 3;
  else if (menuKeywordCount >= 1) score += 1;
  
  if (hasPrices) score += 2;
  if (wordCount >= 20) score += 1;
  if (lineCount >= 10) score += 1;
  
  // Negative indicators
  if (nonMenuKeywordCount >= 3) score -= 2;
  if (wordCount < 10) score -= 2;
  
  // Decision
  const isLikelyMenu = score >= 3;
  
  let reason = '';
  if (!isLikelyMenu) {
    if (menuKeywordCount === 0) {
      reason = 'No menu-related words found.';
    } else if (!hasPrices) {
      reason = 'No prices detected.';
    } else if (wordCount < 10) {
      reason = 'Too little text detected.';
    } else {
      reason = 'Content doesn\'t match menu patterns.';
    }
  }
  
  return { isLikelyMenu, score, reason };
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