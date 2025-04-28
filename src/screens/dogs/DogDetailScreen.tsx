import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { Text, Card, Button, IconButton, useTheme, Portal, Dialog } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DogsStackParamList } from '../../navigation/DogsStackNavigator';
import { useDogStore } from '../../store/dogStore';
import { useTrainingStore } from '../../store/trainingStore';
import { formatDate, calculateSuccessRate } from '../../utils/helpers';

type DogDetailScreenRouteProp = RouteProp<DogsStackParamList, 'DogDetail'>;
type DogDetailScreenNavigationProp = NativeStackNavigationProp<DogsStackParamList>;

const DogDetailScreen = () => {
  const route = useRoute<DogDetailScreenRouteProp>();
  const navigation = useNavigation<DogDetailScreenNavigationProp>();
  const theme = useTheme();
  const { dogId } = route.params;

  // State
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  
  // Get dog details
  const { dogs, deleteDog } = useDogStore();
  const dog = dogs.find((d) => d.id === dogId);
  
  // Get training sessions for this dog
  const sessions = useTrainingStore((state) => 
    state.sessions.filter((session) => session.dogId === dogId)
  );

  // Calculate statistics
  const totalSessions = sessions.length;
  const lastTrainingDate = sessions.length > 0
    ? Math.max(...sessions.map(s => s.startTime))
    : null;

  // Calculate overall success rate
  let totalSuccessful = 0;
  let totalRepetitions = 0;
  sessions.forEach(session => {
    session.exercises.forEach(exercise => {
      totalSuccessful += exercise.successfulCompletions;
      totalRepetitions += exercise.repetitions;
    });
  });
  const overallSuccessRate = calculateSuccessRate(totalSuccessful, totalRepetitions);

  useEffect(() => {
    // Set header right button for editing
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <IconButton
            icon="pencil"
            onPress={() => navigation.navigate('EditDog', { dogId })}
          />
          <IconButton
            icon="delete"
            onPress={() => setDeleteDialogVisible(true)}
          />
        </View>
      ),
    });
  }, [navigation, dogId]);

  const handleDeleteDog = () => {
    deleteDog(dogId);
    navigation.goBack();
  };

  // Handle case where dog is not found
  if (!dog) {
    return (
      <View style={styles.container}>
        <Text>Dog not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileSection}>
        {dog.photo ? (
          <Image source={{ uri: dog.photo }} style={styles.dogImage} />
        ) : (
          <View style={[styles.dogImagePlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text style={{ fontSize: 36 }}>🐕</Text>
          </View>
        )}
        <Text variant="headlineMedium" style={styles.dogName}>
          {dog.name}
        </Text>
        <Text variant="bodyLarge" style={styles.dogBreed}>
          {dog.breed}, {dog.age} years old
        </Text>
      </View>

      <Card style={styles.statsCard}>
        <Card.Title title="Training Statistics" />
        <Card.Content>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text variant="headlineSmall">{totalSessions}</Text>
              <Text variant="bodyMedium">Sessions</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineSmall">{overallSuccessRate.toFixed(0)}%</Text>
              <Text variant="bodyMedium">Success Rate</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineSmall">{lastTrainingDate ? formatDate(lastTrainingDate) : '-'}</Text>
              <Text variant="bodyMedium">Last Training</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button 
          mode="contained" 
          onPress={() => navigation.navigate('Training')}
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
              Are you sure you want to delete {dog.name}? This action cannot be undone.
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
