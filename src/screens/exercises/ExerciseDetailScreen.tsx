import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, IconButton, Chip, Portal, Dialog, useTheme } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ExercisesStackParamList } from '../../navigation/ExercisesStackNavigator';
import { useExerciseStore } from '../../store/exerciseStore';
import { useTrainingStore } from '../../store/trainingStore';
import ComplexityRating from '../../components/ComplexityRating';
import { calculateSuccessRate } from '../../utils/helpers';

type ExerciseDetailScreenRouteProp = RouteProp<ExercisesStackParamList, 'ExerciseDetail'>;
type ExerciseDetailScreenNavigationProp = NativeStackNavigationProp<ExercisesStackParamList>;

const ExerciseDetailScreen = () => {
  const route = useRoute<ExerciseDetailScreenRouteProp>();
  const navigation = useNavigation<ExerciseDetailScreenNavigationProp>();
  const theme = useTheme();
  const { exerciseId } = route.params;

  // State
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  
  // Get exercise details
  const { exercises, deleteExercise } = useExerciseStore();
  const exercise = exercises.find((e) => e.id === exerciseId);
  
  // Get training sessions with this exercise
  const sessions = useTrainingStore((state) => state.sessions);
  
  // Calculate statistics for this exercise
  const exerciseRecords = sessions.flatMap(session => 
    session.exercises.filter(ex => ex.exerciseId === exerciseId)
  );
  
  const totalSessions = exerciseRecords.length;
  
  // Calculate success rates
  let totalSuccessful = 0;
  let totalRepetitions = 0;
  exerciseRecords.forEach(record => {
    totalSuccessful += record.successfulCompletions;
    totalRepetitions += record.repetitions;
  });
  const overallSuccessRate = calculateSuccessRate(totalSuccessful, totalRepetitions);

  useEffect(() => {
    // Set header right button for editing
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <IconButton
            icon="pencil"
            onPress={() => navigation.navigate('EditExercise', { exerciseId })}
          />
          <IconButton
            icon="delete"
            onPress={() => setDeleteDialogVisible(true)}
          />
        </View>
      ),
    });
  }, [navigation, exerciseId]);

  const handleDeleteExercise = () => {
    deleteExercise(exerciseId);
    navigation.goBack();
  };

  // Handle case where exercise is not found
  if (!exercise) {
    return (
      <View style={styles.container}>
        <Text>Exercise not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          {exercise.name}
        </Text>
        <ComplexityRating level={exercise.complexity} size={24} />
      </View>

      <Card style={styles.descriptionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Description</Text>
          <Text variant="bodyMedium">{exercise.description}</Text>
        </Card.Content>
      </Card>

      {exercise.categories && exercise.categories.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Categories</Text>
            <View style={styles.categoriesContainer}>
              {exercise.categories.map((category, index) => (
                <Chip key={index} style={styles.categoryChip}>
                  {category}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Training Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text variant="headlineSmall">{totalSessions}</Text>
              <Text variant="bodyMedium">Sessions</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineSmall">{totalRepetitions}</Text>
              <Text variant="bodyMedium">Repetitions</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineSmall">{overallSuccessRate.toFixed(0)}%</Text>
              <Text variant="bodyMedium">Success Rate</Text>
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
          Practice This Exercise
        </Button>
      </View>

      {/* Delete confirmation dialog */}
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Delete Exercise</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to delete "{exercise.name}"? This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleDeleteExercise}>Delete</Button>
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
  header: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  descriptionCard: {
    margin: 16,
    marginTop: 0,
  },
  card: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryChip: {
    margin: 4,
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
    paddingTop: 8,
  },
});

export default ExerciseDetailScreen; 
