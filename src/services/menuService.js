import { extractTextFromImage, sortTextSpatially } from './ocrService';
import { processMenuText } from './translationService';

// Main service to process menu photos
export const processMenuPhoto = async (imageUri) => {
  try {
    // Step 1: Extract text from image using OCR
    console.log('Extracting text from image...');
    const ocrResult = await extractTextFromImage(imageUri);
    
    // Handle both old string format and new object format
    const extractedText = typeof ocrResult === 'string' ? ocrResult : ocrResult.text;
    const spatialElements = ocrResult.spatialElements || [];
    const hasColumnLayout = ocrResult.hasColumnLayout || false;
    
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text detected in the image');
    }
    
    console.log('📄 Extracted text length:', extractedText.length);
    console.log('🏗️ Layout type:', hasColumnLayout ? 'COLUMNAR' : 'LINEAR');
    console.log('📍 Spatial elements:', spatialElements.length);
    
    // Step 2: Text is already in correct order from image splitting
    let processedText = extractedText;
    console.log('✅ Using image splitting approach - text already in correct order');
    
    // Step 3: Process and translate the extracted text
    console.log('Processing and translating menu items...');
    const menuItems = await processMenuText(processedText);
    
    if (!menuItems || menuItems.length === 0) {
      throw new Error('No menu items found in the text');
    }
    
    // Step 4: Group items by category
    const groupedItems = menuItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});
    
    return {
      success: true,
      extractedText: processedText,
      menuItems: groupedItems,
      totalItems: menuItems.length,
      layoutType: hasColumnLayout ? 'image-split-columnar' : 'linear',
      spatialElements: 0 // No spatial elements needed with image splitting
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