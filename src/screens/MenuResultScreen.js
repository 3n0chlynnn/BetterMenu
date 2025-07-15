import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { processMenuPhoto } from '../services/menuService';
import { processMenuText } from '../services/translationService';

const MenuResultScreen = ({ route, navigation }) => {
  const { imageUri } = route.params;
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const processImage = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await processMenuPhoto(imageUri);
        
        if (result.success) {
          setMenuItems(result.menuItems);
        } else {
          // Check if it's a menu validation error
          if (result.error && result.error.includes("doesn't appear to be a menu")) {
            setError(result.error);
            return; // Don't show mock data for validation errors
          }
          
          // Fallback to mock data if API fails
          console.log('API failed, using mock data:', result.error);
          const mockMenuItems = await getMockMenuItems();
          setMenuItems(mockMenuItems);
        }
      } catch (err) {
        console.error('Failed to process menu:', err);
        if (err.message && err.message.includes("doesn't appear to be a menu")) {
          setError(err.message);
          return; // Don't show mock data for validation errors
        }
        
        setError('Failed to process menu. Using demo data.');
        // Use the comprehensive menu processing instead of simple mock
        const mockMenuItems = await getMockMenuItems();
        setMenuItems(mockMenuItems);
      } finally {
        setLoading(false);
      }
    };

    processImage();
  }, [imageUri]);

  // Comprehensive mock data function using the real processing logic
  const getMockMenuItems = async () => {
    const mockOCRText = `APPETIZERS
Caesar Salad
Fresh romaine lettuce with parmesan
$12.95

Tomato Soup
Creamy tomato basil soup
$8.95

Spinach Artichoke Dip
Served with tortilla chips
$10.95

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

Pasta Carbonara
Creamy pasta with bacon and parmesan
$16.95

Fish Tacos
Fresh fish with cabbage slaw
$18.95

DESSERTS
Chocolate Cake
Rich chocolate layer cake
$7.95

Apple Pie
Traditional apple pie with cinnamon
$6.95

Tiramisu
Classic Italian dessert
$8.95

BEVERAGES
Coffee
Freshly brewed house blend
$3.95

Orange Juice
Freshly squeezed
$4.95

Iced Tea
Sweet or unsweetened
$2.95`;

    try {
      const menuItems = await processMenuText(mockOCRText);
      return menuItems.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      }, {});
    } catch (error) {
      console.error('Mock menu processing failed:', error);
      return getSimpleMockData();
    }
  };

  // Simple fallback mock data function (original)
  const getSimpleMockData = () => {
    const allItems = [
      {
        id: 1,
        original: "Caesar Salad",
        translated: "凯撒沙拉",
        category: "Appetizers",
        image: "https://via.placeholder.com/60x60?text=🥗",
        description: "Crisp romaine lettuce with parmesan cheese and croutons"
      },
      {
        id: 2,
        original: "Grilled Salmon",
        translated: "烤三文鱼",
        category: "Entrees",
        image: "https://via.placeholder.com/60x60?text=🐟",
        description: "Fresh Atlantic salmon grilled to perfection with herbs"
      },
      {
        id: 3,
        original: "Chocolate Cake",
        translated: "巧克力蛋糕",
        category: "Desserts",
        image: "https://via.placeholder.com/60x60?text=🍰",
        description: "Rich chocolate layer cake with vanilla frosting"
      }
    ];
    
    return allItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Processing your menu...</Text>
        <Text style={styles.loadingSubtext}>
          {error ? 'API unavailable - using demo mode' : 'Extracting text and translating dishes'}
        </Text>
      </View>
    );
  }

  // If there's a menu validation error, show a nice error screen
  if (error && error.includes("doesn't appear to be a menu")) {
    return (
      <View style={styles.errorContainer}>
        <Image source={{ uri: imageUri }} style={styles.errorImage} />
        <Text style={styles.errorIcon}>📱</Text>
        <Text style={styles.errorTitle}>Not a Menu</Text>
        <Text style={styles.errorText}>
          This doesn't look like a restaurant menu. Please take a photo of:
        </Text>
        <View style={styles.tipsList}>
          <Text style={styles.tip}>• A restaurant menu with dish names</Text>
          <Text style={styles.tip}>• Text with prices (like $12.99)</Text>
          <Text style={styles.tip}>• Food categories (appetizers, entrees, etc.)</Text>
        </View>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>📷 Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Image source={{ uri: imageUri }} style={styles.originalImage} />
        
        <Text style={styles.sectionTitle}>Translated Menu</Text>
        
        {Object.entries(menuItems).map(([category, items]) => (
          <View key={category}>
            <Text style={styles.categoryTitle}>{category}</Text>
            {items.map((item) => (
              <View key={item.id} style={styles.menuItem}>
                <View style={styles.itemHeader}>
                  <View style={styles.textContainer}>
                    <Text style={styles.originalText}>{item.original}</Text>
                    <Text style={styles.translatedText}>{item.translated}</Text>
                    {item.description && (
                      <Text style={styles.description}>{item.description}</Text>
                    )}
                    {item.translatedDescription && item.translatedDescription !== item.description && (
                      <Text style={styles.translatedDescription}>{item.translatedDescription}</Text>
                    )}
                  </View>
                  <View style={styles.rightContainer}>
                    {item.price && (
                      <Text style={styles.price}>${item.price}</Text>
                    )}
                    <Image source={{ uri: item.image }} style={styles.dishImage} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 20,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 10,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  originalImage: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    backgroundColor: '#f8f9fa',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    padding: 20,
    paddingBottom: 10,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#34495e',
    marginLeft: 20,
    marginTop: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    paddingBottom: 5,
  },
  menuItem: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  textContainer: {
    flex: 1,
    marginRight: 15,
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 60,
  },
  originalText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  translatedText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#95a5a6',
    lineHeight: 18,
    marginBottom: 4,
  },
  translatedDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 18,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#27ae60',
    marginBottom: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 20,
    opacity: 0.7,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  tipsList: {
    alignSelf: 'stretch',
    marginBottom: 30,
  },
  tip: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 8,
    paddingLeft: 20,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dishImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
});

export default MenuResultScreen;