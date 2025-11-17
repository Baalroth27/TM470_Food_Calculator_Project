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
import { useFocusEffect, Link } from "expo-router";
import Constants from "expo-constants";
import Checkbox from "expo-checkbox";
import { API_BASE_URL } from '../../utils/api';

// Define a type for our recipe object
interface Recipe {
  id: number;
  name: string;
  selling_price: string;
  calculated_cost: string;
}

const RecipesScreen = () => {
  // --- State Management ---
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useFocusEffect(
    useCallback(() => {
      const fetchInitialData = async () => {
        setLoading(true);
        setError(null);
        const apiUrl = `${API_BASE_URL}/recipes?page=1&limit=20`;
        try {
          const response = await fetch(apiUrl);
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);

          const data = await response.json();

          setRecipes(data.items); // Set the first page of recipes
          setTotalItems(data.total); // Set the total count
          setPage(1); // Reset the page count
          setSearchQuery("");
        } catch (e: any) {
          setError(e.message);
        } finally {
          setLoading(false);
        }
      };

      fetchInitialData();
    }, [])
  );

  const loadMoreItems = async () => {
    // Prevent fetching if we're already loading or if we've loaded all items
    if (isLoadingMore || recipes.length >= totalItems) {
      return;
    }

    setIsLoadingMore(true);
    const nextPage = page + 1;
    const apiUrl = `${API_BASE_URL}/recipes?page=${nextPage}&limit=20`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();

      // Append the new recipes to the existing list
      setRecipes((prevRecipes) => [...prevRecipes, ...data.items]);
      setPage(nextPage);
    } catch (e: any) {
      console.error(`Failed to load more items:`, e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Memoize the filtered recipes to avoid recalculating on every render
  const filteredRecipes = useMemo(() => {
    if (!searchQuery) {
      return recipes;
    }
    return recipes.filter((recipe) =>
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, recipes]);

  // --- Handlers ---

  const handleDelete = (id: number) => {
    Alert.alert(
      "Delete Recipe",
      "Are you sure you want to delete this recipe? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const apiUrl = `${API_BASE_URL}/recipes/${id}`;

            try {
              const response = await fetch(apiUrl, {
                method: "DELETE",
              });

              if (!response.ok) {
                throw new Error("Failed to delete the recipe.");
              }

              // If the delete was successful, remove the item from the local state
              setRecipes((currentRecipes) =>
                currentRecipes.filter((recipe) => recipe.id !== id)
              );
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  const handleBulkDelete = () => {
    const selectedCount = selectedIds.length;
    if (selectedCount === 0) {
      Alert.alert("No Recipes Selected", "Please select recipes to delete.");
      return;
    }

    Alert.alert(
      "Delete Recipes",
      `Are you sure you want to delete ${selectedCount} recipes? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const apiUrl = `${API_BASE_URL}/recipes`;
            try {
              const response = await fetch(apiUrl, {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ ids: selectedIds }),
              });

              if (!response.ok) {
                throw new Error("Failed to delete the recipes.");
              }

              // If the delete was successful, remove the items from the local state
              setRecipes((currentRecipes) =>
                currentRecipes.filter(
                  (recipe) => !selectedIds.includes(recipe.id)
                )
              );
              setSelectedIds([]);
              setIsSelectionMode(false);
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  const handleToggleSelection = (id: number) => {
    // Check if the ID is already in the array
    if (selectedIds.includes(id)) {
      // Remove it
      setSelectedIds((current) => current.filter((item) => item !== id));
    } else {
      // Add it
      setSelectedIds((current) => [...current, id]);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
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
        {/* Left Column */}
        <View style={styles.headerLeft}>
          {isSelectionMode ? (
            <TouchableOpacity
              onPress={() => {
                setIsSelectionMode(false);
                setSelectedIds([]);
              }}
            >
              <Text style={styles.headerButtonText}>Cancel</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setIsSelectionMode(true)}>
              <Text style={styles.headerButtonText}>Select</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Center Column */}
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Recipes</Text>
        </View>

        {/* Right Column */}
        <View style={styles.headerRight}>
          {isSelectionMode ? (
            <TouchableOpacity
              onPress={handleBulkDelete}
              disabled={selectedIds.length === 0}
            >
              <Text
                style={[
                  styles.headerButtonText,
                  selectedIds.length === 0 ? styles.disabledButtonText : {},
                ]}
              >
                Delete
              </Text>
            </TouchableOpacity>
          ) : (
            <Link href="/recipe-form" asChild>
              <TouchableOpacity>
                <Text style={styles.headerButtonText}>+</Text>
              </TouchableOpacity>
            </Link>
          )}
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for recipes..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Recipes List */}
      <FlatList
        data={filteredRecipes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.itemContainer}
            // Only allow tapping the row when in selection mode
            onPress={
              isSelectionMode ? () => handleToggleSelection(item.id) : undefined
            }
            activeOpacity={isSelectionMode ? 0.6 : 1.0} // Provide visual feedback on tap
          >
            {/* --- Conditional Checkbox --- */}
            {isSelectionMode && (
              <Checkbox
                style={styles.checkbox}
                value={selectedIds.includes(item.id)}
                onValueChange={() => handleToggleSelection(item.id)}
                color={selectedIds.includes(item.id) ? "#6200ee" : undefined}
              />
            )}
            <View style={styles.itemContent}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDetails}>
                Cost: €{parseFloat(item.calculated_cost).toFixed(2)}
              </Text>
            </View>

            {!isSelectionMode && (
              <View style={styles.itemActions}>
                <TouchableOpacity
                  onPress={() => handleDelete(item.id)}
                  style={styles.iconButton}
                >
                  <Text style={styles.iconText}>🗑️</Text>
                </TouchableOpacity>
                <Link href={`/recipes/${item.id}`} asChild>
                  <TouchableOpacity style={styles.iconButton}>
                    <Text style={styles.iconText}>✍️</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            )}
          </TouchableOpacity>
        )}
        onEndReached={loadMoreItems} // Call loadMoreItems when the end is reached
        onEndReachedThreshold={0.5}  // Trigger when halfway through the list
        ListFooterComponent={() =>
          isLoadingMore ? (
            <ActivityIndicator
              size="large"
              color="#6200ee"
              style={{ marginVertical: 20 }}
            />
          ) : null
        }
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
    padding: 20,
  },
  text: {
    color: "#fff",
    marginTop: 10,
    textAlign: "center",
  },
  errorText: {
    color: "#ff4444",
    fontSize: 16,
    textAlign: "center",
  },

  // Header Styles
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  headerLeft: {
    flex: 1,
    alignItems: "flex-start", // Aligns content to the left
  },
  headerCenter: {
    flex: 1,
    alignItems: "center", // Aligns content to the center
  },
  headerRight: {
    flex: 1,
    alignItems: "flex-end", // Aligns content to the right
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 18,
    color: "#6200ee",
    fontWeight: "500",
  },
  disabledButtonText: {
    color: "#ccc",
  },
  headerTitle: {
    fontSize: 22,
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
  itemContent: {
    flex: 1, // Allows the name/details to take up the remaining space
  },
  checkbox: {
    marginRight: 15,
  },
});

export default RecipesScreen;
