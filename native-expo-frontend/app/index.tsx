import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';

// Define a type for our ingredient object for TypeScript
interface Ingredient {
  id: number;
  name: string;
  cost_per_standard_unit: string;
  standard_measurement_unit: string;
}

const HomeScreen = () => {
  // --- State Management ---
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchIngredients = async () => {
      // ❗ IMPORTANT: Replace with your computer's local IP address
      const apiUrl = 'http://192.168.1.21:3001/api/ingredients'; 

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setIngredients(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchIngredients();
  }, []); // The empty array means this effect runs once when the component mounts

  // --- Render Logic ---
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.text}>Loading Ingredients...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error fetching data:</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.text}>Is your backend server running?</Text>
        <Text style={styles.text}>Is the IP address correct?</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Ingredients</Text>
      <FlatList
        data={ingredients}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemDetails}>
              Cost: ${parseFloat(item.cost_per_standard_unit).toFixed(4)} per {item.standard_measurement_unit}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

// --- Styling ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  itemContainer: {
    backgroundColor: '#1e1e1e',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  itemName: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  itemDetails: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 5,
  },
  text: {
    color: '#fff',
    marginTop: 10,
    textAlign: 'center',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    textAlign: 'center',
  }
});

export default HomeScreen;
