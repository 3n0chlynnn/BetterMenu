import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, ActivityIndicator } from 'react-native';

const MenuResultScreen = ({ route }) => {
  const { imageUri } = route.params;
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    // Simulate processing time
    setTimeout(() => {
      // Mock translated menu data (English to Chinese) with categories
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
          original: "Vegetable Soup",
          translated: "蔬菜汤",
          category: "Appetizers",
          image: "https://via.placeholder.com/60x60?text=🍲",
          description: "Fresh seasonal vegetables in clear broth"
        },
        {
          id: 3,
          original: "Grilled Salmon",
          translated: "烤三文鱼",
          category: "Entrees",
          image: "https://via.placeholder.com/60x60?text=🐟",
          description: "Fresh Atlantic salmon grilled to perfection with herbs"
        },
        {
          id: 4,
          original: "Beef Steak",
          translated: "牛排",
          category: "Entrees",
          image: "https://via.placeholder.com/60x60?text=🥩",
          description: "Premium ribeye steak cooked to your preference"
        },
        {
          id: 5,
          original: "Fish and Chips",
          translated: "炸鱼薯条",
          category: "Entrees",
          image: "https://via.placeholder.com/60x60?text=🍟",
          description: "Battered fish with crispy fries"
        },
        {
          id: 6,
          original: "Chicken Alfredo",
          translated: "阿尔弗雷多鸡肉面",
          category: "Entrees",
          image: "https://via.placeholder.com/60x60?text=🍝",
          description: "Creamy pasta with grilled chicken"
        },
        {
          id: 7,
          original: "Chocolate Cake",
          translated: "巧克力蛋糕",
          category: "Desserts",
          image: "https://via.placeholder.com/60x60?text=🍰",
          description: "Rich chocolate layer cake with vanilla frosting"
        },
        {
          id: 8,
          original: "Apple Pie",
          translated: "苹果派",
          category: "Desserts",
          image: "https://via.placeholder.com/60x60?text=🥧",
          description: "Traditional apple pie with cinnamon"
        },
        {
          id: 9,
          original: "Coffee",
          translated: "咖啡",
          category: "Beverages",
          image: "https://via.placeholder.com/60x60?text=☕",
          description: "Freshly brewed house blend coffee"
        },
        {
          id: 10,
          original: "Fresh Orange Juice",
          translated: "鲜榨橙汁",
          category: "Beverages",
          image: "https://via.placeholder.com/60x60?text=🍊",
          description: "Freshly squeezed orange juice"
        }
      ];
      
      // Group dishes by category
      const groupedItems = allItems.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      }, {});
      
      setMenuItems(groupedItems);
      setLoading(false);
    }, 2000);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Translating menu...</Text>
        <Text style={styles.loadingSubtext}>Analyzing image and fetching dish information</Text>
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
                    <Text style={styles.description}>{item.description}</Text>
                  </View>
                  <Image source={{ uri: item.image }} style={styles.dishImage} />
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
  },
  dishImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
});

export default MenuResultScreen;