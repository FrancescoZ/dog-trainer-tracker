import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Exercise, ExerciseStore } from '../types';
import { generateId } from '../utils/helpers';

// Default exercises to initialize the app with
const DEFAULT_EXERCISES: Omit<Exercise, 'id' | 'createdAt'>[] = [
  {
    name: 'Sit',
    complexity: 1,
    description: 'Dog sits on command',
    categories: ['basic', 'obedience']
  },
  {
    name: 'Stay',
    complexity: 2,
    description: 'Dog remains in position until released',
    categories: ['basic', 'obedience']
  },
  {
    name: 'Heel',
    complexity: 3,
    description: 'Dog walks beside owner without pulling',
    categories: ['walking', 'obedience']
  },
  {
    name: 'Come',
    complexity: 2,
    description: 'Dog returns to owner when called',
    categories: ['basic', 'obedience']
  },
  {
    name: 'Fetch',
    complexity: 2,
    description: 'Dog retrieves an object and brings it back',
    categories: ['retrieving', 'play']
  },
  {
    name: 'Leave it',
    complexity: 3,
    description: 'Dog ignores an item when commanded',
    categories: ['impulse-control', 'obedience']
  }
];

// Create a custom storage object with error handling
const customStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const value = await AsyncStorage.getItem(name);
      return value;
    } catch (error) {
      console.error(`Error reading from AsyncStorage (${name}):`, error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(name, value);
    } catch (error) {
      console.error(`Error writing to AsyncStorage (${name}):`, error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(name);
    } catch (error) {
      console.error(`Error removing from AsyncStorage (${name}):`, error);
    }
  }
};

export const useExerciseStore = create<ExerciseStore>()(
  persist(
    (set, get) => ({
      exercises: [],
      
      addExercise: (exercise) => set((state) => ({
        exercises: [
          ...state.exercises,
          {
            ...exercise,
            id: generateId(),
            createdAt: Date.now(),
          },
        ],
      })),
      
      updateExercise: (id, updates) => set((state) => ({
        exercises: state.exercises.map((exercise) =>
          exercise.id === id
            ? { ...exercise, ...updates }
            : exercise
        ),
      })),
      
      deleteExercise: (id) => set((state) => ({
        exercises: state.exercises.filter((exercise) => exercise.id !== id),
      })),
      
      initializeDefaultExercises: () => {
        const { exercises } = get();
        
        // Only initialize if no exercises exist
        if (exercises.length === 0) {
          const defaultExercises = DEFAULT_EXERCISES.map(exercise => ({
            ...exercise,
            id: generateId(),
            createdAt: Date.now(),
          }));
          
          set({ exercises: defaultExercises });
        }
      }
    }),
    {
      name: 'exercise-storage',
      storage: createJSONStorage(() => customStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('Exercise store rehydrated successfully');
        } else {
          console.error('Failed to rehydrate exercise store');
        }
      }
    }
  )
); 
