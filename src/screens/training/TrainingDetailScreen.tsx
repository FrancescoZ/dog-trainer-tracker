import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, List, Chip, Divider, useTheme, Portal, Dialog } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TrainingStackParamList } from '../../navigation/TrainingStackNavigator';
import { useDogStore } from '../../store/dogStore';
import { useExerciseStore } from '../../store/exerciseStore';
import { useTrainingStore } from '../../store/trainingStore';
import { formatDate, formatTime, formatDuration, calculateSuccessRate } from '../../utils/helpers';
import ComplexityRating from '../../components/ComplexityRating';
import AnalyticsPrompt from '../../components/AnalyticsPrompt';

type TrainingDetailScreenRouteProp = RouteProp<TrainingStackParamList, 'TrainingDetail'>;
type TrainingDetailScreenNavigationProp = NativeStackNavigationProp<TrainingStackParamList>;

const TrainingDetailScreen = () => {
  const route = useRoute<TrainingDetailScreenRouteProp>();
  const navigation = useNavigation<TrainingDetailScreenNavigationProp>();
  const theme = useTheme();
  const { sessionId } = route.params;
  
  // State
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  
  // Get session details
  const { sessions, deleteSession } = useTrainingStore();
  const session = sessions.find(s => s.id === sessionId);
  
  // Get dog details
  const { dogs } = useDogStore();
  const dog = session ? dogs.find(d => d.id === session.dogId) : null;
  
  // Get exercises
  const { exercises } = useExerciseStore();
  
  // Set up navigation options
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button
          icon="delete"
          onPress={() => setDeleteDialogVisible(true)}
          color={theme.colors.error}
        >
          Delete
        </Button>
      ),
    });
  }, [navigation]);
  
  const handleDeleteSession = () => {
    deleteSession(sessionId);
    navigation.goBack();
  };
  
  // Handle case where session is not found
  if (!session || !dog) {
    return (
      <View style={styles.container}>
        <Text>Session not found</Text>
      </View>
    );
  }
  
  // Calculate session statistics
  const duration = session.endTime - session.startTime;
  const sessionDate = formatDate(session.startTime);
  const startTime = formatTime(session.startTime);
  const endTime = formatTime(session.endTime);
  
  // Calculate overall success rate
  let totalRepetitions = 0;
  let totalSuccessful = 0;
  session.exercises.forEach(exercise => {
    totalRepetitions += exercise.repetitions;
    totalSuccessful += exercise.successfulCompletions;
  });
  const overallSuccessRate = calculateSuccessRate(totalSuccessful, totalRepetitions);
  
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="headlineMedium" style={styles.sessionDate}>{sessionDate}</Text>
          <Text variant="titleMedium" style={styles.dogName}>{dog.name}</Text>
          
          <View style={styles.timeRow}>
            <View style={styles.timeItem}>
              <Text variant="bodyMedium" style={styles.timeLabel}>Start</Text>
              <Text variant="bodyLarge">{startTime}</Text>
            </View>
            <View style={styles.timeItem}>
              <Text variant="bodyMedium" style={styles.timeLabel}>End</Text>
              <Text variant="bodyLarge">{endTime}</Text>
            </View>
            <View style={styles.timeItem}>
              <Text variant="bodyMedium" style={styles.timeLabel}>Duration</Text>
              <Text variant="bodyLarge">{formatDuration(duration)}</Text>
            </View>
          </View>
          
          <View style={styles.locationContainer}>
            <Chip icon="map-marker" style={styles.locationChip}>
              {session.location.charAt(0).toUpperCase() + session.location.slice(1)}
            </Chip>
            {session.weather && (
              <Chip icon="weather-partly-cloudy" style={styles.weatherChip}>
                {session.weather}
              </Chip>
            )}
            {session.timeOfDay && (
              <Chip icon="clock-outline" style={styles.timeChip}>
                {session.timeOfDay}
              </Chip>
            )}
          </View>
        </Card.Content>
      </Card>
      
      <Card style={styles.statsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Session Statistics</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text variant="headlineSmall">{session.exercises.length}</Text>
              <Text variant="bodyMedium">Exercises</Text>
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
      
      <AnalyticsPrompt 
        sessionId={sessionId}
        message="See how this session contributes to your training progress"
      />
      
      <Card style={styles.exercisesCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Exercises</Text>
          
          {session.exercises.map((exerciseRecord, index) => {
            const exercise = exercises.find(e => e.id === exerciseRecord.exerciseId);
            if (!exercise) return null;
            
            const successRate = calculateSuccessRate(
              exerciseRecord.successfulCompletions,
              exerciseRecord.repetitions
            );
            
            return (
              <View key={index} style={styles.exerciseItem}>
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseNameContainer}>
                    <Text variant="titleMedium">{exercise.name}</Text>
                    <ComplexityRating level={exercise.complexity} size={14} />
                  </View>
                  <Chip mode="outlined">
                    {successRate.toFixed(0)}% success
                  </Chip>
                </View>
                
                <View style={styles.exerciseDetails}>
                  <View style={styles.exerciseDetailItem}>
                    <Text variant="bodySmall">Repetitions:</Text>
                    <Text variant="bodyMedium">{exerciseRecord.repetitions}</Text>
                  </View>
                  <View style={styles.exerciseDetailItem}>
                    <Text variant="bodySmall">Successful:</Text>
                    <Text variant="bodyMedium">{exerciseRecord.successfulCompletions}</Text>
                  </View>
                  <View style={styles.exerciseDetailItem}>
                    <Text variant="bodySmall">Distraction Level:</Text>
                    <Text variant="bodyMedium">{exerciseRecord.distractionLevel}/5</Text>
                  </View>
                  <View style={styles.exerciseDetailItem}>
                    <Text variant="bodySmall">Distance:</Text>
                    <Text variant="bodyMedium">{exerciseRecord.distance}m</Text>
                  </View>
                </View>
                
                <View style={styles.methodsContainer}>
                  <Text variant="bodySmall">Methods:</Text>
                  <View style={styles.methodChips}>
                    {exerciseRecord.teachingMethods.map((method, methodIndex) => (
                      <Chip 
                        key={methodIndex} 
                        style={styles.methodChip}
                        textStyle={{ fontSize: 10 }}
                      >
                        {method === 'positive-reinforcement' 
                          ? 'Positive Reinforcement' 
                          : method === 'negative-reinforcement'
                            ? 'Negative Reinforcement'
                            : method.charAt(0).toUpperCase() + method.slice(1)}
                      </Chip>
                    ))}
                  </View>
                </View>
                
                {index < session.exercises.length - 1 && (
                  <Divider style={styles.divider} />
                )}
              </View>
            );
          })}
        </Card.Content>
      </Card>
      
      {session.notes && (
        <Card style={styles.notesCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Notes</Text>
            <Text variant="bodyMedium">{session.notes}</Text>
          </Card.Content>
        </Card>
      )}
      
      {/* Delete confirmation dialog */}
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Delete Session</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to delete this training session? This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleDeleteSession} textColor={theme.colors.error}>Delete</Button>
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
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  sessionDate: {
    marginBottom: 4,
  },
  dogName: {
    marginBottom: 16,
    opacity: 0.7,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeItem: {
    alignItems: 'center',
  },
  timeLabel: {
    opacity: 0.7,
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  locationChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  weatherChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  timeChip: {
    marginBottom: 8,
  },
  statsCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  exercisesCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  exerciseItem: {
    marginBottom: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseNameContainer: {
    flexDirection: 'column',
  },
  exerciseDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  exerciseDetailItem: {
    marginRight: 16,
    marginBottom: 8,
  },
  methodsContainer: {
    marginTop: 4,
  },
  methodChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  methodChip: {
    marginRight: 4,
    marginBottom: 4,
  },
  divider: {
    marginTop: 16,
    marginBottom: 16,
  },
  notesCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 24,
  },
});

export default TrainingDetailScreen; 
