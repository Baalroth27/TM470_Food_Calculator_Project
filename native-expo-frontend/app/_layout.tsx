import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      {/* This line targets the entire tab navigator and hides its header */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* This line targets the recipe details screen and configures its header */}
      <Stack.Screen
        name="recipes/[id]"
        options={{
          title: "Recipe Details", // Sets the text in the header
          headerShown: true, // Ensures the header is visible
        }}
      />
      <Stack.Screen name="ingredient-form" />
      <Stack.Screen name="recipe-form" />
    </Stack>
  );
}
