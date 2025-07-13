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
- ⏳ OCR integration (planned)
- ⏳ Translation API (planned)
- ⏳ Food photo/review APIs (planned)

## Development Notes

### Design Pattern
- Each menu item displays: Original text → Translated text + thumbnail photo + rating
- Inline photo approach chosen over clickable items for better UX
- Mock data currently used for development

### Known Issues
- WSL permissions require `--no-bin-links` flag for npm installs
- iOS development from Windows requires Expo Go app for testing

### Next Steps for Implementation
1. Integrate Google Vision API for OCR
2. Add Google Translate API for menu translation
3. Connect Yelp/Google Places APIs for dish photos and reviews
4. Implement proper error handling and loading states
5. Add offline support and caching