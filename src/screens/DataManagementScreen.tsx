import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import { Text, Button, Card, Portal, Dialog, Paragraph } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { exportData, importData } from '../utils/dataExport';
import { useDogStore } from '../store/dogStore';
import { useExerciseStore } from '../store/exerciseStore';
import { useTrainingStore } from '../store/trainingStore';

const DataManagementScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  
  // Get store stats
  const dogCount = useDogStore(state => state.dogs.length);
  const exerciseCount = useExerciseStore(state => state.exercises.length);
  const sessionCount = useTrainingStore(state => state.sessions.length);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const success = await exportData();
      if (success) {
        Alert.alert('Success', 'Data exported successfully. Check your clipboard and share options.');
      } else {
        Alert.alert('Error', 'Failed to export data');
      }
    } catch (error) {
      Alert.alert('Error', `An error occurred: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    setShowImportConfirm(false);
    setIsLoading(true);
    try {
      const result = await importData();
      if (result.success) {
        Alert.alert('Success', result.message);
      } else if (result.message !== 'Processing import...') {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', `An error occurred: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Card style={styles.card}>
          <Card.Title title="Current Data Summary" />
          <Card.Content>
            <Text style={styles.statText}>Dogs: {dogCount}</Text>
            <Text style={styles.statText}>Exercises: {exerciseCount}</Text>
            <Text style={styles.statText}>Training Sessions: {sessionCount}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Export Data" />
          <Card.Content>
            <Paragraph>
              Export all your dogs, exercises, and training sessions data to share or save as backup.
              The data will be copied to your clipboard and you'll be able to share it.
            </Paragraph>
            <Button 
              mode="contained" 
              onPress={() => setShowExportConfirm(true)} 
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
            >
              Export Data
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Import Data" />
          <Card.Content>
            <Paragraph>
              Import previously exported data from your clipboard. 
              Copy the JSON data to your clipboard before importing.
              This will overwrite your current data.
            </Paragraph>
            <Button 
              mode="contained" 
              onPress={() => setShowImportConfirm(true)} 
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
              buttonColor="#FF9800"
            >
              Import Data
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            ⚠️ Note: Importing data will overwrite all existing data in the application. 
            Make sure to export your current data first if you want to keep it.
          </Text>
        </View>
      </ScrollView>

      {/* Export Confirmation Dialog */}
      <Portal>
        <Dialog visible={showExportConfirm} onDismiss={() => setShowExportConfirm(false)}>
          <Dialog.Title>Export Data</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              Are you sure you want to export your data? This will generate a JSON data with all your dogs, exercises, and training sessions and copy it to your clipboard.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowExportConfirm(false)}>Cancel</Button>
            <Button onPress={() => {
              setShowExportConfirm(false);
              handleExport();
            }}>Export</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Import Confirmation Dialog */}
      <Portal>
        <Dialog visible={showImportConfirm} onDismiss={() => setShowImportConfirm(false)}>
          <Dialog.Title>Import Data</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              ⚠️ WARNING: This will overwrite all your current data with the data from your clipboard. 
              This action cannot be undone.
            </Paragraph>
            <Paragraph style={{ marginTop: 8 }}>
              Make sure you have copied the complete JSON export data to your clipboard before proceeding.
            </Paragraph>
            <Paragraph style={{ marginTop: 8 }}>
              Are you sure you want to proceed?
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowImportConfirm(false)}>Cancel</Button>
            <Button onPress={handleImport} textColor="#FF5722">Import</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
  statText: {
    fontSize: 16,
    marginBottom: 8,
  },
  warningContainer: {
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    marginBottom: 32,
  },
  warningText: {
    color: '#E65100',
  },
  input: {
    marginTop: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    height: 120,
    textAlignVertical: 'top',
  },
});

export default DataManagementScreen; 
