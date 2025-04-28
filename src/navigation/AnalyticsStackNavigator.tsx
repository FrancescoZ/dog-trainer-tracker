import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { defaultScreenOptions } from './index';

// Import screens
import AnalyticsDashboardScreen from '../screens/analytics/AnalyticsDashboardScreen';
import ExerciseProgressScreen from '../screens/analytics/ExerciseProgressScreen';
import SuccessRateScreen from '../screens/analytics/SuccessRateScreen';
import TrainingFrequencyScreen from '../screens/analytics/TrainingFrequencyScreen';

// Define our navigation types
export type AnalyticsStackParamList = {
  AnalyticsDashboard: undefined;
  ExerciseProgress: { exerciseId: string };
  SuccessRate: undefined;
  TrainingFrequency: undefined;
};

const Stack = createNativeStackNavigator<AnalyticsStackParamList>();

const AnalyticsStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={defaultScreenOptions}
    >
      <Stack.Screen 
        name="AnalyticsDashboard" 
        component={AnalyticsDashboardScreen} 
        options={{ title: 'Analytics' }} 
      />
      <Stack.Screen 
        name="ExerciseProgress" 
        component={ExerciseProgressScreen} 
        options={{ title: 'Exercise Progress' }} 
      />
      <Stack.Screen 
        name="SuccessRate" 
        component={SuccessRateScreen} 
        options={{ title: 'Success Rate' }} 
      />
      <Stack.Screen 
        name="TrainingFrequency" 
        component={TrainingFrequencyScreen} 
        options={{ title: 'Training Frequency' }} 
      />
    </Stack.Navigator>
  );
};

export default AnalyticsStackNavigator; 
