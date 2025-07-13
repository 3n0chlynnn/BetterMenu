import { API_CONFIG, API_URLS } from './config';

export const translateText = async (text, targetLanguage = 'zh') => {
  // If APIs are disabled, use mock translation
  if (!API_CONFIG.USE_REAL_APIS) {
    return getMockTranslation(text);
  }

  try {
    const requestBody = {
      q: text,
      target: targetLanguage,
      source: 'en',
      format: 'text'
    };

    const response = await fetch(API_URLS.TRANSLATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    
    if (result.error) {
      throw new Error(`Translate API Error: ${result.error.message}`);
    }

    const translatedText = result.data?.translations?.[0]?.translatedText || text;
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

// Function to detect menu items from text and translate them
export const processMenuText = async (extractedText) => {
  try {
    // Split text into potential menu items (basic parsing)
    const lines = extractedText.split('\n').filter(line => line.trim().length > 0);
    
    // Filter out likely non-food items (prices, headers, etc.)
    const menuItems = lines.filter(line => {
      const text = line.trim();
      // Skip lines that are mostly numbers/prices
      if (/^\$?\d+\.?\d*$/.test(text)) return false;
      // Skip very short lines
      if (text.length < 3) return false;
      // Skip common menu headers
      if (/^(menu|appetizers|entrees|desserts|beverages|drinks)$/i.test(text)) return false;
      return true;
    });

    // Translate each menu item
    const translatedItems = await Promise.all(
      menuItems.map(async (item, index) => {
        try {
          const translated = await translateText(item.trim());
          return {
            id: index + 1,
            original: item.trim(),
            translated: translated,
            category: categorizeMenuItem(item.trim()),
            image: getPlaceholderImage(item.trim()),
            description: `Translated from: ${item.trim()}`
          };
        } catch (error) {
          console.error(`Failed to translate: ${item}`, error);
          return {
            id: index + 1,
            original: item.trim(),
            translated: item.trim(), // Fallback to original if translation fails
            category: 'Other',
            image: 'https://via.placeholder.com/60x60?text=🍽️',
            description: 'Translation unavailable'
          };
        }
      })
    );

    return translatedItems;
  } catch (error) {
    console.error('Menu processing error:', error);
    throw new Error('Failed to process menu text');
  }
};

// Simple categorization based on keywords
const categorizeMenuItem = (itemName) => {
  const name = itemName.toLowerCase();
  
  if (name.includes('salad') || name.includes('soup') || name.includes('appetizer') || 
      name.includes('starter') || name.includes('wings')) {
    return 'Appetizers';
  }
  
  if (name.includes('steak') || name.includes('chicken') || name.includes('salmon') || 
      name.includes('fish') || name.includes('pasta') || name.includes('burger') ||
      name.includes('entree') || name.includes('main')) {
    return 'Entrees';
  }
  
  if (name.includes('cake') || name.includes('pie') || name.includes('ice cream') || 
      name.includes('dessert') || name.includes('chocolate')) {
    return 'Desserts';
  }
  
  if (name.includes('coffee') || name.includes('tea') || name.includes('juice') || 
      name.includes('soda') || name.includes('water') || name.includes('drink')) {
    return 'Beverages';
  }
  
  return 'Other';
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