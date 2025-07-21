import { API_CONFIG, API_URLS } from './config';
import { getAccessToken } from './ocrService';

export const translateText = async (text, targetLanguage = 'zh') => {
  // If APIs are disabled, use mock translation
  if (!API_CONFIG.USE_REAL_APIS) {
    return getMockTranslation(text);
  }

  try {
    // Get access token
    const token = await getAccessToken();
    
    const requestBody = {
      contents: [text],
      targetLanguageCode: targetLanguage,
      sourceLanguageCode: 'en'
    };

    const response = await fetch(API_URLS.TRANSLATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    
    if (result.error) {
      throw new Error(`Translate API Error: ${result.error.message}`);
    }

    const translatedText = result.translations?.[0]?.translatedText || text;
    return translatedText;
  } catch (error) {
    console.error('Translation Error:', error);
    // Fallback to mock translation
    return getMockTranslation(text);
  }
};

// Mock translation for development/demo
const getMockTranslation = (text) => {
  const translations = {
    'Caesar Salad': '凯撒沙拉',
    'Tomato Soup': '番茄汤',
    'Grilled Salmon': '烤三文鱼',
    'Beef Ribeye Steak': '牛肋眼牛排',
    'Chicken Parmesan': '帕尔马干酪鸡肉',
    'Chocolate Cake': '巧克力蛋糕',
    'Apple Pie': '苹果派',
    'Coffee': '咖啡',
    'Orange Juice': '橙汁',
    'Fresh romaine lettuce with parmesan': '新鲜长叶莴苣配帕尔马干酪',
    'Creamy tomato basil soup': '奶油番茄罗勒汤',
    'Atlantic salmon with herbs': '大西洋三文鱼配香草',
    'Prime cut with garlic butter': '优质牛排配蒜蓉黄油',
    'Breaded chicken with marinara': '面包屑鸡肉配马林纳拉酱',
    'Rich chocolate layer cake': '浓郁巧克力千层蛋糕',
    'Traditional apple pie with cinnamon': '传统肉桂苹果派',
    'Freshly brewed house blend': '新鲜调制的招牌咖啡',
    'Freshly squeezed': '新鲜榨制'
  };
  
  return translations[text] || text;
};

// Function to intelligently parse and process menu text
export const processMenuText = async (extractedText) => {
  try {
    console.log('🔍 Processing menu text, total length:', extractedText.length);
    
    // Split text into lines for analysis
    const lines = extractedText.split('\n').filter(line => line.trim().length > 0);
    console.log('📋 Total lines after filtering:', lines.length);
    
    // First pass: identify categories, dishes, descriptions, prices, and non-menu content
    const parsedItems = parseMenuStructure(lines);
    console.log('🏗️ Parsed items:', parsedItems.length);
    
    // Second pass: group related content and create menu items
    const menuItems = await buildMenuItems(parsedItems);
    console.log('🍽️ Final menu items found:', menuItems.length);
    
    return menuItems;
  } catch (error) {
    console.error('Menu processing error:', error);
    throw new Error('Failed to process menu text');
  }
};

// Parse the menu structure intelligently
const parseMenuStructure = (lines) => {
  const parsedItems = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
    
    // Skip very short lines or obvious non-menu content
    if (shouldSkipLine(line)) {
      continue;
    }
    
    const itemType = identifyLineType(line, nextLine);
    const price = extractPrice(line);
    
    console.log(`📝 Line: "${line}" → Type: ${itemType}, Price: ${price}`);
    
    parsedItems.push({
      text: line,
      type: itemType,
      price: price,
      lineIndex: i
    });
  }
  
  return parsedItems;
};

// Identify what type of content each line contains
const identifyLineType = (line, nextLine) => {
  const lowerLine = line.toLowerCase();
  
  // Check if it's a category header
  if (isCategoryHeader(line, nextLine)) {
    return 'category';
  }
  
  // Check if it's contact info or restaurant details
  if (isContactInfo(line)) {
    return 'contact';
  }
  
  // Check if it's just a price line
  if (isPriceOnly(line)) {
    return 'price';
  }
  
  // Check if it's a dish name (short, no detailed description)
  if (isDishName(line)) {
    return 'dish';
  }
  
  // Check if it's a description
  if (isDescription(line)) {
    return 'description';
  }
  
  return 'other';
};

