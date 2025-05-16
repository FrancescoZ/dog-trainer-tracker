import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, Chip, List, useTheme, SegmentedButtons, TextInput } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TrainingStackParamList } from '../../navigation/TrainingStackNavigator';
import { useExerciseStore } from '../../store/exerciseStore';
import { useTrainingStore } from '../../store/trainingStore';
import { TeachingMethod, SessionExercise } from '../../types';
import ComplexityRating from '../../components/ComplexityRating';

type AddExerciseToSessionScreenNavigationProp = NativeStackNavigationProp<TrainingStackParamList, 'AddExerciseToSession'>;
type AddExerciseToSessionScreenRouteProp = RouteProp<TrainingStackParamList, 'AddExerciseToSession'>;

const TEACHING_METHODS: { label: string; value: TeachingMethod }[] = [
  { label: 'Clicker', value: 'clicker' },
  { label: 'Positive Reinforcement', value: 'positive-reinforcement' },
  { label: 'Negative Reinforcement', value: 'negative-reinforcement' },
  { label: 'Stimulus', value: 'stimulus' },
  { label: 'Other', value: 'other' },
];

const AddExerciseToSessionScreen = () => {
  const navigation = useNavigation<AddExerciseToSessionScreenNavigationProp>();
  const route = useRoute<AddExerciseToSessionScreenRouteProp>();
  const theme = useTheme();
  
  const { exercises } = useExerciseStore();
  const { currentSession, addExerciseToSession } = useTrainingStore();
  
  const isPastSession = route.params?.isPastSession === true;
  
  // Form state
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [distractionLevel, setDistractionLevel] = useState<number>(1);
  const [distance, setDistance] = useState<number>(0);
  const [repetitions, setRepetitions] = useState<number>(5);
  const [successfulCompletions, setSuccessfulCompletions] = useState<number>(0);
  const [teachingMethods, setTeachingMethods] = useState<TeachingMethod[]>(['positive-reinforcement']);
  const [time, setTime] = useState<number>(0); // Time in seconds
  
  // Check if there's an active session, but only if we're not adding to a past session
  useEffect(() => {
    if (!isPastSession && !currentSession) {
      Alert.alert('Error', 'No active training session', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  }, [currentSession, navigation, isPastSession]);
  
  // Get selected exercise details
  const selectedExercise = selectedExerciseId 
    ? exercises.find(e => e.id === selectedExerciseId) 
    : null;
  
  const handleSelectExercise = (exerciseId: string) => {
    setSelectedExerciseId(exerciseId);
  };
  
  const handleAddExercise = () => {
    if (!isPastSession && !currentSession) {
      Alert.alert('Error', 'No active training session found');
      return;
    }
    
    if (!selectedExerciseId) {
      Alert.alert('Error', 'Please select an exercise');
      return;
    }
    
    // Validate form
    if (repetitions < 1) {
      Alert.alert('Error', 'Repetitions must be at least 1');
      return;
    }
    
    if (successfulCompletions > repetitions) {
      Alert.alert('Error', 'Successful completions cannot be greater than repetitions');
      return;
    }
    
    const exerciseData: SessionExercise = {
      id: Date.now().toString(), // Give it a unique ID for past sessions
      exerciseId: selectedExerciseId,
      distractionLevel,
      distance,
      repetitions,
      successfulCompletions,
      teachingMethods,
      time, // Add time field to the exercise data
    };
    
    if (isPastSession) {
      // Navigate back to PastTrainingSession with exercise data
      navigation.navigate('PastTrainingSession', {
        addedExercise: exerciseData
      });
    } else {
      // Add exercise to current session
      addExerciseToSession(exerciseData);
      // Go back to session screen
      navigation.goBack();
    }
  };
  
  const handleToggleTeachingMethod = (method: TeachingMethod) => {
    if (teachingMethods.includes(method)) {
      setTeachingMethods(teachingMethods.filter(m => m !== method));
    } else {
      setTeachingMethods([...teachingMethods, method]);
    }
  };
  
  const renderExerciseSelector = () => {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Select Exercise</Text>
          
          <List.Section>
            {exercises.map(exercise => (
              <List.Item
                key={exercise.id}
                title={exercise.name}
                description={() => (
                  <View style={styles.exerciseDescription}>
                    <ComplexityRating level={exercise.complexity} size={14} />
                    {exercise.categories && exercise.categories.length > 0 && (
                      <View style={styles.categoriesContainer}>
                        {exercise.categories.map((category, index) => (
                          <Chip
                            key={index}
                            style={styles.categoryChip}
                            textStyle={{ fontSize: 10 }}
                          >
                            {category}
                          </Chip>
                        ))}
                      </View>
                    )}
                  </View>
                )}
                onPress={() => handleSelectExercise(exercise.id)}
                left={props => <List.Icon {...props} icon="arm-flex" />}
                right={props => 
                  selectedExerciseId === exercise.id ? 
                    <List.Icon {...props} icon="check" color={theme.colors.primary} /> : 
                    null
                }
                style={[
                  styles.exerciseItem,
                  selectedExerciseId === exercise.id && { 
                    backgroundColor: theme.colors.primaryContainer
                  }
                ]}
              />
            ))}
          </List.Section>
        </Card.Content>
      </Card>
    );
  };
  
  const renderExerciseDetailsForm = () => {
    if (!selectedExercise) return null;
    
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Exercise Details</Text>
          
          <Text variant="bodyMedium" style={styles.label}>Distraction Level (1-5)</Text>
          <View style={styles.sliderContainer}>
            <Text variant="bodySmall">Low</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={5}
              step={1}
              value={distractionLevel}
              onValueChange={setDistractionLevel}
              minimumTrackTintColor={theme.colors.primary}
              maximumTrackTintColor="#ccc"
            />
            <Text variant="bodySmall">High</Text>
          </View>
          <Text variant="bodyMedium" style={styles.sliderValue}>{distractionLevel}</Text>
          
          <Text variant="bodyMedium" style={styles.label}>Distance from Handler (meters)</Text>
          <TextInput
            mode="outlined"
            keyboardType="numeric"
            value={distance.toString()}
            onChangeText={text => setDistance(Number(text) || 0)}
            style={styles.input}
          />
          
          <Text variant="bodyMedium" style={styles.label}>Repetitions</Text>
          <TextInput
            mode="outlined"
            keyboardType="numeric"
            value={repetitions.toString()}
            onChangeText={text => setRepetitions(Number(text) || 0)}
            style={styles.input}
          />
          
          <Text variant="bodyMedium" style={styles.label}>Successful Completions</Text>
          <TextInput
            mode="outlined"
            keyboardType="numeric"
            value={successfulCompletions.toString()}
            onChangeText={text => {
              const value = Number(text) || 0;
              setSuccessfulCompletions(Math.min(value, repetitions));
            }}
            style={styles.input}
          />
          
          <Text variant="bodyMedium" style={styles.label}>Time (seconds)</Text>
          <TextInput
            mode="outlined"
            keyboardType="numeric"
            value={time.toString()}
            onChangeText={text => setTime(Number(text) || 0)}
            style={styles.input}
            placeholder="Time spent on this exercise in seconds"
          />
          
          <Text variant="bodyMedium" style={styles.label}>Teaching Methods</Text>
          <View style={styles.methodsContainer}>
            {TEACHING_METHODS.map(method => (
              <Chip
                key={method.value}
                selected={teachingMethods.includes(method.value)}
                onPress={() => handleToggleTeachingMethod(method.value)}
                style={styles.methodChip}
              >
                {method.label}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>
    );
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {renderExerciseSelector()}
        {renderExerciseDetailsForm()}
        
        <Button
          mode="contained"
          onPress={handleAddExercise}
          style={styles.addButton}
          disabled={!selectedExerciseId}
        >
          Add Exercise to Session
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  exerciseItem: {
    marginBottom: 4,
    borderRadius: 8,
  },
  exerciseDescription: {
    marginTop: 4,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  categoryChip: {
    marginRight: 4,
    marginBottom: 4,
  },
  label: {
    marginTop: 12,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 8,
  },
  sliderValue: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 4,
  },
  input: {
    marginBottom: 8,
  },
  methodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  methodChip: {
    margin: 4,
  },
  addButton: {
    marginTop: 8,
    marginBottom: 24,
  },
});

export default AddExerciseToSessionScreen; 
