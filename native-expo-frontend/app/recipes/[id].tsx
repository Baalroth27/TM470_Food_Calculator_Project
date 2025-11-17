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
  Modal,
} from "react-native";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { useLocalSearchParams, useFocusEffect, Link, Stack } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import type { KeyboardAwareScrollView as KeyboardAwareScrollViewType } from "react-native-keyboard-aware-scroll-view";
import { API_BASE_URL } from "../../utils/api";

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
  final_yield_weight_grams: string | null;
  serving_portions: number | null;
  calculated_cost: string;
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
  const [yieldWeight, setYieldWeight] = useState("");
  const [servingPortions, setServingPortions] = useState("");
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
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  // --- Data Fetching Logic ---
  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const recipeApiUrl = `${API_BASE_URL}/recipes/${id}`;
      const ingredientsApiUrl = `${API_BASE_URL}/ingredients`;

      const [recipeResponse, ingredientsResponse] = await Promise.all([
        fetch(recipeApiUrl),
        fetch(ingredientsApiUrl),
      ]);

      if (!recipeResponse.ok) throw new Error("Failed to fetch recipe details");
      if (!ingredientsResponse.ok)
        throw new Error("Failed to fetch all ingredients");

      const recipeData = await recipeResponse.json();
      const allIngredientsData = await ingredientsResponse.json();
      setAllIngredients(allIngredientsData.items);

      setRecipe(recipeData);
      if (
        allIngredientsData.items.length > 0 &&
        selectedIngredientId === null
      ) {
        setSelectedIngredientId(allIngredientsData.items[0].id);
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

  useEffect(() => {
    if (recipe) {
      // Set the input fields with data from the recipe, converting null/0 to empty strings
      setYieldWeight(recipe.final_yield_weight_grams?.toString() || "");
      setServingPortions(recipe.serving_portions?.toString() || "");
    }
  }, [recipe]); // This effect runs whenever the main 'recipe' object changes

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
    const apiUrl = `${API_BASE_URL}/recipes/${id}/ingredients`;

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

  // --- Handlers ---

  const handleUpdateIngredient = async () => {
    if (
      !editingIngredientId ||
      !editingQuantity ||
      parseFloat(editingQuantity) <= 0
    ) {
      Alert.alert("Error", "Please enter a valid quantity.");
      return;
    }
    const apiUrl = `${API_BASE_URL}/recipes/${id}/ingredients/${editingIngredientId}`;
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
            const apiUrl = `${API_BASE_URL}/recipes/${id}/ingredients/${ingredientId}`;
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

  const handleSaveYield = async () => {
    const payload: {
      final_yield_weight_grams?: number;
      serving_portions?: number;
    } = {};

    // Validate and prepare the weight, if it was entered
    if (yieldWeight.trim() !== "") {
      const weight = parseFloat(yieldWeight.replace(",", "."));
      if (isNaN(weight) || weight < 0) {
        Alert.alert(
          "Invalid Input",
          "Final weight must be a valid, non-negative number."
        );
        return;
      }
      payload.final_yield_weight_grams = weight;
    }

    // Validate and prepare the portions, if it was entered
    if (servingPortions.trim() !== "") {
      const portions = parseInt(servingPortions, 10);
      if (isNaN(portions) || portions < 0) {
        Alert.alert(
          "Invalid Input",
          "Number of servings must be a valid, non-negative integer."
        );
        return;
      }
      payload.serving_portions = portions;
    }

    // Check if there's anything to save
    if (Object.keys(payload).length === 0) {
      Alert.alert("No Input", "Please enter a value to save.");
      return;
    }

    // Make the API call with the dynamic payload
    const apiUrl = `${API_BASE_URL}/recipes/${id}/yield`;
    try {
      const response = await fetch(apiUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), // Send only the provided data
      });

      if (!response.ok) {
        throw new Error("Failed to save yield information.");
      }

      // Optimistically update the UI state with the new values
      setRecipe((currentRecipe) => {
        if (!currentRecipe) return null;

        // Create a new object with the updated values, ensuring correct types
        const updatedData = { ...currentRecipe };
        if (payload.final_yield_weight_grams !== undefined) {
          updatedData.final_yield_weight_grams =
            payload.final_yield_weight_grams.toString(); // Convert number to string
        }
        if (payload.serving_portions !== undefined) {
          updatedData.serving_portions = payload.serving_portions;
        }

        return updatedData;
      });

      Alert.alert("Success", "Yield information has been saved.");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
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
            Selling Price: €{parseFloat(recipe.selling_price.replace(",", ".")).toFixed(2)}
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
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setIsPickerVisible(true)}
          >
            <Text style={styles.pickerButtonText}>
              {selectedIngredient
                ? selectedIngredient.name
                : "Select an ingredient..."}
            </Text>
          </TouchableOpacity>
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

        <View style={styles.yieldContainer}>
          <Text style={styles.subHeader}>Yield Information</Text>

          <View style={styles.inputRow}>
            <Text style={styles.label}>Final Weight (grams)</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="e.g., 1850"
              value={yieldWeight}
              onChangeText={setYieldWeight}
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.label}>Number of Servings</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder="e.g., 8"
              value={servingPortions}
              onChangeText={setServingPortions}
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveYield}>
            <Text style={styles.saveButtonText}>Save Yield</Text>
          </TouchableOpacity>

          {/* --- Calculated Costs Display --- */}
          {/* Only show this entire block if at least ONE of the yield values is valid */}
          {recipe &&
          (parseFloat(recipe.final_yield_weight_grams ?? "0") > 0 ||
            (recipe.serving_portions ?? 0) > 0) ? (
            <View style={styles.resultsContainer}>
              {/* Only show Cost per Portion if serving_portions is valid */}
              {(recipe.serving_portions ?? 0) > 0 ? (
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Cost per Portion</Text>
                  <Text style={styles.resultValue}>
                    {`€${(
                      parseFloat(recipe.calculated_cost.replace(",", ".")) /
                      recipe.serving_portions!
                    ).toFixed(2)}`}
                  </Text>
                </View>
              ) : null}

              {/* Only show Cost per Kg if final_yield_weight_grams is valid */}
              {parseFloat(recipe.final_yield_weight_grams ?? "0") > 0 ? (
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Cost per Kg</Text>
                  <Text style={styles.resultValue}>
                    {`€${(
                      (parseFloat(recipe.calculated_cost) /
                        parseFloat(recipe.final_yield_weight_grams!)) *
                      1000
                    ).toFixed(2)}`}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
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
                  <>
                    {/* --- Editing view --- */}
                    <TextInput
                      style={styles.editInput}
                      value={editingQuantity}
                      onChangeText={setEditingQuantity}
                      keyboardType="decimal-pad"
                      autoFocus={true}
                      ref={(el) => {
                        inputRefs.current.set(item.ingredient_id, el);
                      }}
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
                  <>
                    {/* --- Display view --- */}
                    <View>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemDetails}>
                        {`${parseFloat(item.quantity)} ${item.unit}`}
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
        <Modal
          animationType="slide"
          transparent={true}
          visible={isPickerVisible}
          onRequestClose={() => setIsPickerVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setIsPickerVisible(false)}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
              <Picker
                selectedValue={selectedIngredientId}
                onValueChange={(itemValue) =>
                  setSelectedIngredientId(itemValue)
                }
                itemStyle={{ color: "black" }}
              >
                {allIngredients.map((ing) => (
                  <Picker.Item key={ing.id} label={ing.name} value={ing.id} />
                ))}
              </Picker>
            </View>
          </View>
        </Modal>
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
  pickerButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 20,
    height: 50,
    justifyContent: "center",
  },
  pickerButtonText: {
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end", // Aligns modal to the bottom
    backgroundColor: "rgba(0,0,0,0.5)", // Dims the background
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  doneButton: {
    alignItems: "flex-end",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  doneButtonText: {
    color: "#6200ee",
    fontSize: 18,
    fontWeight: "600",
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
  yieldContainer: {
    paddingHorizontal: 16,
    marginVertical: 20,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 8,
  },
  inputRow: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#F7F5FF",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  saveButton: {
    backgroundColor: "#6200ee",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  resultsContainer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 15,
  },
  resultItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  resultLabel: {
    fontSize: 16,
    color: "#333",
  },
  resultValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6200ee",
  },
});

export default RecipeDetailScreen;
