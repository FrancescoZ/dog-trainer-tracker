import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrainingSession, TrainingStore, ExerciseRecord, LocationType } from '../types';
import { generateId } from '../utils/helpers';

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

export const useTrainingStore = create<TrainingStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSession: null,
      
      startSession: (dogId, location) => set({
        currentSession: {
          id: generateId(),
          dogId,
          startTime: Date.now(),
          endTime: 0, // Will be set when the session ends
          location,
          exercises: [],
          createdAt: Date.now(),
        },
      }),
      
      endSession: () => {
        const { currentSession, sessions } = get();
        
        if (!currentSession) return null;
        
        const completedSession: TrainingSession = {
          ...currentSession,
          endTime: Date.now(),
        };
        
        set({
          sessions: [...sessions, completedSession],
          currentSession: null,
        });
        
        return completedSession.id;
      },
      
      addExerciseToSession: (exerciseRecord) => set((state) => {
        if (!state.currentSession) return state;
        
        return {
          currentSession: {
            ...state.currentSession,
            exercises: [
              ...state.currentSession.exercises,
              exerciseRecord,
            ],
          },
        };
      }),
      
      updateExerciseInSession: (index, updates) => set((state) => {
        if (!state.currentSession) return state;
        
        const updatedExercises = [...state.currentSession.exercises];
        updatedExercises[index] = {
          ...updatedExercises[index],
          ...updates,
        };
        
        return {
          currentSession: {
            ...state.currentSession,
            exercises: updatedExercises,
          },
        };
      }),
      
      updateSessionDetails: (updates) => set((state) => {
        if (!state.currentSession) return state;
        
        return {
          currentSession: {
            ...state.currentSession,
            ...updates,
          },
        };
      }),
      
      deleteSession: (id) => set((state) => ({
        sessions: state.sessions.filter((session) => session.id !== id),
      })),

      // Add a new method to directly add a past session
      addPastSession: (session: TrainingSession) => set((state) => ({
        sessions: [...state.sessions, session],
      })),
    }),
    {
      name: 'training-storage',
      storage: createJSONStorage(() => customStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('Training store rehydrated successfully');
        } else {
          console.error('Failed to rehydrate training store');
        }
      }
    }
  )
); 
