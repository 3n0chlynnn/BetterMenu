import { API_CONFIG, API_URLS } from './config';
import forge from 'node-forge';
import * as ImageManipulator from 'expo-image-manipulator';

// OAuth token cache
let accessToken = null;
let tokenExpiry = null;

export const extractTextFromImage = async (imageUri) => {
  // If APIs are disabled, return demo text
  if (!API_CONFIG.USE_REAL_APIS) {
    return {
      text: getMockOCRText(),
      spatialElements: [],
      hasColumnLayout: false
    };
  }

  try {
    console.log('🖼️ Starting adaptive column detection...');
    
    // Get access token
    const token = await getAccessToken();
    
    // First, do OCR on the full image to detect layout
    console.log('🔍 Full image OCR for layout detection...');
    const fullOCRResult = await performFullOCR(imageUri, token);
    const fullText = fullOCRResult.text;
    const textAnnotations = fullOCRResult.textAnnotations;
    
    if (!fullText || fullText.trim().length === 0) {
      throw new Error('No text detected in the image');
    }
    
    // Detect number of columns from spatial data
    const columnCount = detectColumnCount(textAnnotations);
    console.log(`📊 Detected ${columnCount} columns`);
    
    if (columnCount === 1) {
      // Single column - use full text as-is
      console.log('📋 Single column layout - using full text');
      return {
        text: fullText,
        spatialElements: [],
        hasColumnLayout: false
      };
    } else {
      // Multi-column - split image and do separate OCR
      console.log(`✂️ Multi-column layout - splitting into ${columnCount} parts`);
      const combinedText = await processMultiColumnImage(imageUri, token, columnCount);
      
      return {
        text: combinedText,
        spatialElements: [],
        hasColumnLayout: true
      };
    }
    
  } catch (error) {
    console.error('OCR Error:', error);
    // If it's a validation error, re-throw it to show to user
    if (error.message.includes("doesn't appear to be a menu")) {
      throw error;
    }
    // Otherwise fallback to mock data
    return {
      text: getMockOCRText(),
      spatialElements: [],
      hasColumnLayout: false
    };
  }
};

