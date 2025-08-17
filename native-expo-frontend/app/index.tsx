import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, ActivityIndicator, TextInput, TouchableOpacity, Alert } from 'react-native';

// Define a type for our ingredient object for TypeScript
interface Ingredient {
  id: number;
  name: string;
  cost_per_standard_unit: string;
  standard_measurement_unit: string;
}

const IngredientsScreen = () => {
  // --- State Management ---
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // --- Data Fetching ---
  useEffect(() => {
    const fetchIngredients = async () => {
      // ❗ IMPORTANT: Replace with your computer's local IP address
      const apiUrl = 'http://192.168.1.14:3001/api/ingredients'; 

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

  // Memoize the filtered ingredients to avoid recalculating on every render
  const filteredIngredients = useMemo(() => {
    if (!searchQuery) {
      return ingredients;
    }
    return ingredients.filter(ingredient =>
      ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, ingredients]);

  // --- Placeholder functions for button presses ---
  const handleSelect = () => Alert.alert('Select Tapped', 'Bulk delete logic will go here.');
  const handleAdd = () => Alert.alert('Add Tapped', 'Navigate to Add Ingredient screen.');
  const handleEdit = (id: number) => Alert.alert('Edit Tapped', `Edit ingredient with ID: ${id}`);
  const handleDelete = (id: number) => {
    Alert.alert(
      'Delete Ingredient',
      'Are you sure you want to delete this ingredient?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => console.log(`Deleting ingredient with ID: ${id}`), style: 'destructive' },
      ]
    );
  };

  // --- Render Logic ---
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleSelect} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Select</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ingredients</Text>
        <TouchableOpacity onPress={handleAdd} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for ingredients..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* List Header */}
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderText}>Name</Text>
        <Text style={styles.listHeaderText}>Price</Text>
      </View>

      {/* Ingredients List */}
      <FlatList
        data={filteredIngredients}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <View>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDetails}>
                ${parseFloat(item.cost_per_standard_unit).toFixed(4)} / {item.standard_measurement_unit}
              </Text>
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconButton}>
                <Text style={styles.iconText}>🗑️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleEdit(item.id)} style={styles.iconButton}>
                 <Text style={styles.iconText}>✍️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5FF', // Light purple background from mockup
  },
  center: { /* ... same as before ... */ },
  errorText: { /* ... same as before ... */ },

  // Header Styles
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 18,
    color: '#000',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },

  // Search Bar Styles
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },

  // List Styles
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 26,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  listHeaderText: {
    color: '#666',
    fontWeight: 'bold',
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 8,
    elevation: 2, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  itemActions: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 15,
    padding: 5,
    // WCAG: Ensure tap targets are large enough
    minWidth: 44, 
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 20,
  },
});

export default IngredientsScreen;
