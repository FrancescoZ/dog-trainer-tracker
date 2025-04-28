import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Card, Chip, Avatar, List, DataTable, useTheme } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AnalyticsStackParamList } from '../../navigation/AnalyticsStackNavigator';
import { useDogStore } from '../../store/dogStore';
import { useExerciseStore } from '../../store/exerciseStore';
import { useTrainingStore } from '../../store/trainingStore';
import { calculateSuccessRate, formatDate, formatDuration } from '../../utils/helpers';
import { VictoryChart, VictoryLine, VictoryAxis, VictoryTheme, VictoryScatter, VictoryArea } from 'victory-native';
import EmptyState from '../../components/EmptyState';

type ExerciseProgressScreenRouteProp = RouteProp<AnalyticsStackParamList, 'ExerciseProgress'>;
type ExerciseProgressScreenNavigationProp = NativeStackNavigationProp<AnalyticsStackParamList, 'ExerciseProgress'>;

const { width } = Dimensions.get('window');

const ExerciseProgressScreen = () => {
  const route = useRoute<ExerciseProgressScreenRouteProp>();
  const navigation = useNavigation<ExerciseProgressScreenNavigationProp>();
  const theme = useTheme();
  
  const { exerciseId } = route.params;
  
  const { dogs } = useDogStore();
  const { exercises } = useExerciseStore();
  const { sessions } = useTrainingStore();
  
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null);
  
  // Get the exercise
  const exercise = exercises.find(e => e.id === exerciseId);
  
  // Set the navigation title
  useEffect(() => {
    if (exercise) {
      navigation.setOptions({
        title: exercise.name
      });
    }
  }, [exercise, navigation]);
  
  // Get all sessions that include this exercise
  const exerciseSessions = sessions.filter(session => 
    session.exercises.some(e => e.exerciseId === exerciseId) &&
    (!selectedDogId || session.dogId === selectedDogId)
  );
  
  // Sort sessions by date (oldest first for chronological progress)
  const sortedSessions = [...exerciseSessions].sort((a, b) => a.startTime - b.startTime);
  
  // Collect data for each dog that has trained this exercise
  const dogsWithExercise = dogs.filter(dog => 
    sessions.some(session => 
      session.dogId === dog.id && 
      session.exercises.some(e => e.exerciseId === exerciseId)
    )
  );
  
  // Calculate overall stats
  const calculateStats = () => {
    const stats = {
      totalSessions: 0,
      totalReps: 0,
      totalSuccesses: 0,
      successRate: 0,
    };
    
    exerciseSessions.forEach(session => {
      const exerciseData = session.exercises.find(e => e.exerciseId === exerciseId);
      if (exerciseData) {
        stats.totalSessions++;
        stats.totalReps += exerciseData.repetitions;
        stats.totalSuccesses += exerciseData.successfulCompletions;
      }
    });
    
    stats.successRate = calculateSuccessRate(stats.totalSuccesses, stats.totalReps);
    return stats;
  };
  
  const stats = calculateStats();
  
  // Prepare progress data for chart
  const progressData = React.useMemo(() => {
    return sortedSessions.map(session => {
      const exerciseData = session.exercises.find(e => e.exerciseId === exerciseId);
      
      if (!exerciseData) {
        return null;
      }
      
      const successRate = calculateSuccessRate(
        exerciseData.successfulCompletions,
        exerciseData.repetitions
      );
      
      return {
        date: session.startTime,
        formattedDate: formatDate(session.startTime),
        successRate,
        distractionLevel: exerciseData.distractionLevel || 0,
        distance: exerciseData.distance || 0,
        repetitions: exerciseData.repetitions,
        successfulCompletions: exerciseData.successfulCompletions,
        sessionId: session.id,
      };
    }).filter(Boolean);
  }, [sortedSessions, exerciseId]);
  
  // Prepare distraction level data
  const distractionData = React.useMemo(() => {
    return progressData.map(data => ({
      x: data.formattedDate,
      y: data.distractionLevel,
      date: data.date,
    }));
  }, [progressData]);
  
  // Prepare distance data
  const distanceData = React.useMemo(() => {
    return progressData.map(data => ({
      x: data.formattedDate,
      y: data.distance,
      date: data.date,
    }));
  }, [progressData]);
  
  // Prepare success rate data
  const successRateData = React.useMemo(() => {
    return progressData.map(data => ({
      x: data.formattedDate,
      y: data.successRate,
      date: data.date,
    }));
  }, [progressData]);
  
  // Render empty state if no data
  if (!exercise) {
    return (
      <EmptyState
        title="Exercise Not Found"
        message="The exercise you're looking for doesn't exist"
        icon="alert-circle"
      />
    );
  }
  
  if (exerciseSessions.length === 0) {
    return (
      <EmptyState
        title="No Training Data"
        message={`No training sessions found for ${exercise.name}`}
        icon="trending-up"
        buttonText="Start Training"
        onButtonPress={() => navigation.navigate('Training')}
      />
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      {/* Exercise Information */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.exerciseHeader}>
            <Avatar.Icon 
              size={50} 
              icon={exercise.icon || 'paw'} 
              backgroundColor={theme.colors.primary}
            />
            <View style={styles.exerciseInfo}>
              <Text variant="titleLarge">{exercise.name}</Text>
              <Text variant="bodyMedium">{exercise.description}</Text>
            </View>
          </View>
          
          {exercise.category && (
            <Chip style={styles.categoryChip} mode="outlined">
              {exercise.category}
            </Chip>
          )}
        </Card.Content>
      </Card>
      
      {/* Dog Filter */}
      {dogsWithExercise.length > 1 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Filter by Dog</Text>
            <View style={styles.dogChips}>
              <Chip
                selected={!selectedDogId}
                onPress={() => setSelectedDogId(null)}
                style={styles.dogChip}
              >
                All Dogs
              </Chip>
              {dogsWithExercise.map(dog => (
                <Chip
                  key={dog.id}
                  selected={selectedDogId === dog.id}
                  onPress={() => setSelectedDogId(dog.id)}
                  style={styles.dogChip}
                >
                  {dog.name}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}
      
      {/* Stats Summary */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Overall Stats</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text variant="headlineSmall">{stats.totalSessions}</Text>
              <Text variant="bodyMedium">Sessions</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineSmall">{stats.totalReps}</Text>
              <Text variant="bodyMedium">Repetitions</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineSmall">{Math.round(stats.successRate)}%</Text>
              <Text variant="bodyMedium">Success Rate</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
      
      {/* Success Rate Progress */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Success Rate Progress</Text>
          
          {successRateData.length > 0 ? (
            <VictoryChart
              theme={VictoryTheme.material}
              width={width - 64}
              height={250}
              domainPadding={{ y: 10 }}
              padding={{ top: 20, bottom: 50, left: 50, right: 20 }}
            >
              <VictoryAxis
                dependentAxis
                tickFormat={(x) => typeof x === 'number' ? `${x}%` : ''}
                style={{
                  grid: { stroke: "lightgray", strokeWidth: 0.5 }
                }}
                domain={[0, 100]}
              />
              <VictoryAxis
                tickFormat={(x, i) => {
                  if (i < 0 || i >= successRateData.length) return '';
                  if (successRateData.length <= 5 || i % Math.ceil(successRateData.length / 5) === 0) {
                    return typeof x === 'string' ? x.slice(0, 6) : '';
                  }
                  return '';
                }}
                style={{
                  tickLabels: { angle: -45, textAnchor: 'end' }
                }}
              />
              <VictoryLine
                data={successRateData}
                x="x"
                y="y"
                style={{
                  data: { stroke: theme.colors.primary, strokeWidth: 2 }
                }}
              />
              <VictoryScatter
                data={successRateData}
                x="x"
                y="y"
                size={5}
                style={{
                  data: { fill: theme.colors.primary }
                }}
              />
              <VictoryArea
                data={successRateData}
                x="x"
                y="y"
                style={{
                  data: { fill: theme.colors.primary, fillOpacity: 0.1 }
                }}
              />
            </VictoryChart>
          ) : (
            <Text style={styles.noDataText}>Not enough data to display chart</Text>
          )}
        </Card.Content>
      </Card>
      
      {/* Distraction & Distance Progress */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Progression</Text>
          
          {distractionData.length > 0 && distractionData.some(d => d.y > 0) ? (
            <>
              <Text variant="bodyMedium" style={styles.chartLabel}>Distraction Level (1-5)</Text>
              <VictoryChart
                theme={VictoryTheme.material}
                width={width - 64}
                height={200}
                padding={{ top: 20, bottom: 50, left: 50, right: 20 }}
              >
                <VictoryAxis
                  dependentAxis
                  tickFormat={(x) => typeof x === 'number' ? Math.round(x).toString() : ''}
                  style={{
                    grid: { stroke: "lightgray", strokeWidth: 0.5 }
                  }}
                  domain={[0, 5]}
                />
                <VictoryAxis
                  tickFormat={(x, i) => {
                    if (i < 0 || i >= distractionData.length) return '';
                    if (distractionData.length <= 5 || i % Math.ceil(distractionData.length / 5) === 0) {
                      return typeof x === 'string' ? x.slice(0, 6) : '';
                    }
                    return '';
                  }}
                  style={{
                    tickLabels: { angle: -45, textAnchor: 'end' }
                  }}
                />
                <VictoryLine
                  data={distractionData}
                  x="x"
                  y="y"
                  style={{
                    data: { stroke: "#7986CB", strokeWidth: 2 }
                  }}
                />
                <VictoryScatter
                  data={distractionData}
                  x="x"
                  y="y"
                  size={4}
                  style={{
                    data: { fill: "#7986CB" }
                  }}
                />
              </VictoryChart>
            </>
          ) : null}
          
          {distanceData.length > 0 && distanceData.some(d => d.y > 0) ? (
            <>
              <Text variant="bodyMedium" style={styles.chartLabel}>Distance (meters)</Text>
              <VictoryChart
                theme={VictoryTheme.material}
                width={width - 64}
                height={200}
                padding={{ top: 20, bottom: 50, left: 50, right: 20 }}
              >
                <VictoryAxis
                  dependentAxis
                  tickFormat={(x) => typeof x === 'number' ? Math.round(x).toString() : ''}
                  style={{
                    grid: { stroke: "lightgray", strokeWidth: 0.5 }
                  }}
                />
                <VictoryAxis
                  tickFormat={(x, i) => {
                    if (i < 0 || i >= distanceData.length) return '';
                    if (distanceData.length <= 5 || i % Math.ceil(distanceData.length / 5) === 0) {
                      return typeof x === 'string' ? x.slice(0, 6) : '';
                    }
                    return '';
                  }}
                  style={{
                    tickLabels: { angle: -45, textAnchor: 'end' }
                  }}
                />
                <VictoryLine
                  data={distanceData}
                  x="x"
                  y="y"
                  style={{
                    data: { stroke: "#4DB6AC", strokeWidth: 2 }
                  }}
                />
                <VictoryScatter
                  data={distanceData}
                  x="x"
                  y="y"
                  size={4}
                  style={{
                    data: { fill: "#4DB6AC" }
                  }}
                />
              </VictoryChart>
            </>
          ) : null}
        </Card.Content>
      </Card>
      
      {/* Session History */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Session History</Text>
          
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Date</DataTable.Title>
              <DataTable.Title numeric>Reps</DataTable.Title>
              <DataTable.Title numeric>Success</DataTable.Title>
              <DataTable.Title numeric>Rate</DataTable.Title>
            </DataTable.Header>
            
            {progressData.slice(0, 5).map((data, index) => {
              const dog = dogs.find(d => {
                const session = sessions.find(s => s.id === data.sessionId);
                return session && session.dogId === d.id;
              });
              
              return (
                <DataTable.Row 
                  key={index}
                  onPress={() => navigation.navigate('TrainingDetail', { sessionId: data.sessionId })}
                >
                  <DataTable.Cell>
                    <View>
                      <Text>{data.formattedDate}</Text>
                      {dog && <Text style={styles.dogName}>{dog.name}</Text>}
                    </View>
                  </DataTable.Cell>
                  <DataTable.Cell numeric>{data.repetitions}</DataTable.Cell>
                  <DataTable.Cell numeric>{data.successfulCompletions}</DataTable.Cell>
                  <DataTable.Cell numeric>{Math.round(data.successRate)}%</DataTable.Cell>
                </DataTable.Row>
              );
            })}
            
            {progressData.length > 5 && (
              <DataTable.Pagination
                page={0}
                numberOfPages={1}
                onPageChange={() => {}}
                label={`1-5 of ${progressData.length}`}
              />
            )}
          </DataTable>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  exerciseInfo: {
    marginLeft: 16,
    flex: 1,
  },
  categoryChip: {
    alignSelf: 'flex-start',
  },
  sectionTitle: {
    marginBottom: 16,
  },
  chartLabel: {
    marginTop: 8,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  noDataText: {
    textAlign: 'center',
    marginVertical: 40,
    opacity: 0.5,
  },
  dogChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dogChip: {
    margin: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  dogName: {
    fontSize: 12,
    opacity: 0.7,
  },
});

export default ExerciseProgressScreen; 