// Check if a line is a category header
const isCategoryHeader = (line, nextLine) => {
  const categoryWords = [
    'pizza', 'sandwich', 'appetizer', 'starter', 'entree', 'main', 'dessert', 'beverage', 'drink',
    'soup', 'salad', 'pasta', 'burger', 'coffee', 'tea', 'wine', 'beer', 'cocktail', 
    'specials', 'today', 'fresh', 'healthy', 'wraps', 'side', 'sides'
  ];
  
  const lowerLine = line.toLowerCase().trim();
  
  // Skip if it has a price (categories don't have prices)
  const hasPrice = extractPrice(line) !== null;
  if (hasPrice) return false;
  
  // Skip addresses and contact info
  if (/\b(street|ave|avenue|road|dr|drive|suite|ca|zip|\d{5}|phone|email)\b/i.test(line)) {
    return false;
  }
  
  // Skip single ingredient words
  const singleIngredients = [
    'oregano', 'mozzarella', 'pepperoni', 'cheese', 'lettuce', 'tomato', 'mushroom',
    'olive', 'onion', 'pepper', 'spinach', 'avocado', 'cilantro', 'pickles'
  ];
  if (singleIngredients.includes(lowerLine)) {
    return false;
  }
  
  // Check if it's all uppercase (common for headers) AND short
  if (line === line.toUpperCase() && line.length > 3 && line.length < 20) {
    return true;
  }
  
  // Check if it contains category words and is reasonably short
  const hasCategory = categoryWords.some(word => lowerLine.includes(word));
  const isShort = line.length < 30; // Categories are usually short
  const hasCommas = (line.match(/,/g) || []).length;
  const isNotIngredientList = hasCommas < 2; // Categories don't have many commas
  
  if (hasCategory && isShort && isNotIngredientList) {
    return true;
  }
  
  return false;
};

// Check if a line contains contact information
const isContactInfo = (line) => {
  const contactPatterns = [
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // Phone numbers
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
    /\bwww\./i,
    /\bhttp/i,
    /\bstreet\b/i,
    /\bavenue\b/i,
    /\broad\b/i,
    /\baddress\b/i,
  ];
  
  return contactPatterns.some(pattern => pattern.test(line));
};

// Check if line is just a price
const isPriceOnly = (line) => {
  const pricePattern = /^\$?\d+\.?\d*\$?$/;
  return pricePattern.test(line.trim());
};

// Check if line is likely a dish name
const isDishName = (line) => {
  // Remove price if present for analysis
  const lineWithoutPrice = line.replace(/\$\d+\.?\d*|\d+\.?\d*\$?|\b\d{1,3}\.?\d{0,2}\b/g, '').trim();
  const wordsWithoutPrice = lineWithoutPrice.split(/\s+/).filter(w => w.length > 0);
  
  // Skip if no words after removing price
  if (wordsWithoutPrice.length === 0) return false;
  
  // Skip single ingredient words
  const singleIngredients = [
    'oregano', 'mozzarella', 'pepperoni', 'cheese', 'lettuce', 'tomato', 'mushroom',
    'olive', 'onion', 'pepper', 'spinach', 'avocado', 'cilantro', 'pickles'
  ];
  if (wordsWithoutPrice.length === 1 && 
      singleIngredients.includes(lineWithoutPrice.toLowerCase())) {
    return false;
  }
  
  // Skip obvious non-dish content
  const skipPatterns = [
    /\b(street|ave|avenue|road|dr|drive|suite|ca|zip|phone|email)\b/i,
    /^\$\d+\.?\d*$/,  // Just a price
    /^\(\d+\)/, // Phone numbers
    /^on\s+(baguette|flat\s+bread|whole\s+wheat)/i, // Descriptions starting with "on"
  ];
  
  if (skipPatterns.some(pattern => pattern.test(line))) {
    return false;
  }
  
  // Dish characteristics - be more permissive
  const hasCapitalization = /[A-Z]/.test(line);
  const notTooLong = line.length <= 100; // Increased from 80
  const notTooShort = wordsWithoutPrice.length >= 1;
  
  // Skip obvious ingredient lists (too many commas)
  const commaCount = (line.match(/,/g) || []).length;
  const isIngredientList = commaCount >= 4; // Increased threshold from 3
  
  // Common dish name patterns
  const dishPatterns = [
    /\b(pizza|sandwich|wrap|salad|burger|chicken|beef|fish|pasta|soup)\b/i,
    /\b(special|deluxe|supreme|classic|traditional)\b/i,
    /\b(halal|veggie|vegetarian|crispy|grilled|fried)\b/i
  ];
  
  const hasDishKeywords = dishPatterns.some(pattern => pattern.test(line));
  
  // More permissive logic
  const isLikelyDish = hasCapitalization && notTooLong && notTooShort && 
                       !isIngredientList && 
                       (hasDishKeywords || wordsWithoutPrice.length <= 4);
  
  return isLikelyDish;
};

