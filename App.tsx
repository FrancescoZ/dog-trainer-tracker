import React, { useEffect, useState } from 'react';
import { StatusBar, useColorScheme, Text, View } from 'react-native';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import AppNavigator from './src/navigation';
import { useExerciseStore } from './src/store/exerciseStore';
import { ExerciseStore } from './src/types';

// Define light theme
const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#4CAF50', // Green
    primaryContainer: '#E8F5E9',
    secondary: '#FF9800', // Orange
    secondaryContainer: '#FFF3E0',
    error: '#F44336', // Red
  },
};

// Define dark theme
const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#81C784', // Lighter Green for dark theme
    primaryContainer: '#1B5E20',
    secondary: '#FFB74D', // Lighter Orange for dark theme
    secondaryContainer: '#E65100',
    error: '#E57373', // Lighter Red for dark theme
  },
};

export default function App() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const initializeDefaultExercises = useExerciseStore((state: ExerciseStore) => state.initializeDefaultExercises);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize default exercises on first load
  useEffect(() => {
    try {
      initializeDefaultExercises();
      setIsInitialized(true);
    } catch (err) {
      console.error('Error initializing app:', err);
      setError(err instanceof Error ? err.message : 'Unknown error initializing app');
    }
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: 'red', fontSize: 18, marginBottom: 20 }}>An error occurred:</Text>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      {isInitialized ? <AppNavigator /> : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading app...</Text>
        </View>
      )}
    </PaperProvider>
  );
}
