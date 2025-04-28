import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Card, Chip, SegmentedButtons, DataTable, Switch, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AnalyticsStackParamList } from '../../navigation/AnalyticsStackNavigator';
import { useDogStore } from '../../store/dogStore';
import { useTrainingStore } from '../../store/trainingStore';
import { formatDate, formatDuration } from '../../utils/helpers';
import { VictoryChart, VictoryBar, VictoryAxis, VictoryTheme, VictoryLine, VictoryScatter, VictoryArea, VictoryGroup, VictoryLabel } from 'victory-native';
import EmptyState from '../../components/EmptyState';

type TrainingFrequencyScreenNavigationProp = NativeStackNavigationProp<AnalyticsStackParamList, 'TrainingFrequency'>;

const { width } = Dimensions.get('window');

// Helper function to get week number
const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

// Helper function to get month name
const getMonthName = (date: Date): string => {
  return date.toLocaleString('default', { month: 'short' });
};

// Helper function to group by date
const groupByDate = (sessions: any[], groupBy: 'day' | 'week' | 'month') => {
  const groups = new Map();
  
  sessions.forEach(session => {
    const date = new Date(session.startTime);
    let key;
    
    if (groupBy === 'day') {
      key = date.setHours(0, 0, 0, 0);
    } else if (groupBy === 'week') {
      const year = date.getFullYear();
      const week = getWeekNumber(date);
      key = `${year}-W${week}`;
    } else if (groupBy === 'month') {
      const year = date.getFullYear();
      const month = date.getMonth();
      key = `${year}-${month}`;
    }
    
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        date: new Date(date),
        count: 0,
        totalDuration: 0,
        sessions: []
      });
    }
    
    const group = groups.get(key);
    group.count += 1;
    group.totalDuration += (session.endTime - session.startTime);
    group.sessions.push(session);
  });
  
  return Array.from(groups.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
};

