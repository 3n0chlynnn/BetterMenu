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
    'coffee', 'tea', 'wine', 'beer', 'cocktail', 'special', 'today'
  ];
  
  const menuKeywordCount = menuKeywords.filter(keyword => 
    lowerText.includes(keyword)
  ).length;
  
  // Check for price patterns - MUST HAVE PRICES for a menu
  const pricePatterns = [
    /\$\d+\.?\d*/g,         // $12.99
    /\d+\.?\d*\$/g,         // 12.99$
    /£\d+\.?\d*/g,          // £12.99
    /€\d+\.?\d*/g,          // €12.99
    /¥\d+\.?\d*/g,          // ¥12.99
    /\b\d{1,3}\.?\d{0,2}\b/g // Plain numbers: 12.99, 15, 8.50 (1-3 digits, optional decimal)
  ];
  
  const priceMatches = [];
  pricePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) priceMatches.push(...matches);
  });
  
  const hasPrices = priceMatches.length >= 3; // Need at least 3 prices
  
  // Check text characteristics
  const wordCount = text.split(/\s+/).length;
  const lineCount = text.split('\n').length;
  
  // Check for NON-menu indicators (computer screens, websites, etc.)
  const nonMenuKeywords = [
    'login', 'password', 'username', 'email', 'website', 'http', 'www', '.com',
    'download', 'install', 'app', 'software', 'window', 'file', 'folder',
    'desktop', 'browser', 'chrome', 'firefox', 'safari', 'internet',
    'google', 'facebook', 'instagram', 'twitter', 'youtube',
    'receipt', 'total', 'change', 'thank you', 'visit again',
    'street', 'avenue', 'road', 'address', 'directions', 'map'
  ];
  
  const nonMenuKeywordCount = nonMenuKeywords.filter(keyword => 
    lowerText.includes(keyword)
  ).length;
  
  // Check for food-related words specifically
  const foodWords = [
    'chicken', 'beef', 'pork', 'fish', 'salmon', 'shrimp', 'cheese', 'sauce',
    'grilled', 'fried', 'baked', 'fresh', 'organic', 'served', 'with'
  ];
  
  const foodWordCount = foodWords.filter(word => 
    lowerText.includes(word)
  ).length;
  
  // Scoring system - more strict
  let score = 0;
  
  // REQUIRED: Must have prices (strong indicator of menu)
  if (!hasPrices) score -= 5;
  else score += 3;
  
  // Menu keywords
  if (menuKeywordCount >= 2) score += 2;
  else if (menuKeywordCount >= 1) score += 1;
  
  // Food words
  if (foodWordCount >= 3) score += 2;
  else if (foodWordCount >= 1) score += 1;
  
  // Text structure
  if (wordCount >= 20 && lineCount >= 8) score += 1;
  
  // NEGATIVE indicators (very strict)
  if (nonMenuKeywordCount >= 2) score -= 4;
  if (nonMenuKeywordCount >= 4) score -= 6;
  
  // Check for too much tech-related content
  const techWords = ['login', 'password', 'download', 'install', 'browser', 'website'];
  const techWordCount = techWords.filter(word => lowerText.includes(word)).length;
  if (techWordCount >= 1) score -= 3;
  
  // Decision - much stricter threshold
  const isLikelyMenu = score >= 4;
  
  let reason = '';
  if (!isLikelyMenu) {
    if (!hasPrices) {
      reason = 'No prices detected. Menus should have prices like $12.99.';
    } else if (techWordCount >= 1) {
      reason = 'This appears to be a computer screen or website.';
    } else if (nonMenuKeywordCount >= 2) {
      reason = 'Content doesn\'t match restaurant menu patterns.';
    } else if (menuKeywordCount === 0) {
      reason = 'No menu-related words found.';
    } else if (wordCount < 20) {
      reason = 'Too little text detected for a menu.';
    } else {
      reason = 'This doesn\'t appear to be a restaurant menu.';
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