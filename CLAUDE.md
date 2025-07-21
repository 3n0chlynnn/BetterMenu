# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
BetterMenu is a React Native mobile app that helps users translate restaurant menus by taking photos. The app provides instant translations with dish photos and reviews to help non-English speakers understand menu items better.

## Development Commands

### Start Development Server
```bash
npm start
# or
expo start
```

### Platform-Specific Development
```bash
npm run ios      # iOS simulator (requires macOS)
npm run android  # Android emulator
npm run web      # Web browser development
```

### Package Management
Due to WSL/Windows permissions issues, always use:
```bash
npm install --no-bin-links [package-name]
```

### Testing on Device
- Install Expo Go app on your phone
- Scan QR code from `npm start` to test on real device
- For iOS testing from Windows, use Expo Go app

## Architecture

### Tech Stack
- **Frontend**: React Native with Expo
- **Navigation**: React Navigation v6 (Stack Navigator)
- **Camera**: expo-camera, expo-image-picker
- **File System**: expo-file-system
- **Future APIs**: Google Vision API (OCR), Google Translate API, Yelp/Google Places API

### Project Structure
```
src/
├── components/     # Reusable UI components
├── screens/        # Main app screens
│   ├── HomeScreen.js        # Landing page with scan button
│   ├── CameraScreen.js      # Camera interface for menu photos
│   └── MenuResultScreen.js  # Translated menu display
├── services/       # API integrations (OCR, translation, food data)
└── utils/          # Helper functions and utilities
```

### Screen Flow
1. **HomeScreen**: Welcome screen with "Scan Menu" button
2. **CameraScreen**: Camera interface with capture/gallery options
3. **MenuResultScreen**: Displays original image + translated menu items with photos and ratings

### Current Implementation Status
- ✅ Basic navigation setup
- ✅ UI/UX mockup with sample data
- ✅ Camera integration
- ✅ Google Vision API OCR integration with adaptive column detection
- ✅ Google Translate API integration (with some auth issues)
- ✅ Advanced menu text parsing and classification
- ⏳ Food photo/review APIs (planned)

## Development Notes

### Design Pattern
- Each menu item displays: Original text → Translated text + thumbnail photo + rating
- Inline photo approach chosen over clickable items for better UX
- Mock data currently used for development

### Known Issues
- WSL permissions require `--no-bin-links` flag for npm installs
- iOS development from Windows requires Expo Go app for testing

## Recent Progress Session (Latest)

### What We Accomplished
1. **Adaptive Column Detection**: Implemented image splitting approach that detects 1-4 columns automatically and processes left-to-right, top-to-bottom
2. **Advanced Text Classification**: Built intelligent parsing to distinguish between:
   - Categories (PIZZA, SANDWICH, SALAD, etc.)
   - Dish names (PIZZA OLIVA, CHICKEN SANDWICH, etc.) 
   - Descriptions/ingredients (MOZZARELLA, BELL PEPPER, etc.)
   - Prices ($24.99, $15.99, etc.)
3. **Translation Integration**: Connected Google Translate API with proper authentication
4. **Price Normalization**: Fixed double $ signs and inconsistent price formatting
5. **Description Combining**: Multi-line ingredient descriptions are properly combined

### Current Issues Still Being Fixed
1. **CHEESE classification**: Still showing as "other" instead of "dish" despite being followed by price
2. **Category assignment**: OLIVICH should be under SANDWICH category but may be misplaced
3. **Translation API auth**: Some network errors, may need credential verification
4. **Description boundaries**: Occasionally picks up addresses/contact info in dish descriptions

### Technical Implementation
- **OCR Service**: Uses expo-image-manipulator to split images by detected columns
- **Menu Service**: Orchestrates OCR → text processing → translation pipeline  
- **Translation Service**: Complex text classification with context-aware detection
- **Price Extraction**: Handles various price formats ($XX.XX, XX.XX$, plain numbers)

### Next Priority Tasks
1. **Fix remaining classification issues**: CHEESE detection, category assignment
2. **Add category translations**: Show "PIZZA / 披萨" format
3. **Handle customer options**: (BEEF/CHICKEN) choices, OR selections
4. **Improve validation**: Better menu vs non-menu detection
5. **Add real food photos**: Connect to food API for actual dish images

### Code Organization Notes
- All menu processing logic in `src/services/translationService.js`
- Column detection and OCR in `src/services/ocrService.js`  
- Main orchestration in `src/services/menuService.js`
- UI display in `src/screens/MenuResultScreen.js`

### For Next Session
- Review recent commits for context of text classification improvements
- Focus on the CHEESE detection fallback logic and category assignment
- Consider adding debugging logs to understand classification flow better