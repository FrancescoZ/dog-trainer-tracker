import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { defaultScreenOptions } from './index';

// Import screens
import ExerciseListScreen from '../screens/exercises/ExerciseListScreen';
import ExerciseDetailScreen from '../screens/exercises/ExerciseDetailScreen';
import AddExerciseScreen from '../screens/exercises/AddExerciseScreen';
import EditExerciseScreen from '../screens/exercises/EditExerciseScreen';

// Define our navigation types
export type ExercisesStackParamList = {
  ExerciseList: undefined;
  ExerciseDetail: { exerciseId: string };
  AddExercise: undefined;
  EditExercise: { exerciseId: string };
};

const Stack = createNativeStackNavigator<ExercisesStackParamList>();

const ExercisesStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={defaultScreenOptions}
    >
      <Stack.Screen 
        name="ExerciseList" 
        component={ExerciseListScreen} 
        options={{ title: 'Exercises' }} 
      />
      <Stack.Screen 
        name="ExerciseDetail" 
        component={ExerciseDetailScreen} 
        options={{ title: 'Exercise Details' }} 
      />
      <Stack.Screen 
        name="AddExercise" 
        component={AddExerciseScreen} 
        options={{ title: 'Add New Exercise' }} 
      />
      <Stack.Screen 
        name="EditExercise" 
        component={EditExerciseScreen} 
        options={{ title: 'Edit Exercise' }} 
      />
    </Stack.Navigator>
  );
};

export default ExercisesStackNavigator; 
