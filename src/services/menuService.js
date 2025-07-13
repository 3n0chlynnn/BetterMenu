import { extractTextFromImage } from './ocrService';
import { processMenuText } from './translationService';

// Main service to process menu photos
export const processMenuPhoto = async (imageUri) => {
  try {
    // Step 1: Extract text from image using OCR
    console.log('Extracting text from image...');
    const extractedText = await extractTextFromImage(imageUri);
    
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text detected in the image');
    }
    
    console.log('Extracted text:', extractedText);
    
    // Step 2: Process and translate the extracted text
    console.log('Processing and translating menu items...');
    const menuItems = await processMenuText(extractedText);
    
    if (!menuItems || menuItems.length === 0) {
      throw new Error('No menu items found in the text');
    }
    
    // Step 3: Group items by category
    const groupedItems = menuItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});
    
    return {
      success: true,
      extractedText,
      menuItems: groupedItems,
      totalItems: menuItems.length
    };
    
  } catch (error) {
    console.error('Menu processing failed:', error);
    return {
      success: false,
      error: error.message,
      menuItems: {},
      totalItems: 0
    };
  }
};