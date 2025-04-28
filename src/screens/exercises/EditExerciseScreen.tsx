import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Chip, useTheme } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ExercisesStackParamList } from '../../navigation/ExercisesStackNavigator';
import { useExerciseStore } from '../../store/exerciseStore';
import ComplexityRating from '../../components/ComplexityRating';

type EditExerciseScreenRouteProp = RouteProp<ExercisesStackParamList, 'EditExercise'>;
type EditExerciseScreenNavigationProp = NativeStackNavigationProp<ExercisesStackParamList>;

// Suggested categories for exercises
const SUGGESTED_CATEGORIES = [
  'basic', 'obedience', 'agility', 'trick', 'walking', 
  'impulse-control', 'hunting', 'retrieving', 'social'
];

const EditExerciseScreen = () => {
  const route = useRoute<EditExerciseScreenRouteProp>();
  const navigation = useNavigation<EditExerciseScreenNavigationProp>();
  const theme = useTheme();
  const { exerciseId } = route.params;
  
  const { exercises, updateExercise } = useExerciseStore();
  const exercise = exercises.find((e) => e.id === exerciseId);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [complexity, setComplexity] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');

  // Form validation
  const [nameError, setNameError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');

  // Initialize form with exercise data
  useEffect(() => {
    if (exercise) {
      setName(exercise.name);
      setDescription(exercise.description);
      setComplexity(exercise.complexity);
      setCategories(exercise.categories || []);
    }
  }, [exercise]);

  const validateForm = (): boolean => {
    let isValid = true;

    if (!name.trim()) {
      setNameError('Exercise name is required');
      isValid = false;
    } else {
      setNameError('');
    }

    if (!description.trim()) {
      setDescriptionError('Description is required');
      isValid = false;
    } else {
      setDescriptionError('');
    }

    return isValid;
  };

  const handleUpdateExercise = () => {
    if (validateForm()) {
      updateExercise(exerciseId, {
        name,
        description,
        complexity,
        categories: categories.length > 0 ? categories : undefined,
      });
      navigation.goBack();
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim().toLowerCase())) {
      setCategories([...categories, newCategory.trim().toLowerCase()]);
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (category: string) => {
    setCategories(categories.filter((c) => c !== category));
  };

  const handleAddSuggestedCategory = (category: string) => {
    if (!categories.includes(category)) {
      setCategories([...categories, category]);
    }
  };

  // Handle case where exercise is not found
  if (!exercise) {
    return (
      <View style={styles.container}>
        <Text>Exercise not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <TextInput
          label="Exercise Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
          error={!!nameError}
        />
        {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

        <Text variant="titleMedium" style={styles.sectionTitle}>Complexity</Text>
        
        <View style={styles.complexitySelector}>
          <ComplexityRating level={complexity} size={24} />
          <View style={styles.complexityButtons}>
            {[1, 2, 3, 4, 5].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.complexityButton,
                  complexity === level && { 
                    backgroundColor: theme.colors.primary,
                  }
                ]}
                onPress={() => setComplexity(level)}
              >
                <Text 
                  style={{ 
                    color: complexity === level ? 'white' : theme.colors.text 
                  }}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TextInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          style={styles.textarea}
          error={!!descriptionError}
        />
        {descriptionError ? <Text style={styles.errorText}>{descriptionError}</Text> : null}
        
        <Text variant="titleMedium" style={styles.sectionTitle}>Categories (Optional)</Text>
        
        <View style={styles.categoriesContainer}>
          {categories.map((category, index) => (
            <Chip
              key={index}
              style={styles.categoryChip}
              onClose={() => handleRemoveCategory(category)}
            >
              {category}
            </Chip>
          ))}
        </View>

        <View style={styles.addCategoryContainer}>
          <TextInput
            label="Add Category"
            value={newCategory}
            onChangeText={setNewCategory}
            style={styles.categoryInput}
          />
          <Button onPress={handleAddCategory} mode="contained">
            Add
          </Button>
        </View>

        <Text variant="bodySmall" style={styles.suggestedTitle}>
          Suggested Categories:
        </Text>
        <ScrollView horizontal style={styles.suggestedCategories}>
          {SUGGESTED_CATEGORIES.filter(c => !categories.includes(c)).map((category, index) => (
            <Chip
              key={index}
              style={styles.suggestedChip}
              onPress={() => handleAddSuggestedCategory(category)}
            >
              {category}
            </Chip>
          ))}
        </ScrollView>

        <Button 
          mode="contained" 
          onPress={handleUpdateExercise}
          style={styles.button}
        >
          Save Changes
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  input: {
    marginBottom: 8,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  complexitySelector: {
    marginBottom: 16,
  },
  complexityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  complexityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  textarea: {
    height: 100,
    marginBottom: 8,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
    marginTop: -4,
    fontSize: 12,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryChip: {
    margin: 4,
  },
  addCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryInput: {
    flex: 1,
    marginRight: 8,
  },
  suggestedTitle: {
    marginBottom: 8,
    opacity: 0.7,
  },
  suggestedCategories: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  suggestedChip: {
    margin: 4,
  },
  button: {
    marginTop: 16,
  },
});

export default EditExerciseScreen; 
