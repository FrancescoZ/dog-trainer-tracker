import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, FAB, Card, Chip, Avatar, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TrainingStackParamList } from '../../navigation/TrainingStackNavigator';
import { useDogStore } from '../../store/dogStore';
import { useTrainingStore } from '../../store/trainingStore';
import { TrainingSession } from '../../types';
import { formatDate, formatDuration } from '../../utils/helpers';
import EmptyState from '../../components/EmptyState';

type TrainingHistoryScreenNavigationProp = NativeStackNavigationProp<TrainingStackParamList, 'Training'>;

const TrainingHistoryScreen = () => {
  const navigation = useNavigation<TrainingHistoryScreenNavigationProp>();
  const theme = useTheme();
  const { sessions, deleteSession } = useTrainingStore();
  const { dogs } = useDogStore();

  // Sort sessions by date (most recent first)
  const sortedSessions = [...sessions].sort((a, b) => b.startTime - a.startTime);

  // Clean up invalid sessions (ones without a valid dog) on mount
  useEffect(() => {
    console.log('sessions', sessions, dogs);
    if (sessions && dogs.length > 0) {
      const invalidSessions = sessions.filter(session => 
        !session.dogId || !dogs.some(dog => dog.id === session.dogId)
      );
      console.log('invalidSessions', invalidSessions);
      if (invalidSessions.length > 0) {
        console.log(`Found ${invalidSessions.length} invalid sessions without a valid dog. Cleaning up...`);
        
        // Delete each invalid session
        invalidSessions.forEach(session => {
          console.log(`Removing invalid session: ${session.id}`);
          deleteSession(session.id);
        });
      }
    }
  }, [sessions, dogs, deleteSession]);
  

  const getDogName = (dogId: string): string => {
    const dog = dogs.find(d => d.id === dogId);
    return dog ? dog.name : 'Unknown Dog';
  };

  const handleStartTraining = () => {
    navigation.navigate('TrainingSession', {});
  };

  const handleSessionPress = (sessionId: string) => {
    navigation.navigate('TrainingDetail', { sessionId });
  };

  const renderSessionItem = ({ item }: { item: TrainingSession }) => {
    const duration = item.endTime - item.startTime;
    const exerciseCount = item.exercises.length;
    const dogName = getDogName(item.dogId);
    
    return (
      <TouchableOpacity onPress={() => handleSessionPress(item.id)}>
        <Card style={styles.sessionCard}>
          <Card.Content>
            <View style={styles.sessionHeader}>
              <View style={styles.sessionInfo}>
                <Text variant="titleMedium">{formatDate(item.startTime)}</Text>
                <Text variant="bodyMedium" style={styles.dogName}>
                  {dogName}
                </Text>
              </View>
              <View style={styles.sessionStats}>
                <Text variant="bodySmall">{formatDuration(duration)}</Text>
                <Text variant="bodySmall">{exerciseCount} exercises</Text>
              </View>
            </View>
            
            <View style={styles.locationContainer}>
              <Chip icon="map-marker" style={styles.locationChip}>
                {item.location.charAt(0).toUpperCase() + item.location.slice(1)}
              </Chip>
              {item.weather && (
                <Chip icon="weather-partly-cloudy" style={styles.weatherChip}>
                  {item.weather}
                </Chip>
              )}
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {sessions.length === 0 ? (
        <EmptyState
          title="No Training Sessions Yet"
          message="Start your first training session to track your dog's progress"
          icon="fitness"
          buttonText="Start Training"
          onButtonPress={handleStartTraining}
        />
      ) : (
        <FlatList
          data={sortedSessions}
          renderItem={renderSessionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleStartTraining}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  sessionCard: {
    marginBottom: 12,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionStats: {
    alignItems: 'flex-end',
  },
  dogName: {
    opacity: 0.7,
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
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default TrainingHistoryScreen; 
