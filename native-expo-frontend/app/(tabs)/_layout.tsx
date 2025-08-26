import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons'; // For icons

const TabLayout = () => {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: '#888', 
        tabBarStyle: {
            backgroundColor: '#fff',
        },
      }}
    >
      <Tabs.Screen
        name="index" 
        options={{
          title: 'Ingredients', 
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="carrot" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="recipes" 
        options={{
          title: 'Recipes', 
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="utensils" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabLayout;