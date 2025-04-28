import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { defaultScreenOptions } from './index';

// Import screens
import DogListScreen from '../screens/dogs/DogListScreen';
import DogDetailScreen from '../screens/dogs/DogDetailScreen';
import AddDogScreen from '../screens/dogs/AddDogScreen';
import EditDogScreen from '../screens/dogs/EditDogScreen';

// Define our navigation types
export type DogsStackParamList = {
  DogList: undefined;
  DogDetail: { dogId: string };
  AddDog: undefined;
  EditDog: { dogId: string };
};

const Stack = createNativeStackNavigator<DogsStackParamList>();

const DogsStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={defaultScreenOptions}
    >
      <Stack.Screen 
        name="DogList" 
        component={DogListScreen} 
        options={{ title: 'My Dogs' }} 
      />
      <Stack.Screen 
        name="DogDetail" 
        component={DogDetailScreen} 
        options={{ title: 'Dog Details' }} 
      />
      <Stack.Screen 
        name="AddDog" 
        component={AddDogScreen} 
        options={{ title: 'Add New Dog' }} 
      />
      <Stack.Screen 
        name="EditDog" 
        component={EditDogScreen} 
        options={{ title: 'Edit Dog' }} 
      />
    </Stack.Navigator>
  );
};

export default DogsStackNavigator; 
