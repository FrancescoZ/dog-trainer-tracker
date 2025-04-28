import React, { useLayoutEffect, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { Button, Text, RadioButton, TextInput, Card, Title, Chip, Divider, IconButton, Surface, HelperText, Portal } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TrainingStackParamList } from '../../navigation/TrainingStackNavigator';
import { useDogStore } from '../../store/dogStore';
import { useTrainingStore } from '../../store/trainingStore';
import { useExerciseStore } from '../../store/exerciseStore';
import { useTheme } from 'react-native-paper';
import { LocationType, TrainingSession, TeachingMethod, SessionExercise } from '../../types';
import { useCallback } from 'react';

// Define types based on the existing project structure
type Weather = 'Sunny' | 'Cloudy' | 'Rainy' | 'Windy' | 'Snowy' | 'Indoor';
type TimeOfDay = 'Morning' | 'Afternoon' | 'Evening' | 'Night';

type Props = NativeStackScreenProps<TrainingStackParamList, 'PastTrainingSession'>;

const PastTrainingSessionScreen = ({ route, navigation }: Props) => {
  const { dogId } = route.params || { dogId: '' };
  const theme = useTheme();
  
  const dogStore = useDogStore();
  const trainingStore = useTrainingStore();
  const exerciseStore = useExerciseStore();
  
  const [selectedDogId, setSelectedDogId] = useState<string>(dogId || '');
  const [selectedExercises, setSelectedExercises] = useState<SessionExercise[]>([]);
  const [location, setLocation] = useState<LocationType>('home');
  const [weather, setWeather] = useState<Weather>('Sunny');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('Morning');
  const [notes, setNotes] = useState<string>('');

  // Date and time state
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');
  
  // Duration in minutes (user input)
  const [durationMinutes, setDurationMinutes] = useState<number>(30);

  // Check for added exercise from the AddExerciseToSessionScreen
  useEffect(() => {
    if (route.params?.addedExercise) {
      const newExercise = route.params.addedExercise;
      setSelectedExercises(prev => [...prev, newExercise]);
      
      // Clear the parameter to avoid adding duplicate exercises
      navigation.setParams({ addedExercise: undefined });
    }
  }, [route.params?.addedExercise, navigation]);

  // Set up the navigation options
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Add Past Training Session',
      headerBackTitle: 'Back',
    });
  }, [navigation]);

  const handleAddExercise = () => {
    navigation.navigate('AddExerciseToSession', { isPastSession: true });
  };

  // Show date picker modal
  const showDatePicker = () => {
    setDatePickerMode('date');
    setShowDatePickerModal(true);
  };

  // Show time picker modal
  const showTimePicker = () => {
    setDatePickerMode('time');
    setShowDatePickerModal(true);
  };

  // Handle date & time picker changes
  const onDateTimeChange = (event: any, selectedDate?: Date) => {
    setShowDatePickerModal(false);
    
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      
      if (datePickerMode === 'date') {
        // Preserve the time from the current startDate
        newDate.setHours(startDate.getHours(), startDate.getMinutes());
      } else {
        // Preserve the date from the current startDate
        const currentDate = new Date(startDate);
        currentDate.setHours(newDate.getHours(), newDate.getMinutes());
        newDate.setTime(currentDate.getTime());
      }
      
      setStartDate(newDate);
    }
  };

  // Call this function when saving the past training session
  const handleSaveSession = useCallback(() => {
    if (!selectedDogId) {
      // Show an error or alert that a dog must be selected
      return;
    }

    // Calculate the end time based on startDate + duration
    const endTimeMs = startDate.getTime() + (durationMinutes * 60 * 1000);

    // Create a complete training session object
    const pastSession: TrainingSession = {
      id: Date.now().toString(),
      dogId: selectedDogId,
      startTime: startDate.getTime(),
      endTime: endTimeMs,
      durationMinutes,
      location,
      weather,
      timeOfDay,
      notes,
      exercises: selectedExercises,
      createdAt: Date.now(),
    };

    // Add the past session directly to the store
    trainingStore.addPastSession(pastSession);
    
    console.log('Past session created successfully with timestamp:', new Date(startDate.getTime()).toLocaleString());
    
    // Navigate back
    navigation.navigate('Training');
  }, [selectedDogId, startDate, durationMinutes, location, weather, timeOfDay, notes, selectedExercises, trainingStore, navigation]);

  // This handles adding an exercise directly to the list (not through navigation)
  const handleAddExerciseDirectly = () => {
    navigation.navigate('AddExerciseToSession', { isPastSession: true });
  };

  // Handle dog selection
  const renderDogSelection = () => {
    const dogs = dogStore.dogs;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Select Dog</Title>
          <RadioButton.Group
            onValueChange={value => setSelectedDogId(value)}
            value={selectedDogId}
          >
            {dogs.map(dog => (
              <View key={dog.id} style={styles.radioItem}>
                <RadioButton value={dog.id} color={theme.colors.primary} />
                <Text>{dog.name}</Text>
              </View>
            ))}
          </RadioButton.Group>
        </Card.Content>
      </Card>
    );
  };

  // Render the session details form
  const renderSessionForm = () => {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Session Details</Title>
          
          {/* Start Date/Time */}
          <View style={styles.dateTimeRow}>
            <Text style={styles.label}>Session Date/Time:</Text>
            <View style={styles.dateTimeButtons}>
              <Button 
                mode="outlined" 
                onPress={showDatePicker}
                style={styles.dateButton}
              >
                {startDate.toLocaleDateString()}
              </Button>
              <Button 
                mode="outlined" 
                onPress={showTimePicker}
                style={styles.timeButton}
              >
                {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Button>
            </View>
          </View>

          {/* Duration */}
          <View style={styles.formField}>
            <Text style={styles.label}>Duration (minutes):</Text>
            <TextInput
              mode="outlined"
              keyboardType="numeric"
              value={durationMinutes.toString()}
              onChangeText={text => setDurationMinutes(Math.max(1, parseInt(text) || 0))}
              style={styles.input}
            />
          </View>

          {/* Location */}
          <TextInput
            label="Location"
            value={location}
            onChangeText={(value) => setLocation(value as LocationType)}
            style={styles.input}
            mode="outlined"
          />

          {/* Weather */}
          <Text style={[styles.label, { marginTop: 16 }]}>Weather:</Text>
          <View style={styles.chipGroup}>
            {(['Sunny', 'Cloudy', 'Rainy', 'Windy', 'Snowy', 'Indoor'] as Weather[]).map((w) => (
              <Chip 
                key={w} 
                selected={weather === w}
                onPress={() => setWeather(w)}
                style={[
                  styles.chip,
                  weather === w && { backgroundColor: theme.colors.primaryContainer }
                ]}
              >
                {w}
              </Chip>
            ))}
          </View>

          {/* Time of Day */}
          <Text style={[styles.label, { marginTop: 16 }]}>Time of Day:</Text>
          <View style={styles.chipGroup}>
            {(['Morning', 'Afternoon', 'Evening', 'Night'] as TimeOfDay[]).map((t) => (
              <Chip 
                key={t} 
                selected={timeOfDay === t}
                onPress={() => setTimeOfDay(t)}
                style={[
                  styles.chip,
                  timeOfDay === t && { backgroundColor: theme.colors.primaryContainer }
                ]}
              >
                {t}
              </Chip>
            ))}
          </View>

          {/* Notes */}
          <TextInput
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            style={[styles.input, styles.notesInput]}
            mode="outlined"
            multiline
            numberOfLines={4}
          />
        </Card.Content>
      </Card>
    );
  };

  // Render exercises
  const renderExercises = () => {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.exerciseHeaderRow}>
            <Title style={styles.cardTitle}>Exercises</Title>
            <Button 
              mode="contained" 
              onPress={handleAddExerciseDirectly}
              style={styles.addButton}
            >
              Add Exercise
            </Button>
          </View>

          {selectedExercises.length === 0 ? (
            <Surface style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No exercises added yet.</Text>
              <Text style={styles.emptyStateSubtext}>Add exercises to track your training progress.</Text>
            </Surface>
          ) : (
            <View style={styles.exercisesList}>
              {selectedExercises.map((exercise, index) => {
                const exerciseInfo = exerciseStore.exercises.find(e => e.id === exercise.exerciseId);
                return (
                  <View key={`${exercise.exerciseId}-${index}`}>
                    <Surface style={styles.exerciseItem}>
                      <View style={styles.exerciseItemContent}>
                        <Text style={styles.exerciseName}>{exerciseInfo?.name || 'Unknown Exercise'}</Text>
                        <View style={styles.exerciseMetrics}>
                          <Text>
                            Success: {exercise.successfulCompletions}/{exercise.repetitions}
                          </Text>
                        </View>
                      </View>
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => {
                          setSelectedExercises(prev => 
                            prev.filter((_, i) => i !== index)
                          );
                        }}
                      />
                    </Surface>
                    {index < selectedExercises.length - 1 && <Divider />}
                  </View>
                );
              })}
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  // Render the date time picker in a modal
  const renderDateTimePickerModal = () => {
    // For Android, we use the built-in modal
    // For iOS, we render the picker directly since it already appears as a modal
    return (
      <Modal
        transparent={true}
        visible={showDatePickerModal}
        onRequestClose={() => setShowDatePickerModal(false)}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {Platform.OS === 'ios' && (
              <View style={styles.modalHeader}>
                <Button onPress={() => setShowDatePickerModal(false)}>Cancel</Button>
                <Button onPress={() => onDateTimeChange({ type: 'set' }, startDate)}>Done</Button>
              </View>
            )}

            <DateTimePicker
              value={startDate}
              mode={datePickerMode}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateTimeChange}
              style={Platform.OS === 'ios' ? styles.iosPicker : undefined}
            />
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        {renderDogSelection()}
        {renderSessionForm()}
        {renderExercises()}
        
        <Button
          mode="contained"
          onPress={handleSaveSession}
          style={styles.saveButton}
          disabled={!selectedDogId}
        >
          Save Past Session
        </Button>
      </ScrollView>
      
      {renderDateTimePickerModal()}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 12,
    color: '#007AFF',
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  input: {
    marginTop: 8,
    marginBottom: 8,
  },
  notesInput: {
    height: 100,
  },
  formField: {
    marginVertical: 8,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  chip: {
    margin: 4,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  dateTimeButtons: {
    flexDirection: 'row',
  },
  dateButton: {
    marginRight: 8,
  },
  timeButton: {
    minWidth: 100,
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
  },
  exerciseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    borderRadius: 20,
  },
  exercisesList: {
    marginTop: 8,
  },
  exerciseItem: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseItemContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  exerciseMetrics: {
    marginTop: 4,
    flexDirection: 'row',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#E8E8E8',
    borderRadius: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    color: '#757575',
    textAlign: 'center',
  },
  saveButton: {
    marginVertical: 24,
    paddingVertical: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: Platform.OS === 'ios' ? 0 : 20,
    width: '80%',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  iosPicker: {
    width: 300,
  }
});

export default PastTrainingSessionScreen; 
