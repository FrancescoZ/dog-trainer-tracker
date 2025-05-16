import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { Text, Card, Button, IconButton, useTheme, Portal, Dialog } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DogsStackParamList } from '../../navigation/DogsStackNavigator';
import { useDogStore } from '../../store/dogStore';
import { useTrainingStore } from '../../store/trainingStore';
import { formatDate, calculateSuccessRate } from '../../utils/helpers';
import { Dog, TrainingSession } from '../../types';

type DogDetailScreenRouteProp = RouteProp<DogsStackParamList, 'DogDetail'>;
type DogDetailScreenNavigationProp = NativeStackNavigationProp<DogsStackParamList>;

const DogDetailScreen = () => {
  // Use useRef to prevent updates from causing infinite loops
  const isFirstRender = useRef(true);
  const route = useRoute<DogDetailScreenRouteProp>();
  const navigation = useNavigation<DogDetailScreenNavigationProp>();
  const theme = useTheme();
  const dogId = route.params?.dogId;

  // Local component state
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [dogData, setDogData] = useState<Dog | null>(null);
  const [sessionData, setSessionData] = useState<TrainingSession[]>([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    lastTrainingDate: null as number | null,
    successRate: 0
  });

  // Load data only once on initial render
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      
      // Fetch dog data
      const dog = useDogStore.getState().dogs.find(d => d.id === dogId);
      setDogData(dog || null);
      
      // Fetch session data
      const sessions = useTrainingStore.getState().sessions.filter(s => s.dogId === dogId);
      setSessionData(sessions);
      
      // Calculate stats
      const totalSessions = sessions.length;
      const lastTrainingDate = sessions.length > 0
        ? Math.max(...sessions.map(s => s.startTime))
        : null;
        
      let totalSuccessful = 0;
      let totalRepetitions = 0;
      sessions.forEach(session => {
        session.exercises.forEach(exercise => {
          totalSuccessful += exercise.successfulCompletions;
          totalRepetitions += exercise.repetitions;
        });
      });
      
      setStats({
        totalSessions,
        lastTrainingDate,
        successRate: calculateSuccessRate(totalSuccessful, totalRepetitions)
      });
    }
  }, [dogId]);

  // Memoize button handlers to prevent recreating functions on re-render
  const navigateToTraining = useCallback(() => {
    try {
      // Use CommonActions to reset the state and avoid loops
      const parent = navigation.getParent();
      if (parent) {
        parent.dispatch(
          CommonActions.navigate({
            name: 'Training'
          })
        );
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }, [navigation]);

  const handleDeleteDog = useCallback(() => {
    try {
      useDogStore.getState().deleteDog(dogId);
      navigation.goBack();
    } catch (error) {
      console.error('Error deleting dog:', error);
    }
  }, [dogId, navigation]);

  const navigateToEditDog = useCallback(() => {
    navigation.navigate('EditDog', { dogId });
  }, [dogId, navigation]);

  // Set header options
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <IconButton icon="pencil" onPress={navigateToEditDog} />
          <IconButton icon="delete" onPress={() => setDeleteDialogVisible(true)} />
        </View>
      ),
    });
  }, [navigation, navigateToEditDog]);

  // Handle case where dog is not found
  if (!dogData) {
    return (
      <View style={styles.container}>
        <Text>Dog not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileSection}>
        {dogData.photo ? (
          <Image source={{ uri: dogData.photo }} style={styles.dogImage} />
        ) : (
          <View style={[styles.dogImagePlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text style={{ fontSize: 36 }}>🐕</Text>
          </View>
        )}
        <Text variant="headlineMedium" style={styles.dogName}>
          {dogData.name}
        </Text>
        <Text variant="bodyLarge" style={styles.dogBreed}>
          {dogData.breed}, {dogData.age} years old
        </Text>
      </View>

      <Card style={styles.statsCard}>
        <Card.Title title="Training Statistics" />
        <Card.Content>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text variant="headlineSmall">{stats.totalSessions}</Text>
              <Text variant="bodyMedium">Sessions</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineSmall">{stats.successRate.toFixed(0)}%</Text>
              <Text variant="bodyMedium">Success Rate</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineSmall">
                {stats.lastTrainingDate ? formatDate(stats.lastTrainingDate) : '-'}
              </Text>
              <Text variant="bodyMedium">Last Training</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button 
          mode="contained" 
          onPress={navigateToTraining}
          icon="play"
        >
          Start Training Session
        </Button>
      </View>

      {/* Delete confirmation dialog */}
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Delete Dog</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to delete {dogData.name}? This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleDeleteDog}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
  },
  dogImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 16,
  },
  dogImagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  dogName: {
    marginBottom: 4,
  },
  dogBreed: {
    opacity: 0.7,
  },
  statsCard: {
    margin: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  buttonContainer: {
    padding: 16,
  },
});

export default DogDetailScreen; 
