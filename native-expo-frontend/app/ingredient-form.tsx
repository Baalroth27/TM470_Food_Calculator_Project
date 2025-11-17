import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import { API_BASE_URL } from "../utils/api";

const IngredientFormScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    standard_measurement_unit: "g",
    purchase_pack_price: "",
    pack_quantity_in_standard_units: "",
  });

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // State to track if we are editing

  // This effect runs when the screen loads
  useEffect(() => {
    if (id) {
      setIsEditing(true);
      setLoading(true);
      const fetchIngredientData = async () => {
        const apiUrl = `${API_BASE_URL}/ingredients/${id}`;
        try {
          const response = await fetch(apiUrl);
          if (!response.ok) throw new Error("Failed to fetch ingredient data");
          const data = await response.json();

          // Pre-fill the form with the fetched data
          setFormData({
            name: data.name,
            standard_measurement_unit: data.standard_measurement_unit,
            purchase_pack_price: data.purchase_pack_price.toString(),
            pack_quantity_in_standard_units:
              data.pack_quantity_in_standard_units.toString(),
          });
        } catch (error: any) {
          Alert.alert("Error", "Could not load ingredient data.");
          router.back();
        } finally {
          setLoading(false);
        }
      };
      fetchIngredientData();
    }
  }, [id]); // Effect depends on the id parameter

  const handleInputChange = (field: string, value: string) => {
    setFormData((prevState) => ({ ...prevState, [field]: value }));
  };

  // --- API Call to Save the Ingredient ---
  const handleSave = async () => {
    // --- Validation ---
    if (
      !formData.name ||
      !formData.purchase_pack_price ||
      !formData.pack_quantity_in_standard_units
    ) {
      Alert.alert("Error", "Please fill out all required fields.");
      return;
    }

    setLoading(true);
    // Determine the URL and Method based on whether we are editing
    const apiUrl = isEditing
      ? `${API_BASE_URL}/ingredients/${id}`
      : `${API_BASE_URL}/ingredients`;
    const method = isEditing ? "PUT" : "POST";

    try {
      const body = {
        name: formData.name,
        standard_measurement_unit: formData.standard_measurement_unit,
        purchase_pack_price: parseFloat(
          formData.purchase_pack_price.replace(",", ".")
        ),
        pack_quantity_in_standard_units: parseFloat(
          formData.pack_quantity_in_standard_units.replace(",", ".")
        ),
      };

      const response = await fetch(apiUrl, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.msg ||
            `Failed to ${method === "POST" ? "create" : "update"} ingredient`
        );
      }

      Alert.alert(
        "Success",
        `Ingredient ${method === "POST" ? "created" : "updated"} successfully!`
      );
      router.back(); // Navigate back to the previous screen
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{ title: isEditing ? "Edit Ingredient" : "Add Ingredient" }}
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.form}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., All-Purpose Flour"
            value={formData.name}
            onChangeText={(text) => handleInputChange("name", text)}
          />

          <Text style={styles.label}>Purchase Pack Price (€)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 15.50"
            keyboardType="decimal-pad"
            value={formData.purchase_pack_price}
            onChangeText={(text) =>
              handleInputChange("purchase_pack_price", text)
            }
          />

          <Text style={styles.label}>Pack Quantity</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 5000"
            keyboardType="decimal-pad"
            value={formData.pack_quantity_in_standard_units}
            onChangeText={(text) =>
              handleInputChange("pack_quantity_in_standard_units", text)
            }
          />

          <Text style={styles.label}>Unit of Measurement</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setIsPickerVisible(true)}
          >
            <Text style={styles.pickerButtonText}>
              {formData.standard_measurement_unit}
            </Text>
          </TouchableOpacity>
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
                itemStyle={{ height: 200, color: "black" }}
                selectedValue={formData.standard_measurement_unit}
                onValueChange={(itemValue) =>
                  handleInputChange("standard_measurement_unit", itemValue)
                }
              >
                <Picker.Item label="grams (g)" value="g" />
                <Picker.Item label="milliliters (ml)" value="ml" />
                <Picker.Item label="piece (pc)" value="pc" />
              </Picker>
            </View>
          </View>
        </Modal>
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

export default IngredientFormScreen;
