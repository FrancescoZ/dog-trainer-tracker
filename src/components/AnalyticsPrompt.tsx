import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Button, Card, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

interface AnalyticsPromptProps {
  sessionId?: string;
  exerciseId?: string;
  message?: string;
}

const AnalyticsPrompt = ({
  sessionId,
  exerciseId,
  message = 'View detailed analytics to track your progress'
}: AnalyticsPromptProps) => {
  const navigation = useNavigation<any>();
  const theme = useTheme();

  const handleViewAnalytics = () => {
    if (sessionId) {
      navigation.navigate('Analytics', {
        screen: 'TrainingDetail',
        params: { sessionId }
      });
    } else if (exerciseId) {
      navigation.navigate('Analytics', {
        screen: 'ExerciseProgress',
        params: { exerciseId }
      });
    } else {
      navigation.navigate('Analytics', {
        screen: 'AnalyticsDashboard'
      });
    }
  };

  return (
    <Card style={styles.container}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.title}>
          Track Your Progress
        </Text>
        <Text variant="bodyMedium" style={styles.message}>
          {message}
        </Text>
      </Card.Content>
      <Card.Actions style={styles.actions}>
        <Button 
          mode="contained"
          onPress={handleViewAnalytics}
          icon="chart-line"
        >
          View Analytics
        </Button>
      </Card.Actions>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    marginHorizontal: 16,
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  message: {
    marginBottom: 8,
  },
  actions: {
    justifyContent: 'flex-end',
  },
});

export default AnalyticsPrompt; 
