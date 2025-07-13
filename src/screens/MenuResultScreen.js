import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, ActivityIndicator } from 'react-native';

const MenuResultScreen = ({ route }) => {
  const { imageUri } = route.params;
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    // Simulate processing time
    setTimeout(() => {
      // Mock translated menu data (English to Chinese)
      setMenuItems([
        {
          id: 1,
          original: "Grilled Salmon",
          translated: "烤三文鱼",
          price: "$28.00",
          rating: 4.5,
          image: "https://via.placeholder.com/60x60?text=🐟",
          description: "Fresh Atlantic salmon grilled to perfection with herbs"
        },
        {
          id: 2,
          original: "Caesar Salad",
          translated: "凯撒沙拉",
          price: "$15.00",
          rating: 4.2,
          image: "https://via.placeholder.com/60x60?text=🥗",
          description: "Crisp romaine lettuce with parmesan cheese and croutons"
        },
        {
          id: 3,
          original: "Beef Steak",
          translated: "牛排",
          price: "$35.00",
          rating: 4.7,
          image: "https://via.placeholder.com/60x60?text=🥩",
          description: "Premium ribeye steak cooked to your preference"
        },
        {
          id: 4,
          original: "Chocolate Cake",
          translated: "巧克力蛋糕",
          price: "$12.00",
          rating: 4.8,
          image: "https://via.placeholder.com/60x60?text=🍰",
          description: "Rich chocolate layer cake with vanilla frosting"
        }
      ]);
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
        
        {menuItems.map((item) => (
          <View key={item.id} style={styles.menuItem}>
            <View style={styles.itemHeader}>
              <View style={styles.textContainer}>
                <Text style={styles.originalText}>{item.original}</Text>
                <Text style={styles.translatedText}>{item.translated}</Text>
                <Text style={styles.description}>{item.description}</Text>
              </View>
              <Image source={{ uri: item.image }} style={styles.dishImage} />
            </View>
            <View style={styles.itemFooter}>
              <Text style={styles.price}>{item.price}</Text>
              <Text style={styles.rating}>⭐ {item.rating}</Text>
            </View>
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
    height: 200,
    resizeMode: 'cover',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    padding: 20,
    paddingBottom: 10,
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
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  rating: {
    fontSize: 16,
    color: '#f39c12',
  },
});

export default MenuResultScreen;