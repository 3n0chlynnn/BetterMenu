# BetterMenu

A React Native mobile app that helps users translate restaurant menus by taking photos. The app provides instant translations with dish photos and reviews to help non-English speakers understand menu items better.

## 🚀 Features

- **📸 Camera Integration**: Take photos of restaurant menus or select from gallery
- **🔍 OCR Text Extraction**: Extract text from menu images using Google Vision API
- **🏗️ Spatial Parsing**: Smart column-aware parsing for multi-column menu layouts
- **🌐 Translation**: Translate menu items and descriptions to target language
- **🖼️ Dish Images**: Display placeholder images for menu items
- **📱 Mobile-First**: Optimized React Native interface for iOS and Android

## 🛠️ Tech Stack

- **Frontend**: React Native with Expo
- **Navigation**: React Navigation v6 (Stack Navigator)
- **Camera**: expo-camera, expo-image-picker
- **File System**: expo-file-system
- **APIs**: Google Vision API (OCR), Google Translate API (planned)
- **Authentication**: Google Cloud Service Account with RSA-SHA256 JWT signing

## 📁 Project Structure

```
src/
├── components/     # Reusable UI components
├── screens/        # Main app screens
│   ├── HomeScreen.js        # Landing page with scan button
│   ├── CameraScreen.js      # Camera interface for menu photos
│   └── MenuResultScreen.js  # Translated menu display
├── services/       # API integrations and business logic
│   ├── menuService.js       # Main menu processing orchestration
│   ├── ocrService.js        # Google Vision API integration
│   ├── translationService.js # Menu parsing and translation logic
│   └── config.js           # API configuration and credentials
└── utils/          # Helper functions and utilities
```

## 🎯 Screen Flow

1. **HomeScreen**: Welcome screen with "Scan Menu" button
2. **CameraScreen**: Camera interface with capture/gallery options
3. **MenuResultScreen**: Displays original image + translated menu items with photos and prices

## ⚙️ Development Setup

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development on macOS)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd BetterMenu

# Install dependencies (WSL/Windows users)
npm install --no-bin-links

# Start development server
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

### Testing on Device
1. Install Expo Go app on your phone
2. Scan QR code from `npm start` to test on real device
3. For iOS testing from Windows, use Expo Go app

## 🔧 Configuration

### API Setup
The app uses Google Cloud Vision API for OCR. Configure your credentials in `src/services/config.js`:

```javascript
export const API_CONFIG = {
  PROJECT_ID: 'your-project-id',
  SERVICE_ACCOUNT_EMAIL: 'your-service-account@project.iam.gserviceaccount.com',
  PRIVATE_KEY: 'your-private-key',
  USE_REAL_APIS: true, // Set to false for development with mock data
};
```

### Development Mode
Set `USE_REAL_APIS: false` in config.js to use mock data during development.

## 🧠 Smart Menu Parsing

### Spatial-Aware Processing
- **Column Detection**: Analyzes white space gaps to detect multi-column layouts
- **Logical Line Reconstruction**: Rebuilds complete menu lines from individual OCR words
- **Sequential Processing**: Processes left column completely before moving to right column

### Intelligent Classification
- **Dish Detection**: Identifies menu items using keyword patterns and structure analysis
- **Category Recognition**: Detects menu sections (PIZZA, SANDWICHES, DESSERTS, etc.)
- **Description Handling**: Captures multi-line ingredient lists and descriptions
- **Price Extraction**: Supports multiple currency formats ($12.99, 12.99$, €, £, ¥, plain numbers)

### Menu Validation
- **Content Analysis**: Validates if photo contains an actual restaurant menu
- **Filtering**: Skips menu headers, option indicators, and contact information
- **Quality Checks**: Ensures sufficient menu-related content before processing

## 🐛 Known Issues & Limitations

- WSL permissions require `--no-bin-links` flag for npm installs
- iOS development from Windows requires Expo Go app for testing
- Real API integration requires valid Google Cloud credentials
- Currently supports English-to-Chinese translation (configurable)

## 🔄 Recent Improvements

- ✅ Fixed gallery button responsiveness and permissions
- ✅ Implemented spatial-aware parsing for column layouts
- ✅ Enhanced dish detection algorithms
- ✅ Added menu validation and error handling
- ✅ Fixed price formatting and duplicate symbols
- ✅ Improved multi-line description capture

## 🚧 Future Development

- [ ] Integrate Yelp/Google Places APIs for dish photos and reviews
- [ ] Add offline support and caching
- [ ] Implement proper error handling and loading states
- [ ] Support additional languages
- [ ] Add user preference settings
- [ ] Implement photo history and favorites

## 📝 Development Notes

### Debugging
- Use emoji logs (🔍, 📊, 🎉) to track processing steps
- Check console output for spatial parsing details
- Monitor API response structures for troubleshooting

### Common Commands
```bash
# Clear cache and restart
npm start -- --clear

# Reset project
npx expo install --fix

# Check dependencies
npx expo doctor
```

## 📄 License

This project is private and proprietary.

## 🤝 Contributing

This is a personal project. Please reach out before making contributions.

---

**Built with ❤️ using React Native and Expo**