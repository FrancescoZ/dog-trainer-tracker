import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

// Stack navigators
import DogsStackNavigator from './DogsStackNavigator';
import ExercisesStackNavigator from './ExercisesStackNavigator';
import TrainingStackNavigator from './TrainingStackNavigator';
import AnalyticsStackNavigator from './AnalyticsStackNavigator';

// Define our navigation types
export type RootTabParamList = {
  Dogs: undefined;
  Exercises: undefined;
  Training: undefined;
  Analytics: undefined;
};

// Define default screen options to pass to all navigators
export const defaultScreenOptions = {
  headerLargeTitle: false,
  headerTransparent: false,
  headerLargeTitleShadowVisible: false,
  headerStyle: {
    backgroundColor: 'white',
  },
  headerTitleStyle: {
    fontSize: 18,
  },
  // Set numeric values for all iOS-specific properties to avoid type conversion issues
  ...Platform.select({
    ios: {
      headerBackTitleVisible: false,
      headerTitleAlign: 'center' as const,
    },
    default: {}
  })
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const AppNavigator = () => {
  const theme = useTheme();
  
  // Create a navigation theme based on our app theme
  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.onSurface,
      border: theme.colors.outline,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Dogs') {
              iconName = focused ? 'paw' : 'paw-outline';
            } else if (route.name === 'Exercises') {
              iconName = focused ? 'list' : 'list-outline';
            } else if (route.name === 'Training') {
              iconName = focused ? 'fitness' : 'fitness-outline';
            } else if (route.name === 'Analytics') {
              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
            } else {
              iconName = 'help-circle-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen name="Analytics" component={AnalyticsStackNavigator} />
        <Tab.Screen name="Training" component={TrainingStackNavigator} />
        <Tab.Screen name="Exercises" component={ExercisesStackNavigator} />
        <Tab.Screen name="Dogs" component={DogsStackNavigator} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 
