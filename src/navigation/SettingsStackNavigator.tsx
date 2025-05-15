import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { defaultScreenOptions } from './index';

// Import screens
import DataManagementScreen from '../screens/DataManagementScreen';

// Define our navigation types
export type SettingsStackParamList = {
  DataManagement: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

const SettingsStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={defaultScreenOptions}
    >
      <Stack.Screen 
        name="DataManagement" 
        component={DataManagementScreen} 
        options={{ title: 'Data Management' }} 
      />
    </Stack.Navigator>
  );
};

export default SettingsStackNavigator; 
