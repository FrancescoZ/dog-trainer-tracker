import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dog, DogStore } from '../types';
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

export const useDogStore = create<DogStore>()(
  persist(
    (set) => ({
      dogs: [],
      
      addDog: (dog) => set((state) => {
        const newDog = {
          ...dog,
          id: generateId(),
          createdAt: Date.now(),
        };
        
        return {
          dogs: [...state.dogs, newDog],
        };
      }),
      
      updateDog: (id, updates) => set((state) => ({
        dogs: state.dogs.map((dog) => 
          dog.id === id ? { ...dog, ...updates } : dog
        ),
      })),
      
      deleteDog: (id) => set((state) => ({
        dogs: state.dogs.filter((dog) => dog.id !== id),
      })),
    }),
    {
      name: 'dog-storage',
      storage: createJSONStorage(() => customStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('Dog store rehydrated successfully');
        } else {
          console.error('Failed to rehydrate dog store');
        }
      }
    }
  )
); 
