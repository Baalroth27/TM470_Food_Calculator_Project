import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { API_BASE_URL } from '../utils/api';

const RecipeFormScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEditing = !!id; // A boolean: true if id exists, false otherwise

  const [formData, setFormData] = useState({
    name: "",
    price: "", // This is the selling_price
  });

  const [loading, setLoading] = useState(false);

  // This effect fetches existing recipe data if we are editing
  useEffect(() => {
    if (isEditing) {
      setLoading(true);
      const fetchRecipeData = async () => {
        const apiUrl = `${API_BASE_URL}/recipes/${id}`;
        try {
          const response = await fetch(apiUrl);
          if (!response.ok) throw new Error("Failed to fetch recipe data");
          const data = await response.json();

          setFormData({
            name: data.name,
            price: data.selling_price.toString(), // The API returns this as selling_price
          });
        } catch (error: any) {
          Alert.alert("Error", "Could not load recipe data.");
          router.back();
        } finally {
          setLoading(false);
        }
      };
      fetchRecipeData();
    }
  }, [id]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prevState) => ({ ...prevState, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      Alert.alert("Error", "Please fill out all fields.");
      return;
    }

    setLoading(true);
    const apiUrl = isEditing
      ? `${API_BASE_URL}/recipes/${id}`
      : `${API_BASE_URL}/recipes`;
    const method = isEditing ? "PUT" : "POST";

    try {
      const body = {
        name: formData.name,
        price: parseFloat(formData.price.replace(",", ".")), // The API expects 'price'
      };

      const response = await fetch(apiUrl, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.msg || `Failed to ${isEditing ? "update" : "create"} recipe`
        );
      }

      Alert.alert(
        "Success",
        `Recipe ${isEditing ? "updated" : "created"} successfully!`
      );
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{ title: isEditing ? "Edit Recipe" : "Add Recipe" }}
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.form}>
          <Text style={styles.label}>Recipe Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Spaghetti Bolognese"
            value={formData.name}
            onChangeText={(text) => handleInputChange("name", text)}
          />

          <Text style={styles.label}>Selling Price (€)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 15.00"
            keyboardType="decimal-pad"
            value={formData.price}
            onChangeText={(text) => handleInputChange("price", text)}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F5FF",
  },
  header: {
    padding: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  form: {
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 20,
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 20,
    justifyContent: "center", // Helps align the picker text on Android
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    marginTop: 30,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#DC3545", // Red
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: "#28A745", // Green
    marginLeft: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default RecipeFormScreen;
