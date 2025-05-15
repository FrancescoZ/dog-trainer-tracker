import { Platform, Share, Alert, Clipboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDogStore } from '../store/dogStore';
import { useExerciseStore } from '../store/exerciseStore';
import { useTrainingStore } from '../store/trainingStore';

// Type for the complete app data
export interface AppData {
  dogs: any[];
  exercises: any[];
  trainingSessions: any[];
  version: string;
  exportDate: number;
}

/**
 * Export all app data to JSON
 */
export const exportData = async (): Promise<boolean> => {
  try {
    // Get all data from stores
    const dogs = useDogStore.getState().dogs;
    const exercises = useExerciseStore.getState().exercises;
    const trainingSessions = useTrainingStore.getState().sessions;

    // Create data object with metadata
    const appData: AppData = {
      dogs,
      exercises,
      trainingSessions,
      version: '1.0', // Version of the export format
      exportDate: Date.now(),
    };

    // Convert to JSON
    const jsonData = JSON.stringify(appData, null, 2);

    if (Platform.OS === 'web') {
      // For web platform, create a downloadable blob
      const blob = new Blob([jsonData], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = `dog_training_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    } else {
      // For mobile platforms, use Share API
      try {
        // Try to copy to clipboard first (as backup)
        await Clipboard.setString(jsonData);
        
        // Then try to share
        await Share.share({
          title: 'Dog Training Data Export',
          message: Platform.OS === 'ios' ? 'Dog Training Data Export' : jsonData,
          url: Platform.OS === 'ios' ? jsonData : undefined,
        });
        
        return true;
      } catch (error) {
        // If sharing fails, at least we copied to clipboard
        Alert.alert(
          'Export Data',
          'The data has been copied to clipboard. Please paste it into a text editor and save it as a JSON file.',
          [{ text: 'OK' }]
        );
        return true;
      }
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    return false;
  }
};

/**
 * Import data from JSON string
 */
export const importData = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Show an alert with a message about pasting the JSON data
    Alert.alert(
      'Import Data',
      'Please paste the previously exported JSON data below:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => Promise.resolve({ success: false, message: 'Import canceled' }),
        },
        {
          text: 'Import',
          onPress: async () => {
            try {
              // Get the clipboard content
              const clipboardContent = await Clipboard.getString();
              
              if (!clipboardContent) {
                return { 
                  success: false, 
                  message: 'No data found in clipboard. Please copy the JSON data first.' 
                };
              }
              
              // Parse the data
              const appData: AppData = JSON.parse(clipboardContent);
              
              // Validate the imported data structure
              if (!appData.dogs || !appData.exercises || !appData.trainingSessions) {
                return { 
                  success: false, 
                  message: 'Invalid data format. The clipboard content does not contain valid export data.' 
                };
              }
              
              // Clear existing data and import new data
              await AsyncStorage.multiSet([
                ['dog-storage', JSON.stringify({ state: { dogs: appData.dogs } })],
                ['exercise-storage', JSON.stringify({ state: { exercises: appData.exercises } })],
                ['training-storage', JSON.stringify({ state: { sessions: appData.trainingSessions, currentSession: null } })],
              ]);
              
              // Reload the stores
              useDogStore.getState();
              useExerciseStore.getState();
              useTrainingStore.getState();
              
              return { 
                success: true, 
                message: 'Data imported successfully. Please restart the app to see all changes.' 
              };
            } catch (error) {
              return { 
                success: false, 
                message: `Error importing data: ${error instanceof Error ? error.message : String(error)}` 
              };
            }
          },
        },
      ]
    );
    
    // This is a placeholder return as the actual result will be returned in the alert callbacks
    return { success: false, message: 'Processing import...' };
  } catch (error) {
    console.error('Error in import process:', error);
    return { 
      success: false, 
      message: `Error in import process: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}; 
