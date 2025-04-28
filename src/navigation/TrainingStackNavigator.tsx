import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { defaultScreenOptions } from './index';

// Import screens
import TrainingHistoryScreen from '../screens/training/TrainingHistoryScreen';
import TrainingSessionScreen from '../screens/training/TrainingSessionScreen';
import TrainingDetailScreen from '../screens/training/TrainingDetailScreen';
import AddExerciseToSessionScreen from '../screens/training/AddExerciseToSessionScreen';
import PastTrainingSessionScreen from '../screens/training/PastTrainingSessionScreen';
import { SessionExercise } from '../types';

// Define our navigation types
export type TrainingStackParamList = {
  Training: undefined;
  TrainingSession: { sessionId?: string };
  TrainingDetail: { sessionId: string };
  AddExerciseToSession: { 
    sessionId?: string;
    isPastSession?: boolean;
  };
  PastTrainingSession: { 
    dogId?: string | null;
    addedExercise?: SessionExercise;
  };
};

const Stack = createNativeStackNavigator<TrainingStackParamList>();

const TrainingStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={defaultScreenOptions}
    >
      <Stack.Screen 
        name="Training" 
        component={TrainingHistoryScreen} 
        options={{ title: 'Training Sessions' }} 
      />
      <Stack.Screen 
        name="TrainingSession" 
        component={TrainingSessionScreen} 
        options={{ title: 'Training Session' }} 
      />
      <Stack.Screen 
        name="TrainingDetail" 
        component={TrainingDetailScreen} 
        options={{ title: 'Session Details' }} 
      />
      <Stack.Screen 
        name="AddExerciseToSession" 
        component={AddExerciseToSessionScreen} 
        options={{ title: 'Add Exercise' }} 
      />
      <Stack.Screen 
        name="PastTrainingSession" 
        component={PastTrainingSessionScreen} 
        options={{ title: 'Add Past Session' }} 
      />
    </Stack.Navigator>
  );
};

export default TrainingStackNavigator; 
