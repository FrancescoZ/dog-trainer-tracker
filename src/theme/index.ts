import { MD3LightTheme, MD3DarkTheme, adaptNavigationTheme } from 'react-native-paper';
import { DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';

// Define our brand colors
const primaryColor = '#4A90E2'; // A pleasant blue
const secondaryColor = '#50C878'; // Emerald green
const errorColor = '#FF6B6B'; // Light red

// Adapt navigation theme
const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

// Create light theme
export const lightTheme = {
  ...MD3LightTheme,
  ...LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...LightTheme.colors,
    primary: primaryColor,
    secondary: secondaryColor,
    error: errorColor,
    background: '#F5F7FA',
    surface: '#FFFFFF',
    text: '#333333',
    surfaceVariant: '#EAEAEA',
  },
};

// Create dark theme
export const darkTheme = {
  ...MD3DarkTheme,
  ...DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...DarkTheme.colors,
    primary: primaryColor,
    secondary: secondaryColor,
    error: errorColor,
    background: '#121212',
    surface: '#1E1E1E',
    text: '#F0F0F0',
    surfaceVariant: '#2C2C2C',
  },
}; 
