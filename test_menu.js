// Test script to debug menu parsing with the actual menu photo

const { extractTextFromImage } = require('./src/services/ocrService');
const { processMenuText } = require('./src/services/translationService');
const path = require('path');

async function testMenu() {
  try {
    console.log('Testing menu parsing...');
    
    // For testing, let's simulate the OCR text from menu1.jpg
    const mockOCRText = `OLIVA Menu

PIZZA
PIZZA OLIVA (Halal) $24.99
(BEEF/CHICKEN)
MOZZARELLA, OLIVA BEEF OR CHICKEN DELI, BEEF SAUSAGE, BELL PEPPER, MUSHROOM, OLIVE, OREGANO

PEPPERONI (Halal) $14.99
MOZZARELLA, PEPPERONI

CHICKEN (Halal) $18.99
MOZZARELLA, GRILLED/CRISPY CHICKEN

VEGGIE $17.99
MOZZARELLA, BELL PEPPER, MUSHROOM, OLIVE,TOMATO,OREGANO

CHEESE $13.99

BUILD YOUR OWN $24.99

SANDWICH
OLIVA (Halal) $15.99
OLIVA BEEF OR CHICKEN DELI
LETTUCE, TOMATO, PICKLES, CHIPS, CILANTRO,OLIVA SPECIAL SAUCE

CHICKEN SANDWICH (Halal) $17.99
CRISPY OR GRILLED CHICKEN
CHEESE, LETTUCE, TOMATO, PICKLES, CHIPS,CILANTRO, OLIVA SPECIAL SAUCE

SAUSAGE (Halal) $17.99
OLIVA BEEF SAUSAGE
OLIVA BEEF DELI, MUSHROOM,BELL PEPPER, MOZZARELLA, LETTUCE, TOMATO, PICKELS, CHIPS,CILANTRO ,OLIVA SPECIAL SAUCE

VEGGI SANDWICH $14.99
MOZZARELLA, MUSHROOM, BELL PEPPER, LETTUCE, TOMATO, PICKELS, CHIPS, OLIVA SPECIAL SAUCE

SPECIAL SANDWICH $18.99
VEGGIE PATTY(KOKO),BEEF PATTY(KOTLET),MIX MOZZARELLA, LETTUCE, TOMATO, PICKELS, CHIPS, OLIVA SPECIAL SAUCE

HEALTHY WRAPS
CHICKEN WRAP $12.99
SPINACH TORTILLA,GRILLED CHICKEN, RED CABBAGE, CHEESE, TOMATO, MUSHROOM

CHICKEN LETTUCE WRAP $11.99
GRILLED CHICKEN, TOMATO, PICKELS, SPINACH, CHEESE

SALAD
SPECIAL OLIVA SALAD $14.99
GRILLED OR CRISPY CHICKEN (HALAU), LETTUCE, RED CABBAGE, MUSHROOM, TOMATO, SPINACH, FETA CHEESE, NUTS, OLIVE, OLIVA SPECIAL SAUCE

CAESAR SALAD $11.99
GRILLED CHICKEN, LETTUCE, CROUTONS PARMESAN CHEESE, CAESAR SAUCE

SIDE
FRENCH FRIES $7.99`;

    console.log('OCR Text:', mockOCRText);
    console.log('\n--- Processing Menu Text ---');
    
    const menuItems = await processMenuText(mockOCRText);
    
    console.log('\n--- Results ---');
    console.log(`Total items found: ${menuItems.length}`);
    
    menuItems.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.original} (${item.category})`);
      console.log(`   Translated: ${item.translated}`);
      console.log(`   Price: ${item.price || 'No price'}`);
      console.log(`   Description: ${item.description || 'No description'}`);
    });
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testMenu();