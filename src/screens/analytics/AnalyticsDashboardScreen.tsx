import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Card, Button, Chip, SegmentedButtons, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AnalyticsStackParamList } from '../../navigation/AnalyticsStackNavigator';
import { useDogStore } from '../../store/dogStore';
import { useExerciseStore } from '../../store/exerciseStore';
import { useTrainingStore } from '../../store/trainingStore';
import { calculateSuccessRate, formatDate } from '../../utils/helpers';
import { VictoryPie, VictoryChart, VictoryBar, VictoryAxis, VictoryTheme, VictoryLine } from 'victory-native';
import EmptyState from '../../components/EmptyState';

type AnalyticsDashboardScreenNavigationProp = NativeStackNavigationProp<AnalyticsStackParamList, 'AnalyticsDashboard'>;

const { width } = Dimensions.get('window');

const AnalyticsDashboardScreen = () => {
  const navigation = useNavigation<AnalyticsDashboardScreenNavigationProp>();
  const theme = useTheme();
  
  const { dogs } = useDogStore();
  const { exercises } = useExerciseStore();
  const { sessions } = useTrainingStore();
  
  // Filter state
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('all'); // 'week', 'month', 'all'
  
  // Get current dog
  const currentDog = dogs.find(d => d.id === selectedDogId);
  
  // Filter sessions by dog and time range
  const filteredSessions = sessions.filter(session => {
    // Filter by dog
    if (selectedDogId && session.dogId !== selectedDogId) {
      return false;
    }
    
    // Filter by time range
    if (timeRange !== 'all') {
      const now = Date.now();
      const daysAgo = timeRange === 'week' ? 7 : 30;
      const cutoffTime = now - (daysAgo * 24 * 60 * 60 * 1000);
      
      if (session.startTime < cutoffTime) {
        return false;
      }
    }
    
    return true;
  });
  
  // Sort sessions by date (newest first)
  const sortedSessions = [...filteredSessions].sort((a, b) => b.startTime - a.startTime);
  
  // Calculate total training time
  const totalTrainingTime = filteredSessions.reduce((total, session) => {
    return total + (session.endTime - session.startTime);
  }, 0);
  
  // Prepare exercise success rate data for the chart
  const exerciseSuccessData = React.useMemo(() => {
    const exerciseMap = new Map();
    
    // Collect all exercise data from sessions
    filteredSessions.forEach(session => {
      session.exercises.forEach(exerciseRecord => {
        const { exerciseId, repetitions, successfulCompletions } = exerciseRecord;
        
        if (!exerciseMap.has(exerciseId)) {
          exerciseMap.set(exerciseId, { total: 0, successful: 0 });
        }
        
        const current = exerciseMap.get(exerciseId);
        exerciseMap.set(exerciseId, {
          total: current.total + repetitions,
          successful: current.successful + successfulCompletions,
        });
      });
    });
    
    // Convert to chart data
    return Array.from(exerciseMap.entries())
      .map(([exerciseId, data]) => {
        const exercise = exercises.find(e => e.id === exerciseId);
        const successRate = calculateSuccessRate(data.successful, data.total);
        
        return {
          exerciseId,
          name: exercise ? exercise.name : 'Unknown',
          successRate,
          total: data.total,
        };
      })
      // Sort by success rate (ascending)
      .sort((a, b) => a.successRate - b.successRate)
      // Take top 5 for readability
      .slice(0, 5);
  }, [filteredSessions, exercises]);
  
  // Prepare training frequency data (sessions per day)
  const trainingFrequencyData = React.useMemo(() => {
    if (filteredSessions.length === 0) return [];
    
    // Get date range
    const dates = filteredSessions.map(s => new Date(s.startTime).setHours(0, 0, 0, 0));
    const earliestDate = Math.min(...dates);
    const latestDate = Math.max(...dates);
    
    // Choose the right time increment based on range
    const days = Math.ceil((latestDate - earliestDate) / (24 * 60 * 60 * 1000));
    let increment = 1; // days
    
    if (days > 30) {
      increment = 7; // weeks
    }
    
    // Create buckets
    const buckets = new Map();
    let current = new Date(earliestDate);
    
    while (current.getTime() <= latestDate) {
      buckets.set(current.getTime(), 0);
      
      // Move to next increment
      current = new Date(current.getTime() + (increment * 24 * 60 * 60 * 1000));
    }
    
    // Fill buckets with session counts
    filteredSessions.forEach(session => {
      const sessionDate = new Date(session.startTime).setHours(0, 0, 0, 0);
      
      // Find the right bucket
      let bucketDate = earliestDate;
      while (bucketDate <= latestDate) {
        const nextBucketDate = bucketDate + (increment * 24 * 60 * 60 * 1000);
        
        if (sessionDate >= bucketDate && sessionDate < nextBucketDate) {
          buckets.set(bucketDate, buckets.get(bucketDate) + 1);
          break;
        }
        
        bucketDate = nextBucketDate;
      }
    });
    
    // Convert to chart data
    return Array.from(buckets.entries())
      .map(([timestamp, count]) => ({
        date: timestamp,
        count,
        label: formatDate(timestamp),
      }));
  }, [filteredSessions]);
  
  // Time range options
  const timeRangeOptions = [
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'all', label: 'All Time' },
  ];
  
  // Handle navigation to more detailed analytics
  const handleExerciseProgressPress = (exerciseId) => {
    navigation.navigate('ExerciseProgress', { exerciseId });
  };
  
  const handleSuccessRatePress = () => {
    navigation.navigate('SuccessRate');
  };
  
  const handleTrainingFrequencyPress = () => {
    navigation.navigate('TrainingFrequency');
  };
  
  // Render empty state if no sessions
  if (filteredSessions.length === 0) {
    return (
      <EmptyState
        title="No Training Data"
        message="Complete some training sessions to see analytics"
        icon="stats-chart"
        buttonText="Start Training"
        onButtonPress={() => navigation.navigate('Training')}
      />
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.filterContainer}>
        <Text variant="titleMedium" style={styles.filterTitle}>Filter Data</Text>
        
        <Text variant="bodyMedium" style={styles.label}>Dog</Text>
        <View style={styles.chipContainer}>
          <Chip
            selected={!selectedDogId}
            onPress={() => setSelectedDogId(null)}
            style={styles.chip}
          >
            All Dogs
          </Chip>
          {dogs.map(dog => (
            <Chip
              key={dog.id}
              selected={selectedDogId === dog.id}
              onPress={() => setSelectedDogId(dog.id)}
              style={styles.chip}
            >
              {dog.name}
            </Chip>
          ))}
        </View>
        
        <Text variant="bodyMedium" style={styles.label}>Time Range</Text>
        <SegmentedButtons
          value={timeRange}
          onValueChange={setTimeRange}
          buttons={timeRangeOptions}
          style={styles.segmentedButtons}
        />
      </View>
      
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Training Summary
          </Text>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text variant="headlineSmall">{filteredSessions.length}</Text>
              <Text variant="bodyMedium">Sessions</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text variant="headlineSmall">
                {Math.floor(totalTrainingTime / (1000 * 60 * 60))}h {Math.floor((totalTrainingTime % (1000 * 60 * 60)) / (1000 * 60))}m
              </Text>
              <Text variant="bodyMedium">Total Time</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text variant="headlineSmall">
                {sortedSessions.length > 0 ? formatDate(sortedSessions[0].startTime) : '-'}
              </Text>
              <Text variant="bodyMedium">Last Session</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
      
      <Card style={styles.chartCard}>
        <Card.Content>
          <View style={styles.chartHeader}>
            <Text variant="titleMedium">Exercise Success Rates</Text>
            <Button 
              mode="text"
              onPress={handleSuccessRatePress}
              compact
            >
              More
            </Button>
          </View>
          
          {exerciseSuccessData.length > 0 ? (
            <VictoryChart
              theme={VictoryTheme.material}
              domainPadding={20}
              padding={{ top: 20, bottom: 50, left: 60, right: 40 }}
              width={width - 64}
              height={250}
            >
              <VictoryAxis
                dependentAxis
                tickFormat={(x) => typeof x === 'number' ? `${x}%` : ''}
                style={{
                  grid: { stroke: "lightgray", strokeWidth: 0.5 }
                }}
              />
              <VictoryAxis
                tickFormat={(_, i) => {
                  if (i < 0 || i >= exerciseSuccessData.length) return '';
                  return exerciseSuccessData[i]?.name?.slice(0, 8) || '';
                }}
                style={{
                  tickLabels: { angle: -45, textAnchor: 'end' }
                }}
              />
              <VictoryBar
                data={exerciseSuccessData}
                x="name"
                y="successRate"
                style={{
                  data: {
                    fill: ({ datum }) => {
                      // Color based on success rate
                      if (datum.successRate < 40) return "#FF6B6B"; // Red
                      if (datum.successRate < 70) return "#FFD166"; // Yellow
                      return "#06D6A0"; // Green
                    }
                  }
                }}
                labels={({ datum }) => `${Math.round(datum.successRate)}%`}
              />
            </VictoryChart>
          ) : (
            <Text style={styles.noDataText}>Not enough data to display chart</Text>
          )}
        </Card.Content>
      </Card>
      
      <Card style={styles.chartCard}>
        <Card.Content>
          <View style={styles.chartHeader}>
            <Text variant="titleMedium">Training Frequency</Text>
            <Button 
              mode="text"
              onPress={handleTrainingFrequencyPress}
              compact
            >
              More
            </Button>
          </View>
          
          {trainingFrequencyData.length > 0 ? (
            <VictoryChart
              theme={VictoryTheme.material}
              padding={{ top: 20, bottom: 50, left: 50, right: 20 }}
              width={width - 64}
              height={250}
            >
              <VictoryAxis
                dependentAxis
                tickFormat={(x) => typeof x === 'number' ? Math.round(x).toString() : ''}
                style={{
                  grid: { stroke: "lightgray", strokeWidth: 0.5 }
                }}
              />
              <VictoryAxis
                tickFormat={(_, i) => {
                  // Only show a few date labels to avoid overcrowding
                  if (i < 0 || i >= trainingFrequencyData.length) return '';
                  if (trainingFrequencyData.length <= 5 || i % Math.ceil(trainingFrequencyData.length / 5) === 0) {
                    return trainingFrequencyData[i]?.label?.slice(0, 6) || '';
                  }
                  return '';
                }}
                style={{
                  tickLabels: { angle: -45, textAnchor: 'end' }
                }}
              />
              <VictoryLine
                data={trainingFrequencyData}
                x="date"
                y="count"
                style={{
                  data: { stroke: theme.colors.primary, strokeWidth: 2 }
                }}
              />
            </VictoryChart>
          ) : (
            <Text style={styles.noDataText}>Not enough data to display chart</Text>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    padding: 16,
    paddingBottom: 0,
  },
  filterTitle: {
    marginBottom: 16,
  },
  label: {
    marginTop: 8,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  chip: {
    margin: 4,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  summaryCard: {
    margin: 16,
    marginTop: 8,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  chartCard: {
    margin: 16,
    marginTop: 8,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  noDataText: {
    textAlign: 'center',
    marginVertical: 40,
    opacity: 0.5,
  },
});

export default AnalyticsDashboardScreen; 