// Check if line is a description
const isDescription = (line) => {
  // Descriptions are usually:
  // - Ingredient lists with commas
  // - Cooking methods
  // - Mostly lowercase (except first letter)
  
  const lowerLine = line.toLowerCase();
  const wordCount = line.trim().split(/\s+/).length;
  const commaCount = (line.match(/,/g) || []).length;
  
  // Common descriptive/ingredient words
  const descriptiveWords = [
    'with', 'served', 'topped', 'fresh', 'grilled', 'fried', 'baked',
    'seasoned', 'marinated', 'sauce', 'dressing', 'cheese', 'lettuce',
    'tomato', 'onion', 'pepper', 'mushroom', 'olive', 'herbs', 'spices',
    'organic', 'local', 'homemade', 'mozzarella', 'beef', 'chicken',
    'spinach', 'avocado', 'pickle', 'cilantro'
  ];
  
  const hasDescriptiveWords = descriptiveWords.some(word => lowerLine.includes(word));
  const hasMultipleCommas = commaCount >= 2;
  const isLongEnough = wordCount >= 3;
  
  // If it has many commas and descriptive words, it's likely a description
  return (hasMultipleCommas && isLongEnough) || (hasDescriptiveWords && wordCount >= 4);
};

// Extract price from a line with better patterns
const extractPrice = (line) => {
  const pricePatterns = [
    /\$(\d+\.?\d*)/,         // $12.99
    /(\d+\.?\d*)\$/,         // 12.99$
    /£(\d+\.?\d*)/,          // £12.99
    /€(\d+\.?\d*)/,          // €12.99
    /¥(\d+\.?\d*)/,          // ¥12.99
    /\b(\d{1,3}\.?\d{0,2})\b/ // Plain numbers: 12.99, 15, 8.50
  ];
  
  for (const pattern of pricePatterns) {
    const match = line.match(pattern);
    if (match) {
      let price = match[1] || match[0].replace(/[^\d.]/g, '');
      // Only return if it looks like a valid price (not a year or random number)
      const priceNum = parseFloat(price);
      if (priceNum >= 1 && priceNum <= 200) {
        // Return clean numeric value without $ - will be added later
        return price;
      }
    }
  }
  
  return null;
};

// Check if line should be skipped entirely
const shouldSkipLine = (line) => {
  // Skip very short lines, pure numbers, or obvious non-menu content
  if (line.length < 2) return true;
  
  const skipPatterns = [
    /^page \d+/i,
    /^menu$/i,
    /^thank you/i,
    /^visit us/i,
    /^follow us/i,
    /^\d+$/,
    /^-+$/,
    /^=+$/,
    /^\(\d+\)/,           // (949) phone numbers
    /^\d{5}$/,            // zip codes
    /^(suite|dr|st|ave)/i, // address parts
    // Menu headers and restaurant names
    /^.+\s+menu$/i,       // "OLIVA Menu", "Restaurant Menu"
    /^menu\s+/i,          // "Menu 2024"
    /^\w+\s+menu$/i,      // "Pizza Menu", "Lunch Menu"
    // Option indicators in parentheses
    /^\([^)]*\)$/,        // "(Beef/Chicken)", "(Halal)", "(Vegetarian)"
    /^\([^)]*meat[^)]*\)/i, // "(Choice of meat)"
    /^\([^)]*option[^)]*\)/i, // "(Options available)"
  ];
  
  return skipPatterns.some(pattern => pattern.test(line.trim()));
};

