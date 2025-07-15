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
    
    // Step 2: Use spatial sorting if we have column layout and spatial data
    let processedText = extractedText;
    if (hasColumnLayout && spatialElements.length > 0) {
      console.log('🔧 Applying spatial sorting for column layout...');
      const sortedTextArray = sortTextSpatially(spatialElements);
      processedText = sortedTextArray.join('\n');
      console.log('✅ Spatially sorted text length:', processedText.length);
    }
    
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
      layoutType: hasColumnLayout ? 'columnar' : 'linear',
      spatialElements: spatialElements.length
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