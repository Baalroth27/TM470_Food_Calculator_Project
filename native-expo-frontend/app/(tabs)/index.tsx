import React, { useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Link, useFocusEffect } from "expo-router";
import Constants from 'expo-constants';

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
  const [searchQuery, setSearchQuery] = useState("");

  // --- Data Fetching ---
  useFocusEffect(
    useCallback(() => {
      const fetchIngredients = async () => {
        setLoading(true); // Set loading true each time we focus
        const apiUrl = "http://192.168.1.14:3001/api/ingredients"; // ❗ Use your IP
        try {
          const response = await fetch(apiUrl);
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
          const data = await response.json();
          setIngredients(data);
        } catch (e: any) {
          setError(e.message);
        } finally {
          setLoading(false);
        }
      };

      fetchIngredients();
    }, []) // Empty dependency array for useCallback
  );

  // Memoize the filtered ingredients to avoid recalculating on every render
  const filteredIngredients = useMemo(() => {
    if (!searchQuery) {
      return ingredients;
    }
    return ingredients.filter((ingredient) =>
      ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, ingredients]);

  // --- Placeholder functions for button presses ---
  const handleSelect = () =>
    Alert.alert("Select Tapped", "Bulk delete logic will go here.");
  const handleDelete = (id: number) => {
    Alert.alert(
      "Delete Ingredient",
      "Are you sure you want to delete this ingredient? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            const apiUrl = `http://192.168.1.14:3001/api/ingredients/${id}`; // ❗ Use your IP

            try {
              const response = await fetch(apiUrl, {
                method: "DELETE",
              });

              if (!response.ok) {
                throw new Error("Failed to delete the ingredient.");
              }

              // If the delete was successful, remove the item from the local state
              setIngredients((currentIngredients) =>
                currentIngredients.filter((ingredient) => ingredient.id !== id)
              );
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          },
          style: "destructive",
        },
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
        <Link href="/ingredient-form" asChild>
          <TouchableOpacity style={styles.headerButton}>
            <Text style={styles.headerButtonText}>+</Text>
          </TouchableOpacity>
        </Link>
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

      {/* Ingredients List */}
      <FlatList
        data={filteredIngredients}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <View>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDetails}>
                €{parseFloat(item.cost_per_standard_unit).toFixed(4)} /{" "}
                {item.standard_measurement_unit}
              </Text>
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity
                onPress={() => handleDelete(item.id)}
                style={styles.iconButton}
              >
                <Text style={styles.iconText}>🗑️</Text>
              </TouchableOpacity>
              <Link
                href={{ pathname: "/ingredient-form", params: { id: item.id } }}
                asChild
              >
                <TouchableOpacity style={styles.iconButton}>
                  <Text style={styles.iconText}>✍️</Text>
                </TouchableOpacity>
              </Link>
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
    backgroundColor: "#F7F5FF",
    paddingTop: Constants.statusBarHeight, // Adjust for status bar height
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
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
  },

  // Header Styles
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 18,
    color: "#000",
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },

  // Search Bar Styles
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  // List Styles
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 26,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  listHeaderText: {
    color: "#666",
    fontWeight: "bold",
  },
  itemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 8,
    elevation: 2, // Shadow for Android
    shadowColor: "#000", // Shadow for iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  itemDetails: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  itemActions: {
    flexDirection: "row",
  },
  iconButton: {
    marginLeft: 15,
    padding: 5,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 20,
  },
});

export default IngredientsScreen;