// Build structured menu items from parsed data
const buildMenuItems = async (parsedItems) => {
  const menuItems = [];
  let currentCategory = 'Other';
  let itemId = 1;
  
  for (let i = 0; i < parsedItems.length; i++) {
    const item = parsedItems[i];
    
    if (item.type === 'category') {
      currentCategory = item.text;
      continue;
    }
    
    if (item.type === 'contact') {
      continue; // Skip contact information
    }
    
    if (item.type === 'dish') {
      // Look for description in next items (may span multiple lines)
      let description = '';
      let price = item.price;
      let descriptionLines = [];
      
      // Check next few lines for description and price
      for (let j = i + 1; j < Math.min(i + 5, parsedItems.length); j++) {
        const nextItem = parsedItems[j];
        
        if (nextItem.type === 'description') {
          descriptionLines.push(nextItem.text);
          if (nextItem.price && !price) {
            price = nextItem.price;
          }
        } else if (nextItem.type === 'price' && !price) {
          price = nextItem.text;
        } else if (nextItem.type === 'other' && 
                   nextItem.text.length > 10 && 
                   /[,]/.test(nextItem.text)) {
          // Likely continuation of description (ingredient list)
          descriptionLines.push(nextItem.text);
        } else if (nextItem.type === 'dish' || nextItem.type === 'category') {
          break; // Stop if we hit another dish or category
        }
      }
      
      // Combine all description lines
      description = descriptionLines.join(' ').replace(/\s+/g, ' ').trim();
      
      // Clean dish name (remove price if it's there and normalize spacing)
      let dishName = item.text.replace(/\$\d+\.?\d*|\d+\.?\d*\$?|\b\d{1,3}\.?\d{0,2}\b/g, '').trim();
      dishName = dishName.replace(/\s+/g, ' '); // Normalize multiple spaces
      
      // Clean and normalize price
      if (price) {
        // Remove any existing $ symbols first
        let cleanPrice = price.replace(/\$/g, '');
        // Extract just the numeric part
        const numericMatch = cleanPrice.match(/(\d+\.?\d*)/);
        if (numericMatch) {
          cleanPrice = numericMatch[1];
          // Add single $ prefix
          price = '$' + cleanPrice;
        } else {
          price = null; // Invalid price
        }
      }
      
      try {
        const translated = await translateText(dishName);
        const translatedDescription = description ? await translateText(description) : '';
        
        menuItems.push({
          id: itemId++,
          original: dishName,
          translated: translated,
          description: description,
          translatedDescription: translatedDescription,
          price: price,
          category: currentCategory,
          image: getPlaceholderImage(dishName),
        });
      } catch (error) {
        console.error(`Failed to translate: ${dishName}`, error);
        menuItems.push({
          id: itemId++,
          original: dishName,
          translated: dishName,
          description: description,
          translatedDescription: description,
          price: price,
          category: currentCategory,
          image: getPlaceholderImage(dishName),
        });
      }
    }
  }
  
  return menuItems;
};

// Get placeholder image based on item type
const getPlaceholderImage = (itemName) => {
  const name = itemName.toLowerCase();
  
  if (name.includes('salad')) return 'https://via.placeholder.com/60x60?text=🥗';
  if (name.includes('soup')) return 'https://via.placeholder.com/60x60?text=🍲';
  if (name.includes('steak') || name.includes('beef')) return 'https://via.placeholder.com/60x60?text=🥩';
  if (name.includes('chicken')) return 'https://via.placeholder.com/60x60?text=🍗';
  if (name.includes('fish') || name.includes('salmon')) return 'https://via.placeholder.com/60x60?text=🐟';
  if (name.includes('pasta')) return 'https://via.placeholder.com/60x60?text=🍝';
  if (name.includes('burger')) return 'https://via.placeholder.com/60x60?text=🍔';
  if (name.includes('cake')) return 'https://via.placeholder.com/60x60?text=🍰';
  if (name.includes('pie')) return 'https://via.placeholder.com/60x60?text=🥧';
  if (name.includes('coffee')) return 'https://via.placeholder.com/60x60?text=☕';
  if (name.includes('juice')) return 'https://via.placeholder.com/60x60?text=🍊';
  
  return 'https://via.placeholder.com/60x60?text=🍽️';
};