const TrainingFrequencyScreen = () => {
  const navigation = useNavigation<TrainingFrequencyScreenNavigationProp>();
  const theme = useTheme();
  
  const { dogs, currentDogId } = useDogStore();
  const { sessions } = useTrainingStore();
  
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('90'); // '30', '90', '365', 'all' days
  const [groupBy, setGroupBy] = useState('week'); // 'day', 'week', 'month'
  const [showDuration, setShowDuration] = useState(false);
  
  // Time range options
  const timeRangeOptions = [
    { value: '30', label: '30 Days' },
    { value: '90', label: '90 Days' },
    { value: '365', label: 'Year' },
    { value: 'all', label: 'All Time' },
  ];
  
  // Group by options
  const groupByOptions = [
    { value: 'day', label: 'Daily' },
    { value: 'week', label: 'Weekly' },
    { value: 'month', label: 'Monthly' },
  ];
  
  // Filter sessions by dog and time range
  const filteredSessions = sessions.filter(session => {
    // Filter by dog
    if (selectedDogId && session.dogId !== selectedDogId) {
      return false;
    }
    
    // Filter by time range
    if (timeRange !== 'all') {
      const now = Date.now();
      const daysAgo = parseInt(timeRange, 10);
      const cutoffTime = now - (daysAgo * 24 * 60 * 60 * 1000);
      
      if (session.startTime < cutoffTime) {
        return false;
      }
    }
    
    return true;
  });
  
  // Sort sessions by date (newest first)
  const sortedSessions = [...filteredSessions].sort((a, b) => b.startTime - a.startTime);
  
  // Group sessions by selected interval
  const groupedData = React.useMemo(() => {
    return groupByDate(filteredSessions, groupBy as any);
  }, [filteredSessions, groupBy]);
  
  // Format data for charts
  const chartData = React.useMemo(() => {
    return groupedData.map(group => {
      let label;
      
      if (groupBy === 'day') {
        label = formatDate(group.date.getTime()).slice(0, 6);
      } else if (groupBy === 'week') {
        const startOfWeek = new Date(group.date);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        
        label = `${formatDate(startOfWeek.getTime()).slice(0, 6)}`;
      } else if (groupBy === 'month') {
        label = `${getMonthName(group.date)} ${group.date.getFullYear()}`;
      }
      
      return {
        x: label,
        y: showDuration 
            ? Math.round(group.totalDuration / (1000 * 60)) // Convert to minutes
            : group.count,
        date: group.date,
        count: group.count,
        duration: group.totalDuration,
        sessions: group.sessions,
      };
    });
  }, [groupedData, groupBy, showDuration]);
  
  // Calculate stats
  const stats = React.useMemo(() => {
    if (filteredSessions.length === 0) {
      return { 
        totalSessions: 0, 
        totalDuration: 0, 
        avgSessionsPerWeek: 0,
        avgDurationPerSession: 0
      };
    }
    
    const totalSessions = filteredSessions.length;
    
    const totalDuration = filteredSessions.reduce(
      (total, session) => total + (session.endTime - session.startTime), 
      0
    );
    
    // Calculate date range
    const dates = filteredSessions.map(s => new Date(s.startTime).setHours(0, 0, 0, 0));
    const earliestDate = Math.min(...dates);
    const latestDate = Math.max(...dates);
    const totalDays = Math.max(1, Math.ceil((latestDate - earliestDate) / (24 * 60 * 60 * 1000)) + 1);
    const totalWeeks = Math.max(1, totalDays / 7);
    
    const avgSessionsPerWeek = totalSessions / totalWeeks;
    const avgDurationPerSession = totalDuration / totalSessions;
    
    return { 
      totalSessions, 
      totalDuration, 
      avgSessionsPerWeek, 
      avgDurationPerSession
    };
  }, [filteredSessions]);
  
  // Handle session selection
  const handleSessionPress = (sessionId: string) => {
    navigation.navigate('TrainingDetail', { sessionId });
  };
  
  // Render empty state if no sessions
  if (filteredSessions.length === 0) {
    return (
      <EmptyState
        title="No Training Data"
        message="Complete some training sessions to see frequency analytics"
        icon="calendar"
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
        
        <Text variant="bodyMedium" style={styles.label}>Group By</Text>
        <SegmentedButtons
          value={groupBy}
          onValueChange={setGroupBy}
          buttons={groupByOptions}
          style={styles.segmentedButtons}
        />
        
        <View style={styles.switchContainer}>
          <Text variant="bodyMedium">Show Duration Instead of Count</Text>
          <Switch
            value={showDuration}
            onValueChange={setShowDuration}
          />
        </View>
      </View>
      
      {/* Overall Summary */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Training Summary
          </Text>
          
          <View style={styles.summaryRow}>
            <View style={styles.statItem}>
              <Text variant="headlineSmall">{stats.totalSessions}</Text>
              <Text variant="bodyMedium">Sessions</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineSmall">
                {Math.floor(stats.totalDuration / (1000 * 60 * 60))}h {Math.floor((stats.totalDuration % (1000 * 60 * 60)) / (1000 * 60))}m
              </Text>
              <Text variant="bodyMedium">Total Time</Text>
            </View>
          </View>
          
          <View style={[styles.summaryRow, styles.summaryRowTop]}>
            <View style={styles.statItem}>
              <Text variant="headlineSmall">{Math.round(stats.avgSessionsPerWeek * 10) / 10}</Text>
              <Text variant="bodyMedium">Sessions/Week</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineSmall">
                {Math.floor(stats.avgDurationPerSession / (1000 * 60))}m
              </Text>
              <Text variant="bodyMedium">Avg Duration</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
      
      {/* Frequency Chart */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {showDuration ? 'Training Duration' : 'Training Frequency'}
          </Text>
          
          {chartData.length > 0 ? (
            <VictoryChart
              theme={VictoryTheme.material}
              width={width - 64}
              height={300}
              domainPadding={{ x: 20 }}
              padding={{ top: 20, bottom: 60, left: 60, right: 20 }}
            >
              <VictoryAxis
                tickFormat={(x, i) => {
                  // Only show some date labels to avoid overcrowding
                  if (chartData.length <= 6 || i % Math.ceil(chartData.length / 6) === 0) {
                    return x;
                  }
                  return '';
                }}
                style={{
                  tickLabels: { fontSize: 8, angle: -45, textAnchor: 'end' }
                }}
              />
              <VictoryAxis
                dependentAxis
                tickFormat={(y) => {
                  if (typeof y !== 'number') return '';
                  return showDuration ? `${y}m` : y.toString();
                }}
                style={{
                  grid: { stroke: "lightgray", strokeWidth: 0.5 }
                }}
              />
              
              {showDuration ? (
                <VictoryGroup>
                  <VictoryArea
                    data={chartData}
                    style={{
                      data: { 
                        fill: theme.colors.primary,
                        fillOpacity: 0.1
                      }
                    }}
                  />
                  <VictoryLine
                    data={chartData}
                    style={{
                      data: { 
                        stroke: theme.colors.primary,
                        strokeWidth: 2
                      }
                    }}
                  />
                  <VictoryScatter
                    data={chartData}
                    size={4}
                    style={{
                      data: { 
                        fill: theme.colors.primary
                      }
                    }}
                  />
                </VictoryGroup>
              ) : (
                <VictoryBar
                  data={chartData}
                  style={{
                    data: { 
                      fill: theme.colors.primary
                    }
                  }}
                  labels={({ datum }) => `${datum.y}`}
                  labelComponent={
                    <VictoryLabel 
                      dy={-10} 
                      style={{ fontSize: 10 }}
                    />
                  }
                />
              )}
            </VictoryChart>
          ) : (
            <Text style={styles.noDataText}>Not enough data to display chart</Text>
          )}
          
          <Text variant="bodySmall" style={styles.chartNote}>
            {showDuration 
              ? 'Chart shows training minutes per period'
              : 'Chart shows training sessions per period'
            }
          </Text>
        </Card.Content>
      </Card>
      
      {/* Recent Sessions */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Recent Sessions
          </Text>
          
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Date</DataTable.Title>
              <DataTable.Title>Dog</DataTable.Title>
              <DataTable.Title numeric>Duration</DataTable.Title>
              <DataTable.Title numeric>Exercises</DataTable.Title>
            </DataTable.Header>
            
            {sortedSessions.slice(0, 10).map(session => {
              const dog = dogs.find(d => d.id === session.dogId);
              const duration = session.endTime - session.startTime;
              const exerciseCount = session.exercises.length;
              
              return (
                <DataTable.Row 
                  key={session.id}
                  onPress={() => handleSessionPress(session.id)}
                >
                  <DataTable.Cell>{formatDate(session.startTime)}</DataTable.Cell>
                  <DataTable.Cell>{dog ? dog.name : 'Unknown'}</DataTable.Cell>
                  <DataTable.Cell numeric>
                    {Math.floor(duration / (1000 * 60))}m
                  </DataTable.Cell>
                  <DataTable.Cell numeric>{exerciseCount}</DataTable.Cell>
                </DataTable.Row>
              );
            })}
            
            {sortedSessions.length > 10 && (
              <DataTable.Pagination
                page={0}
                numberOfPages={Math.ceil(sortedSessions.length / 10)}
                onPageChange={() => {}}
                label={`1-10 of ${sortedSessions.length}`}
                showFastPaginationControls
              />
            )}
          </DataTable>
        </Card.Content>
      </Card>
      
      {/* Training Streaks */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Training Patterns
          </Text>
          
          <View style={styles.trainingPatterns}>
            {/* Calculate and display weekly breakdown */}
            {(() => {
              const dayCount = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
              
              filteredSessions.forEach(session => {
                const day = new Date(session.startTime).getDay();
                dayCount[day]++;
              });
              
              const maxCount = Math.max(...dayCount);
              
              const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              
              return (
                <View style={styles.weekdayBreakdown}>
                  <Text style={styles.patternTitle}>Most Frequent Training Days</Text>
                  <View style={styles.daysContainer}>
                    {days.map((day, index) => (
                      <View key={day} style={styles.dayColumn}>
                        <View 
                          style={[
                            styles.dayBar, 
                            { 
                              height: maxCount > 0 ? (dayCount[index] / maxCount) * 100 : 0,
                              backgroundColor: theme.colors.primary
                            }
                          ]} 
                        />
                        <Text style={styles.dayLabel}>{day}</Text>
                        <Text style={styles.dayCount}>{dayCount[index]}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })()}
          </View>
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  summaryRowTop: {
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  chartNote: {
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.6,
  },
  noDataText: {
    textAlign: 'center',
    marginVertical: 40,
    opacity: 0.5,
  },
  trainingPatterns: {
    marginTop: 8,
  },
  patternTitle: {
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  weekdayBreakdown: {
    marginBottom: 24,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 150,
    alignItems: 'flex-end',
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  dayBar: {
    width: 20,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  dayLabel: {
    marginTop: 4,
    fontSize: 12,
  },
  dayCount: {
    fontSize: 10,
    opacity: 0.7,
  },
});

export default TrainingFrequencyScreen; 
