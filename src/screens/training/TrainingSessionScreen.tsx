import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, Chip, RadioButton, TextInput, SegmentedButtons, List, IconButton, useTheme, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TrainingStackParamList } from '../../navigation/TrainingStackNavigator';
import { useDogStore } from '../../store/dogStore';
import { useExerciseStore } from '../../store/exerciseStore';
import { useTrainingStore } from '../../store/trainingStore';
import { LocationType, ExerciseRecord } from '../../types';
import { formatTime, formatDuration } from '../../utils/helpers';
import EmptyState from '../../components/EmptyState';

type TrainingSessionScreenNavigationProp = NativeStackNavigationProp<TrainingStackParamList, 'TrainingSession'>;

const LOCATION_OPTIONS = [
  { value: 'home', label: 'Home' },
  { value: 'park', label: 'Park' },
  { value: 'indoor', label: 'Indoor' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'other', label: 'Other' },
];

const WEATHER_OPTIONS = [
  'Sunny', 'Cloudy', 'Rainy', 'Windy', 'Snowy'
];

const TrainingSessionScreen = () => {
  const navigation = useNavigation<TrainingSessionScreenNavigationProp>();
  const theme = useTheme();
  
  const { dogs } = useDogStore();
  const { exercises } = useExerciseStore();
  const { currentSession, startSession, endSession, updateSessionDetails, sessions } = useTrainingStore();
  
  // Get the first dog's ID if available
  const firstDogId = dogs.length > 0 ? dogs[0].id : null;
  
  // Session setup state
  const [selectedLocation, setSelectedLocation] = useState<LocationType>('home');
  const [selectedDogId, setSelectedDogId] = useState<string | null>(firstDogId);
  const [weather, setWeather] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  // Timer state for tracking session duration
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Update selectedDogId when the available dogs change (e.g., if first dog is deleted)
  useEffect(() => {
    if (dogs.length > 0) {
      if (!selectedDogId || !dogs.some(dog => dog.id === selectedDogId)) {
        // If current selection is invalid or not set, select the first dog
        console.log('Setting default dog to first in list:', dogs[0].id);
        setSelectedDogId(dogs[0].id);
      }
    } else {
      // No dogs available
      setSelectedDogId(null);
    }
  }, [dogs, selectedDogId]);
  
  // Log current state for debugging
  useEffect(() => {
    console.log('Current session state:', currentSession ? 'Session active' : 'No active session');
    console.log('Selected dog ID:', selectedDogId);
    if (currentSession) {
      console.log('Current weather:', currentSession.weather);
    }
  }, [currentSession, selectedDogId]);
  
  // Check if we already have an active session
  useEffect(() => {
    if (currentSession) {
      console.log('Active session detected, setting up timer and form values');
      
      // Session is already in progress, start the timer from the current duration
      const currentDuration = Date.now() - currentSession.startTime;
      setElapsedTime(currentDuration);
      
      // Start the timer
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - currentSession.startTime);
      }, 1000);
      
      setTimerInterval(interval);
      
      // Initialize form values from current session
      setSelectedDogId(currentSession.dogId);
      setSelectedLocation(currentSession.location);
      setWeather(currentSession.weather || '');
      setNotes(currentSession.notes || '');
    } else {
      console.log('No active session, resetting timer');
      // Reset timer if no active session
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      setElapsedTime(0);
    }
    
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [currentSession]);
  
  // Create a memoized start session handler to prevent issues
  const handleStartSession = useCallback(() => {
    if (!selectedDogId) {
      Alert.alert('Error', 'Please select a dog for this training session');
      return;
    }
    
    console.log('Starting new session with dog:', selectedDogId, 'location:', selectedLocation);
    
    // Start a new training session with explicit dog ID and location
    startSession(selectedDogId, selectedLocation);
    
    // We'll let the useEffect handle the timer setup when currentSession changes
    console.log('Session start function called, waiting for currentSession update');
  }, [selectedDogId, selectedLocation, startSession]);

  // Handler for navigating to past session creation
  const handleAddPastSession = useCallback(() => {
    // Navigate to a screen for adding a past session
    navigation.navigate('PastTrainingSession', { dogId: selectedDogId });
  }, [navigation, selectedDogId]);
  
  const handleEndSession = () => {
    // Confirm before ending session
    Alert.alert(
      'End Session',
      'Are you sure you want to end this training session?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'End Session',
          onPress: () => {
            console.log('Ending current session');
            
            // Stop the timer
            if (timerInterval) {
              clearInterval(timerInterval);
              setTimerInterval(null);
            }
            
            // Update session details before ending
            updateSessionDetails({
              weather,
              notes,
            });
            
            // End the session and get the session ID
            const sessionId = endSession();
            console.log('Session ended with ID:', sessionId);
            
            // Navigate to the training detail screen to show the results
            if (sessionId) {
              navigation.replace('TrainingDetail', { sessionId });
            } else {
              // If no sessionId was returned, just go back to the Training list
              navigation.navigate('Training');
            }
          },
        },
      ],
    );
  };
  
  const handleUpdateSessionDetails = () => {
    if (!currentSession) {
      console.log('No active session to update');
      return;
    }
    
    console.log('Updating session details - Location:', selectedLocation, 'Weather:', weather);
    updateSessionDetails({
      location: selectedLocation,
      weather,
      notes,
    });
  };
  
  // Handle weather selection with a more direct update approach
  const handleWeatherSelect = (option: string) => {
    console.log('Setting weather to:', option);
    setWeather(option);
    
    // Update session immediately after state change
    setTimeout(() => {
      if (currentSession) {
        updateSessionDetails({
          weather: option,
        });
        console.log('Weather updated to:', option);
      }
    }, 0);
  };
  
  const handleAddExercise = () => {
    if (!currentSession) {
      Alert.alert('Error', 'No active training session.');
      return;
    }
    
    console.log('Navigating to add exercise to session:', currentSession.id);
    navigation.navigate('AddExerciseToSession', { sessionId: currentSession.id });
  };
  
  const renderExerciseList = () => {
    if (!currentSession || currentSession.exercises.length === 0) {
      return (
        <EmptyState
          title="No Exercises Added"
          message="Add exercises to this training session"
          icon="barbell-outline"
          buttonText="Add Exercise"
          onButtonPress={handleAddExercise}
        />
      );
    }
    
    return (
      <List.Section>
        <List.Subheader>Exercises</List.Subheader>
        {currentSession.exercises.map((exerciseRecord, index) => {
          const exercise = exercises.find(e => e.id === exerciseRecord.exerciseId);
          if (!exercise) return null;
          
          return (
            <List.Item
              key={index}
              title={exercise.name}
              description={`${exerciseRecord.successfulCompletions}/${exerciseRecord.repetitions} successful`}
              left={props => <List.Icon {...props} icon="arm-flex" />}
              right={props => (
                <View style={styles.exerciseItemRight}>
                  <Chip>{exerciseRecord.distractionLevel}/5</Chip>
                </View>
              )}
            />
          );
        })}
        <Button
          mode="outlined"
          icon="plus"
          onPress={handleAddExercise}
          style={styles.addExerciseButton}
        >
          Add Exercise
        </Button>
      </List.Section>
    );
  };
  
  // For debugging purposes
  const dumpSessionData = () => {
    console.log('Current session data:', currentSession);
    console.log('Available dogs:', dogs);
    console.log('Selected dog ID:', selectedDogId);
    console.log('Current weather state:', weather);
  };
  
  // Render dog selector if no session is active, or session details if one is active
  const renderSessionSetup = () => {
    // For debugging
    dumpSessionData();
    
    if (currentSession) {
      console.log('Rendering active session interface');
      return (
        <View style={styles.sessionDetailsContainer}>
          <Card style={styles.timerCard}>
            <Card.Content style={styles.timerContent}>
              <Text variant="headlineLarge" style={styles.timerText}>{formatDuration(elapsedTime)}</Text>
              <Text variant="bodyMedium">Session Duration</Text>
            </Card.Content>
          </Card>
          
          <Card style={styles.sessionInfoCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>Session Details</Text>
              
              <Text variant="bodyMedium" style={styles.label}>Location</Text>
              <SegmentedButtons
                value={selectedLocation}
                onValueChange={(value) => {
                  setSelectedLocation(value as LocationType);
                  handleUpdateSessionDetails();
                }}
                buttons={LOCATION_OPTIONS}
                style={styles.segmentedButtons}
              />
              
              <Text variant="bodyMedium" style={styles.label}>Weather</Text>
              <ScrollView horizontal style={styles.weatherContainer}>
                {WEATHER_OPTIONS.map((option) => (
                  <Chip
                    key={option}
                    selected={weather === option}
                    onPress={() => handleWeatherSelect(option)}
                    style={styles.weatherChip}
                    mode={weather === option ? 'flat' : 'outlined'}
                  >
                    {option}
                  </Chip>
                ))}
              </ScrollView>
              
              <Text variant="bodyMedium" style={styles.label}>Notes</Text>
              <TextInput
                mode="outlined"
                value={notes}
                onChangeText={setNotes}
                onBlur={handleUpdateSessionDetails}
                multiline
                numberOfLines={3}
                style={styles.notesInput}
              />
            </Card.Content>
          </Card>
          
          {renderExerciseList()}
          
          <Button
            mode="contained"
            icon="stop"
            onPress={handleEndSession}
            style={[styles.endButton, { backgroundColor: theme.colors.error }]}
          >
            End Session
          </Button>
        </View>
      );
    } else {
      console.log('Rendering session setup interface');
      // No active session, show setup screen
      return (
        <View style={styles.setupContainer}>
          <Card style={styles.setupCard}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.cardTitle}>New Training Session</Text>
              
              <Text variant="bodyMedium" style={styles.label}>Select Dog</Text>
              <RadioButton.Group
                value={selectedDogId || ''}
                onValueChange={(value) => setSelectedDogId(value)}
              >
                {dogs.map((dog) => (
                  <RadioButton.Item
                    key={dog.id}
                    label={dog.name}
                    value={dog.id}
                    status={selectedDogId === dog.id ? 'checked' : 'unchecked'}
                  />
                ))}
              </RadioButton.Group>
              
              <Text variant="bodyMedium" style={styles.label}>Location</Text>
              <SegmentedButtons
                value={selectedLocation}
                onValueChange={(value) => setSelectedLocation(value as LocationType)}
                buttons={LOCATION_OPTIONS}
                style={styles.segmentedButtons}
              />
              
              <Button
                mode="contained"
                icon="play"
                onPress={handleStartSession}
                style={styles.startButton}
                disabled={!selectedDogId}
              >
                Start Session
              </Button>
              
              <Divider style={styles.divider} />
              
              <Button
                mode="outlined"
                icon="calendar-plus"
                onPress={handleAddPastSession}
                style={styles.pastSessionButton}
                disabled={!selectedDogId}
              >
                Add Past Session
              </Button>
            </Card.Content>
          </Card>
        </View>
      );
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      {renderSessionSetup()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  setupContainer: {
    padding: 16,
  },
  setupCard: {
    marginBottom: 16,
  },
  cardTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  sessionDetailsContainer: {
    padding: 16,
  },
  timerCard: {
    marginBottom: 16,
  },
  timerContent: {
    alignItems: 'center',
    padding: 16,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  sessionInfoCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  label: {
    marginTop: 12,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  weatherContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weatherChip: {
    marginRight: 8,
    marginVertical: 4,
  },
  notesInput: {
    marginBottom: 8,
  },
  exerciseList: {
    marginBottom: 16,
  },
  exerciseItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addExerciseButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  startButton: {
    marginTop: 24,
  },
  endButton: {
    marginTop: 16,
    marginBottom: 24,
  },
  divider: {
    marginVertical: 24,
  },
  pastSessionButton: {
    marginBottom: 8,
  },
});

export default TrainingSessionScreen;