// Helper function to perform full OCR with spatial data
const performFullOCR = async (imageUri, token) => {
  const response = await fetch(imageUri);
  const blob = await response.blob();
  const base64 = await convertBlobToBase64(blob);
  const base64Data = base64.split(',')[1] || base64;
  
  const requestBody = {
    requests: [
      {
        image: { content: base64Data },
        features: [
          { type: 'TEXT_DETECTION', maxResults: 1 },
          { type: 'OBJECT_LOCALIZATION', maxResults: 10 }
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
  const textAnnotations = result.responses[0]?.textAnnotations || [];
  const objects = result.responses[0]?.localizedObjectAnnotations || [];
  
  // Validate if this looks like a menu
  const menuValidation = validateMenuPhoto(detectedText, objects);
  if (!menuValidation.isLikelyMenu) {
    throw new Error(`This doesn't appear to be a menu. ${menuValidation.reason}`);
  }
  
  return {
    text: detectedText,
    textAnnotations: textAnnotations.slice(1), // Skip full text element
    objects
  };
};

// Helper function to perform OCR on a single image (simplified)
const performOCR = async (imageUri, token) => {
  const response = await fetch(imageUri);
  const blob = await response.blob();
  const base64 = await convertBlobToBase64(blob);
  const base64Data = base64.split(',')[1] || base64;
  
  const requestBody = {
    requests: [
      {
        image: { content: base64Data },
        features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
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

  return result.responses[0]?.textAnnotations?.[0]?.description || '';
};

// Detect number of columns from spatial text data
const detectColumnCount = (textAnnotations) => {
  if (!textAnnotations || textAnnotations.length < 10) return 1;
  
  // Get X coordinates of all text elements
  const xPositions = textAnnotations.map(annotation => {
    const vertices = annotation.boundingPoly?.vertices || [];
    return vertices.length > 0 ? (vertices[0].x || 0) : 0;
  }).filter(x => x > 0);
  
  if (xPositions.length < 10) return 1;
  
  // Sort X positions and find significant gaps
  xPositions.sort((a, b) => a - b);
  const gaps = [];
  
  for (let i = 0; i < xPositions.length - 1; i++) {
    const gap = xPositions[i + 1] - xPositions[i];
    if (gap > 100) { // Significant gap
      gaps.push(gap);
    }
  }
  
  // Count major column separators (gaps > 150px)
  const majorGaps = gaps.filter(gap => gap > 150);
  const columnCount = majorGaps.length + 1;
  
  console.log(`🔍 Gap analysis: ${gaps.length} gaps >100px, ${majorGaps.length} major gaps >150px`);
  return Math.min(columnCount, 4); // Cap at 4 columns max
};

// Process multi-column image by splitting
const processMultiColumnImage = async (imageUri, token, columnCount) => {
  const imageInfo = await ImageManipulator.manipulateAsync(imageUri, [], { format: 'jpeg' });
  const { width, height } = imageInfo;
  console.log(`📐 Image dimensions: ${width}x${height}`);
  
  const columnWidth = width / columnCount;
  const columnTexts = [];
  
  for (let i = 0; i < columnCount; i++) {
    const startX = i * columnWidth;
    console.log(`✂️ Cropping column ${i + 1}/${columnCount} (X: ${startX.toFixed(0)}-${(startX + columnWidth).toFixed(0)})`);
    
    const columnImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ crop: { originX: startX, originY: 0, width: columnWidth, height: height } }],
      { format: 'jpeg', compress: 0.8 }
    );
    
    console.log(`🔍 OCR on column ${i + 1}...`);
    const columnText = await performOCR(columnImage.uri, token);
    
    if (columnText.trim().length > 0) {
      columnTexts.push(columnText);
      console.log(`📋 Column ${i + 1} text length: ${columnText.length}`);
    }
  }
  
  // Combine all column texts
  const combinedText = columnTexts.join('\n\n');
  console.log(`📄 Combined text from ${columnTexts.length} columns, total length: ${combinedText.length}`);
  
  return combinedText;
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

// Detect if the menu has a column-based layout using gap analysis
const detectColumnLayout = (textAnnotations) => {
  if (!textAnnotations || textAnnotations.length < 10) return false;
  
  // Get X coordinates and widths of all text elements
  const elements = textAnnotations.map(annotation => {
    const vertices = annotation.boundingPoly?.vertices || [];
    if (vertices.length === 0) return null;
    const x = vertices[0].x || 0;
    const width = vertices.length >= 2 ? Math.abs((vertices[1].x || 0) - x) : 50; // Default width
    return { x, width, right: x + width };
  }).filter(elem => elem !== null);
  
  if (elements.length < 10) return false;
  
  // Sort by X position
  elements.sort((a, b) => a.x - b.x);
  
  // Find significant gaps between elements (potential column separators)
  const gaps = [];
  for (let i = 0; i < elements.length - 1; i++) {
    const currentRight = elements[i].right;
    const nextLeft = elements[i + 1].x;
    const gap = nextLeft - currentRight;
    
    // Only consider significant gaps (>100px) as potential column separators
    if (gap > 100) {
      gaps.push({
        start: currentRight,
        end: nextLeft,
        width: gap,
        midpoint: (currentRight + nextLeft) / 2
      });
    }
  }
  
  // Filter out small gaps and keep only major column separators
  const significantGaps = gaps.filter(gap => gap.width > 150);
  
  console.log(`🔍 Gap analysis: Found ${gaps.length} gaps >100px, ${significantGaps.length} significant gaps >150px`);
  significantGaps.forEach((gap, index) => {
    console.log(`  Gap ${index + 1}: ${gap.width.toFixed(0)}px wide at X=${gap.midpoint.toFixed(0)}`);
  });
  
  // If we have 1+ significant gaps, it's likely columnar (2+ columns)
  const hasColumns = significantGaps.length >= 1;
  
  console.log(`🔍 Column detection: ${hasColumns ? 'COLUMNAR' : 'LINEAR'} (${significantGaps.length + 1} columns)`);
  
  return hasColumns;
};

// Sort text elements spatially (column-aware) and reconstruct logical lines
export const sortTextSpatially = (textAnnotations) => {
  if (!textAnnotations || textAnnotations.length === 0) return [];
  
  // Extract position data
  const elementsWithPosition = textAnnotations.map(annotation => {
    const vertices = annotation.boundingPoly?.vertices || [];
    const x = vertices.length > 0 ? (vertices[0].x || 0) : 0;
    const y = vertices.length > 0 ? (vertices[0].y || 0) : 0;
    const width = vertices.length >= 2 ? Math.abs((vertices[1].x || 0) - (vertices[0].x || 0)) : 50;
    const height = vertices.length >= 3 ? Math.abs((vertices[2].y || 0) - (vertices[0].y || 0)) : 20;
    return {
      text: annotation.description || '',
      x,
      y,
      width,
      height,
      right: x + width,
      annotation
    };
  }).filter(elem => elem.text.trim().length > 0);
  
  // Group elements into logical lines first (by Y coordinate proximity)
  const lineGroups = [];
  
  for (const elem of elementsWithPosition) {
    // Find existing line group this element belongs to (within 15 pixels Y tolerance)
    let addedToLine = false;
    
    for (const lineGroup of lineGroups) {
      const avgY = lineGroup.reduce((sum, e) => sum + e.y, 0) / lineGroup.length;
      if (Math.abs(elem.y - avgY) <= 15) {
        lineGroup.push(elem);
        addedToLine = true;
        break;
      }
    }
    
    if (!addedToLine) {
      lineGroups.push([elem]);
    }
  }
  
  // Sort elements within each line by X coordinate (left to right)
  lineGroups.forEach(lineGroup => {
    lineGroup.sort((a, b) => a.x - b.x);
  });
  
  // Sort line groups by Y coordinate (top to bottom)
  lineGroups.sort((a, b) => {
    const avgYA = a.reduce((sum, e) => sum + e.y, 0) / a.length;
    const avgYB = b.reduce((sum, e) => sum + e.y, 0) / b.length;
    return avgYA - avgYB;
  });
  
  // Find column boundaries using gap analysis (same as detection function)
  const allElements = elementsWithPosition.slice().sort((a, b) => a.x - b.x);
  const columnSeparators = [];
  
  for (let i = 0; i < allElements.length - 1; i++) {
    const currentRight = allElements[i].right;
    const nextLeft = allElements[i + 1].x;
    const gap = nextLeft - currentRight;
    
    // Only significant gaps (>150px) are column separators
    if (gap > 150) {
      columnSeparators.push((currentRight + nextLeft) / 2);
    }
  }
  
  // Remove duplicate separators (within 50px of each other)
  const uniqueSeparators = [];
  for (const separator of columnSeparators) {
    if (!uniqueSeparators.some(existing => Math.abs(existing - separator) < 50)) {
      uniqueSeparators.push(separator);
    }
  }
  uniqueSeparators.sort((a, b) => a - b);
  
  console.log(`📊 Gap-based columns: Found ${uniqueSeparators.length} separators → ${uniqueSeparators.length + 1} columns`);
  uniqueSeparators.forEach((sep, index) => {
    console.log(`  Column separator ${index + 1}: X=${sep.toFixed(0)}`);
  });
  
  // Assign lines to columns based on their starting X position
  const columns = [];
  for (let i = 0; i <= uniqueSeparators.length; i++) {
    columns.push([]);
  }
  
  for (const lineGroup of lineGroups) {
    const lineStartX = Math.min(...lineGroup.map(elem => elem.x));
    const lineText = lineGroup.map(elem => elem.text).join(' ');
    
    // Find which column this line belongs to
    let columnIndex = 0;
    for (let i = 0; i < uniqueSeparators.length; i++) {
      if (lineStartX > uniqueSeparators[i]) {
        columnIndex = i + 1;
      } else {
        break;
      }
    }
    
    console.log(`📍 Line "${lineText}" at X=${lineStartX} → Column ${columnIndex + 1}`);
    columns[columnIndex].push(lineGroup);
  }
  
  // Reconstruct logical lines from word groups (process left column completely, then right)
  const reconstructedLines = [];
  
  // Process each column completely (top to bottom) before moving to next column
  // This ensures proper reading: left column top-to-bottom, then right column top-to-bottom
  columns.forEach((column, columnIndex) => {
    if (column.length > 0) {
      console.log(`📊 Processing Column ${columnIndex + 1}: ${column.length} lines`);
      
      // Sort lines within this column by Y coordinate (top to bottom)
      const sortedColumn = column.slice().sort((a, b) => {
        const avgYA = a.reduce((sum, elem) => sum + elem.y, 0) / a.length;
        const avgYB = b.reduce((sum, elem) => sum + elem.y, 0) / b.length;
        return avgYA - avgYB;
      });
      
      // Process each line in this column
      sortedColumn.forEach(lineGroup => {
        // Combine words in this line, maintaining spacing
        let lineText = '';
        let lastX = -1;
        
        lineGroup.forEach(elem => {
          // Add appropriate spacing between words
          if (lastX >= 0) {
            const gap = elem.x - lastX;
            if (gap > 40) { // Large gap - probably separate sections
              lineText += '   '; // Multiple spaces
            } else if (gap > 15) { // Normal word spacing
              lineText += ' ';
            }
            // Small gaps - words are close, don't add extra space
          }
          
          lineText += elem.text;
          lastX = elem.right;
        });
        
        if (lineText.trim().length > 0) {
          reconstructedLines.push(lineText.trim());
        }
      });
      
      console.log(`✅ Completed Column ${columnIndex + 1}`);
    }
  });
  
  console.log(`📄 Reconstructed ${reconstructedLines.length} logical lines from ${elementsWithPosition.length} elements`);
  
  return reconstructedLines;
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