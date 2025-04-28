import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Card, Chip, Searchbar, Button, DataTable, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AnalyticsStackParamList } from '../../navigation/AnalyticsStackNavigator';
import { useDogStore } from '../../store/dogStore';
import { useExerciseStore } from '../../store/exerciseStore';
import { useTrainingStore } from '../../store/trainingStore';
import { calculateSuccessRate } from '../../utils/helpers';
import { VictoryPie, VictoryLegend, VictoryTooltip, VictoryTheme, VictoryBar, VictoryChart, VictoryAxis } from 'victory-native';
import EmptyState from '../../components/EmptyState';

type SuccessRateScreenNavigationProp = NativeStackNavigationProp<AnalyticsStackParamList, 'SuccessRate'>;

const { width } = Dimensions.get('window');

interface ExerciseSuccessData {
  exerciseId: string;
  name: string;
  successRate: number;
  total: number;
  successful: number;
  category: string;
}

const SuccessRateScreen = () => {
  const navigation = useNavigation<SuccessRateScreenNavigationProp>();
  const theme = useTheme();
  
  const { dogs, currentDogId } = useDogStore();
  const { exercises } = useExerciseStore();
  const { sessions } = useTrainingStore();
  
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get categories from exercises
  const categories = [...new Set(exercises.map(e => e.category).filter(Boolean))] as string[];
  
  // Filter sessions by dog
  const filteredSessions = sessions.filter(session => 
    !selectedDogId || session.dogId === selectedDogId
  );
  
  // Calculate success rates for each exercise
  const exerciseSuccessData: ExerciseSuccessData[] = React.useMemo(() => {
    const exerciseMap = new Map<string, { total: number, successful: number }>();
    
    // Collect all exercise data from sessions
    filteredSessions.forEach(session => {
      session.exercises.forEach(exerciseRecord => {
        const { exerciseId, repetitions, successfulCompletions } = exerciseRecord;
        
        if (!exerciseMap.has(exerciseId)) {
          exerciseMap.set(exerciseId, { total: 0, successful: 0 });
        }
        
        const current = exerciseMap.get(exerciseId)!;
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
          successful: data.successful,
          category: exercise?.category || 'Uncategorized',
        };
      })
      // Filter by category if selected
      .filter(data => !selectedCategory || data.category === selectedCategory)
      // Filter by search query
      .filter(data => 
        !searchQuery || 
        data.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      // Sort by success rate (descending)
      .sort((a, b) => b.successRate - a.successRate);
  }, [filteredSessions, exercises, selectedCategory, searchQuery]);
  
  // Group by success rate ranges for pie chart
  const successRanges = React.useMemo(() => {
    const ranges = [
      { name: 'Excellent (90-100%)', range: [90, 100], count: 0, color: '#06D6A0' },
      { name: 'Good (70-89%)', range: [70, 89], count: 0, color: '#1B9AAA' },
      { name: 'Fair (50-69%)', range: [50, 69], count: 0, color: '#FFD166' },
      { name: 'Needs Work (0-49%)', range: [0, 49], count: 0, color: '#FF6B6B' }
    ];
    
    // Count exercises in each range
    exerciseSuccessData.forEach(data => {
      const rangeItem = ranges.find(r => 
        data.successRate >= r.range[0] && data.successRate <= r.range[1]
      );
      
      if (rangeItem) {
        rangeItem.count++;
      }
    });
    
    return ranges.filter(r => r.count > 0);
  }, [exerciseSuccessData]);
  
  // Get total reps and success rate
  const totalStats = React.useMemo(() => {
    const totalReps = exerciseSuccessData.reduce((sum, data) => sum + data.total, 0);
    const totalSuccessful = exerciseSuccessData.reduce((sum, data) => sum + data.successful, 0);
    const overallSuccessRate = calculateSuccessRate(totalSuccessful, totalReps);
    
    return { totalReps, totalSuccessful, overallSuccessRate };
  }, [exerciseSuccessData]);
  
  // Handle exercise selection
  const handleExercisePress = (exerciseId: string) => {
    navigation.navigate('ExerciseProgress', { exerciseId });
  };
  
  // Render empty state if no sessions
  if (filteredSessions.length === 0) {
    return (
      <EmptyState
        title="No Training Data"
        message="Complete some training sessions to see success rate analytics"
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
        
        <Searchbar
          placeholder="Search exercises"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        
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
        
        {categories.length > 0 && (
          <>
            <Text variant="bodyMedium" style={styles.label}>Category</Text>
            <View style={styles.chipContainer}>
              <Chip
                selected={!selectedCategory}
                onPress={() => setSelectedCategory(null)}
                style={styles.chip}
              >
                All Categories
              </Chip>
              {categories.map(category => (
                <Chip
                  key={category}
                  selected={selectedCategory === category}
                  onPress={() => setSelectedCategory(category)}
                  style={styles.chip}
                >
                  {category}
                </Chip>
              ))}
            </View>
          </>
        )}
      </View>
      
      {/* Overall Summary */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Overall Success Rate
          </Text>
          
          <View style={styles.summaryRow}>
            <View style={styles.statItem}>
              <Text variant="headlineSmall">{Math.round(totalStats.overallSuccessRate)}%</Text>
              <Text variant="bodyMedium">Success Rate</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineSmall">{totalStats.totalSuccessful}</Text>
              <Text variant="bodyMedium">Successful</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineSmall">{totalStats.totalReps}</Text>
              <Text variant="bodyMedium">Total Reps</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
      
      {/* Success Rate Distribution */}
      {successRanges.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Success Rate Distribution
            </Text>
            
            <View style={styles.chartContainer}>
              <View style={{ height: 250, alignItems: 'center', justifyContent: 'center' }}>
                <VictoryPie
                  data={successRanges}
                  x="name"
                  y="count"
                  width={200}
                  height={200}
                  colorScale={successRanges.map(r => r.color)}
                  style={{
                    labels: { fill: 'transparent' }
                  }}
                  innerRadius={20}
                  labelRadius={60}
                />
              </View>
              
              <VictoryLegend
                x={0}
                y={0}
                width={width - 64}
                orientation="vertical"
                gutter={20}
                data={successRanges.map(range => ({
                  name: `${range.name} (${range.count})`,
                  symbol: { fill: range.color }
                }))}
              />
            </View>
          </Card.Content>
        </Card>
      )}
      
      {/* Top Exercises */}
      {exerciseSuccessData.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Exercise Success Rates
            </Text>
            
            <VictoryChart
              theme={VictoryTheme.material}
              domainPadding={20}
              width={width - 64}
              height={Math.max(250, exerciseSuccessData.length * 30)}
              padding={{ top: 20, bottom: 50, left: 60, right: 20 }}
            >
              <VictoryAxis
                dependentAxis
                tickFormat={(x) => x ? x.toString().slice(0, 15) : ''}
                style={{
                  tickLabels: { fontSize: 8 }
                }}
              />
              <VictoryAxis
                tickFormat={(x) => typeof x === 'number' ? `${x}%` : ''}
                style={{
                  grid: { stroke: "lightgray", strokeWidth: 0.5 }
                }}
              />
              <VictoryBar
                horizontal
                data={exerciseSuccessData.slice(0, 10)}
                x="name"
                y="successRate"
                style={{
                  data: {
                    fill: ({ datum }) => {
                      // Color based on success rate
                      if (datum.successRate < 50) return "#FF6B6B"; // Red
                      if (datum.successRate < 70) return "#FFD166"; // Yellow
                      if (datum.successRate < 90) return "#1B9AAA"; // Blue
                      return "#06D6A0"; // Green
                    }
                  },
                  labels: { fontSize: 8 }
                }}
                labels={({ datum }) => `${Math.round(datum.successRate)}%`}
                labelComponent={<VictoryTooltip dy={0} centerOffset={{ x: 10 }} />}
              />
            </VictoryChart>
          </Card.Content>
        </Card>
      )}
      
      {/* Exercise List */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Exercise Details
          </Text>
          
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Exercise</DataTable.Title>
              <DataTable.Title style={styles.categoryColumn}>Category</DataTable.Title>
              <DataTable.Title numeric>Reps</DataTable.Title>
              <DataTable.Title numeric>Success %</DataTable.Title>
            </DataTable.Header>
            
            {exerciseSuccessData.map((data, index) => (
              <DataTable.Row 
                key={data.exerciseId}
                onPress={() => handleExercisePress(data.exerciseId)}
              >
                <DataTable.Cell>{data.name}</DataTable.Cell>
                <DataTable.Cell style={styles.categoryColumn}>{data.category}</DataTable.Cell>
                <DataTable.Cell numeric>{data.total}</DataTable.Cell>
                <DataTable.Cell 
                  numeric
                  textStyle={{
                    color: 
                      data.successRate < 50 ? "#FF6B6B" : 
                      data.successRate < 70 ? "#FFD166" :
                      data.successRate < 90 ? "#1B9AAA" : 
                      "#06D6A0",
                    fontWeight: 'bold'
                  }}
                >
                  {Math.round(data.successRate)}%
                </DataTable.Cell>
              </DataTable.Row>
            ))}
            
            {exerciseSuccessData.length > 10 && (
              <DataTable.Pagination
                page={0}
                numberOfPages={Math.ceil(exerciseSuccessData.length / 10)}
                onPageChange={() => {}}
                label={`1-10 of ${exerciseSuccessData.length}`}
                showFastPaginationControls
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
  filterContainer: {
    padding: 16,
    paddingBottom: 0,
  },
  filterTitle: {
    marginBottom: 16,
  },
  searchbar: {
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
    marginBottom: 16,
  },
  chip: {
    margin: 4,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  chartContainer: {
    marginVertical: 16,
  },
  categoryColumn: {
    flex: 0.7,
  },
});

export default SuccessRateScreen; 
