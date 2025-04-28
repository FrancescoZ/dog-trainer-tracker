import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, FAB, Card, Chip, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ExercisesStackParamList } from '../../navigation/ExercisesStackNavigator';
import { useExerciseStore } from '../../store/exerciseStore';
import EmptyState from '../../components/EmptyState';

type ExerciseListScreenNavigationProp = NativeStackNavigationProp<ExercisesStackParamList, 'ExerciseList'>;

const ExerciseListScreen = () => {
  const navigation = useNavigation<ExerciseListScreenNavigationProp>();
  const theme = useTheme();
  const { exercises, initializeDefaultExercises } = useExerciseStore();

  // Initialize default exercises if needed
  useEffect(() => {
    if (exercises.length === 0) {
      initializeDefaultExercises();
    }
  }, []);

  const handleAddExercise = () => {
    navigation.navigate('AddExercise');
  };

  const handleExercisePress = (exerciseId: string) => {
    navigation.navigate('ExerciseDetail', { exerciseId });
  };

  // Render complexity stars
  const renderComplexity = (level: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Text key={i} style={{ color: i < level ? theme.colors.primary : '#D1D1D1' }}>
          ★
        </Text>
      );
    }
    return (
      <View style={styles.complexityContainer}>
        {stars}
      </View>
    );
  };

  // Render an exercise card
  const renderExerciseItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleExercisePress(item.id)}>
      <Card style={styles.exerciseCard}>
        <Card.Content>
          <View style={styles.exerciseHeader}>
            <Text variant="titleLarge">{item.name}</Text>
            {renderComplexity(item.complexity)}
          </View>
          <Text variant="bodyMedium" numberOfLines={2} style={styles.description}>
            {item.description}
          </Text>
          {item.categories && item.categories.length > 0 && (
            <View style={styles.categoriesContainer}>
              {item.categories.map((category, index) => (
                <Chip 
                  key={index} 
                  style={styles.categoryChip}
                  textStyle={{ fontSize: 12 }}
                >
                  {category}
                </Chip>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {exercises.length === 0 ? (
        <EmptyState
          title="No Exercises"
          message="Add your first training exercise"
          icon="fitness"
          buttonText="Add Exercise"
          onButtonPress={handleAddExercise}
        />
      ) : (
        <FlatList
          data={exercises}
          renderItem={renderExerciseItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleAddExercise}
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
  exerciseCard: {
    marginBottom: 12,
    elevation: 2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  complexityContainer: {
    flexDirection: 'row',
  },
  description: {
    marginBottom: 12,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default ExerciseListScreen; 
