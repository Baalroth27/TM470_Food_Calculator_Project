import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  TextInput,
  FlatList,
  InteractionManager,
} from "react-native";
import React, { useState, useCallback, useRef } from "react";
import { useLocalSearchParams, useFocusEffect, Link, Stack } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import type { KeyboardAwareScrollView as KeyboardAwareScrollViewType } from "react-native-keyboard-aware-scroll-view";

// Define the types for our data
interface RecipeIngredient {
  ingredient_id: number;
  name: string;
  quantity: string;
  unit: string;
}
interface RecipeDetails {
  id: number;
  name: string;
  selling_price: string;
  ingredients: RecipeIngredient[];
}
interface AllIngredients {
  id: number;
  name: string;
  standard_measurement_unit: string;
}

const RecipeDetailScreen = () => {
  const { id } = useLocalSearchParams(); // Gets the [id] from the filename
  const scrollViewRef = useRef<KeyboardAwareScrollViewType>(null);
  const inputRefs = useRef(new Map());

  const [recipe, setRecipe] = useState<RecipeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allIngredients, setAllIngredients] = useState<AllIngredients[]>([]); // To hold all ingredients for the picker
  const [selectedIngredientId, setSelectedIngredientId] = useState<
    number | null
  >(null);
  const [quantity, setQuantity] = useState("");
  const [isAdding, setIsAdding] = useState(false); // A loading state for the add button
  const [editingIngredientId, setEditingIngredientId] = useState<number | null>(
    null
  );
  const [editingQuantity, setEditingQuantity] = useState("");

  // --- Data Fetching Logic ---
  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const recipeApiUrl = `http://192.168.1.12:3001/api/recipes/${id}`; // ❗ Use your IP
      const ingredientsApiUrl = "http://192.168.1.12:3001/api/ingredients"; // ❗ Use your IP

      const [recipeResponse, ingredientsResponse] = await Promise.all([
        fetch(recipeApiUrl),
        fetch(ingredientsApiUrl),
      ]);

      if (!recipeResponse.ok) throw new Error("Failed to fetch recipe details");
      if (!ingredientsResponse.ok)
        throw new Error("Failed to fetch all ingredients");

      const recipeData = await recipeResponse.json();
      const allIngredientsData = await ingredientsResponse.json();

      setRecipe(recipeData);
      setAllIngredients(allIngredientsData);
      if (allIngredientsData.length > 0 && selectedIngredientId === null) {
        setSelectedIngredientId(allIngredientsData[0].id);
      }
    } catch (e: any) {
      setError(e.message);
      Alert.alert("Error", "Could not load data.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // useFocusEffect to re-fetch data every time the screen is viewed
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const selectedIngredient = allIngredients.find(
    (ing) => ing.id === selectedIngredientId
  );

  // Event Handlers
  const handleAddIngredient = async () => {
    // Validation
    if (!selectedIngredient || !quantity || parseFloat(quantity) <= 0) {
      Alert.alert(
        "Error",
        "Please select an ingredient and enter a quantity greater than zero."
      );
      return;
    }

    // Fetch Logic
    setIsAdding(true);
    const apiUrl = `http://192.168.1.12:3001/api/recipes/${id}/ingredients`; // ❗ Use your IP

    try {
      const body = {
        ingredient_id: selectedIngredient.id,
        quantity: parseFloat(quantity),
        unit: selectedIngredient.standard_measurement_unit,
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || "Failed to add ingredient");
      }

      const newRecipeIngredient = await response.json();

      setRecipe((prevRecipe) => {
        if (!prevRecipe) return null;
        const newIngredientDetails = {
          ingredient_id: newRecipeIngredient.ingredient_id,
          name: selectedIngredient.name,
          quantity: newRecipeIngredient.quantity,
          unit: newRecipeIngredient.unit,
        };
        return {
          ...prevRecipe,
          ingredients: [...prevRecipe.ingredients, newIngredientDetails],
        };
      });
      setQuantity("");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsAdding(false);
    }
  };

const startEditing = (item: RecipeIngredient) => {
  setEditingIngredientId(item.ingredient_id);
  setEditingQuantity(item.quantity);

  InteractionManager.runAfterInteractions(() => {
    const inputRef = inputRefs.current.get(item.ingredient_id);
    if (inputRef) {
      // Increase the offset slightly for a better feel
      scrollViewRef.current?.scrollToFocusedInput(inputRef, 150);
    }
  });
};

  const cancelEditing = () => {
    setEditingIngredientId(null);
    setEditingQuantity("");
  };

  const handleUpdateIngredient = async () => {
    if (
      !editingIngredientId ||
      !editingQuantity ||
      parseFloat(editingQuantity) <= 0
    ) {
      Alert.alert("Error", "Please enter a valid quantity.");
      return;
    }
    const apiUrl = `http://192.168.1.12:3001/api/recipes/${id}/ingredients/${editingIngredientId}`; // ❗ Use your IP
    try {
      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: parseFloat(editingQuantity) }),
      });
      if (!response.ok) throw new Error("Failed to update quantity");

      cancelEditing();
      await fetchData(); // Refresh data
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleDeleteIngredient = async (ingredientId: number) => {
    Alert.alert(
      "Remove Ingredient",
      "Are you sure you want to remove this ingredient from the recipe?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const apiUrl = `http://192.168.1.12:3001/api/recipes/${id}/ingredients/${ingredientId}`; // ❗ Use your IP
            try {
              const response = await fetch(apiUrl, { method: "DELETE" });
              if (!response.ok) throw new Error("Failed to remove ingredient");
              await fetchData(); // Refresh data
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  // --- Render Logic ---
  if (loading) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }
  if (error || !recipe) {
    return <Text style={styles.errorText}>Error: {error}</Text>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: recipe.name || "Recipe Details" }} />

      <KeyboardAwareScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        enableOnAndroid={true}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={styles.detailsContainer}>
          <Text style={styles.details}>
            Selling Price: €{parseFloat(recipe.selling_price).toFixed(2)}
          </Text>
          <Link
            href={{ pathname: "/recipe-form", params: { id: recipe.id } }}
            asChild
          >
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit Name / Price</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <View style={styles.addIngredientContainer}>
          <Text style={styles.subHeader}>Add Ingredient</Text>
          <View style={styles.pickerContainer}>
            <Picker
              mode="dialog"
              selectedValue={selectedIngredientId}
              onValueChange={(itemValue) => setSelectedIngredientId(itemValue)}
            >
              {allIngredients.map((ing) => (
                <Picker.Item key={ing.id} label={ing.name} value={ing.id} />
              ))}
            </Picker>
          </View>
          <View style={styles.quantityContainer}>
            <TextInput
              style={styles.quantityInput}
              placeholder="Amount"
              keyboardType="decimal-pad"
              value={quantity}
              onChangeText={setQuantity}
            />
            <Text style={styles.unitText}>
              {selectedIngredient
                ? selectedIngredient.standard_measurement_unit
                : ""}
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddIngredient}
              disabled={isAdding}
            >
              {isAdding ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.addButtonText}>+</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.subHeader}>Current Ingredients</Text>

        <FlatList
          data={recipe.ingredients}
          keyExtractor={(item) => item.ingredient_id.toString()}
          scrollEnabled={false} // Cede scrolling control to the parent
          renderItem={({ item }) => {
            const isCurrentlyEditing =
              editingIngredientId === item.ingredient_id;
            return (
              <View style={styles.itemContainer}>
                {isCurrentlyEditing ? (
                  // EDITING VIEW
                  <>
                    <TextInput
                      style={styles.editInput}
                      value={editingQuantity}
                      onChangeText={setEditingQuantity}
                      keyboardType="decimal-pad"
                      autoFocus={true}
                      ref={(el) => { inputRefs.current.set(item.ingredient_id, el); }}
                    />
                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        onPress={cancelEditing}
                        style={styles.iconButton}
                      >
                        <Text style={styles.iconText}>❌</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleUpdateIngredient}
                        style={styles.iconButton}
                      >
                        <Text style={styles.iconText}>✔️</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  // DISPLAY VIEW
                  <>
                    <View>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemDetails}>
                        {parseFloat(item.quantity)} {item.unit}
                      </Text>
                    </View>
                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        onPress={() =>
                          handleDeleteIngredient(item.ingredient_id)
                        }
                        style={styles.iconButton}
                      >
                        <Text style={styles.iconText}>🗑️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => startEditing(item)}
                        style={styles.iconButton}
                      >
                        <Text style={styles.iconText}>✍️</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No ingredients have been added to this recipe yet.
            </Text>
          }
          ListFooterComponent={<View style={{ height: 400 }} />}
        />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F5FF",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
  },
  details: {
    fontSize: 18,
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
  },
  subHeader: {
    fontSize: 22,
    fontWeight: "bold",
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  addIngredientContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  itemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 20,
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 8,
    minHeight: 80,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
  },
  itemDetails: {
    fontSize: 16,
    color: "#333",
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    marginLeft: 10,
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: { fontSize: 22 },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#888",
  },
  errorText: {
    flex: 1,
    textAlign: "center",
    marginTop: 50,
    color: "red",
    fontSize: 18,
  },
  editInput: {
    flex: 1,
    fontSize: 16,
    borderBottomWidth: 1,
    borderColor: "#6200ee",
    padding: 4,
  },
  editButtonContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: "#6200ee",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 10,
    justifyContent: "center",
    overflow: "hidden",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityInput: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  unitText: {
    fontSize: 16,
    fontWeight: "500",
    marginHorizontal: 10, // Add some space
  },
  addButton: {
    backgroundColor: "#6200ee",
    padding: 10,
    borderRadius: 8,
    marginLeft: 10,
    height: 48, // Match input height
    justifyContent: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  detailsContainer: {
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});

export default RecipeDetailScreen;
