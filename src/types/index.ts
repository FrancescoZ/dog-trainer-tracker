// Dog Types
export interface Dog {
  id: string;
  name: string;
  breed: string;
  age: number;
  photo?: string;
  createdAt: number;
}

// Exercise Types
export interface Exercise {
  id: string;
  name: string;
  complexity: number; // 1-5 scale
  description: string;
  categories?: string[]; // optional tags
  createdAt: number;
}

// Training Session Types
export type LocationType = 'home' | 'park' | 'indoor' | 'outdoor' | 'other';
export type TeachingMethod = 'stimulus' | 'clicker' | 'negative-reinforcement' | 'positive-reinforcement' | 'other';

export interface ExerciseRecord {
  exerciseId: string;
  distractionLevel: number; // 1-5 scale
  distance: number; // distance from handler in meters
  repetitions: number;
  successfulCompletions: number;
  teachingMethods: TeachingMethod[];
}

// Extended version of ExerciseRecord that includes an id
export interface SessionExercise extends ExerciseRecord {
  id: string;
}

export interface TrainingSession {
  id: string;
  dogId: string;
  startTime: number;
  endTime: number;
  location: LocationType;
  exercises: ExerciseRecord[];
  notes?: string;
  weather?: string;
  timeOfDay?: string;
  createdAt: number;
  durationMinutes?: number; // Optional for backward compatibility
}

// Store/State Types
export interface DogStore {
  dogs: Dog[];
  addDog: (dog: Omit<Dog, 'id' | 'createdAt'>) => void;
  updateDog: (id: string, updates: Partial<Omit<Dog, 'id' | 'createdAt'>>) => void;
  deleteDog: (id: string) => void;
}

export interface ExerciseStore {
  exercises: Exercise[];
  addExercise: (exercise: Omit<Exercise, 'id' | 'createdAt'>) => void;
  updateExercise: (id: string, updates: Partial<Omit<Exercise, 'id' | 'createdAt'>>) => void;
  deleteExercise: (id: string) => void;
  initializeDefaultExercises: () => void;
}

export interface TrainingStore {
  sessions: TrainingSession[];
  currentSession: TrainingSession | null;
  startSession: (dogId: string, location: LocationType) => void;
  endSession: () => string | null;
  addExerciseToSession: (exerciseRecord: Omit<ExerciseRecord, 'id'>) => void;
  updateExerciseInSession: (index: number, updates: Partial<ExerciseRecord>) => void;
  updateSessionDetails: (updates: Partial<Omit<TrainingSession, 'id' | 'dogId' | 'exercises' | 'createdAt'>>) => void;
  deleteSession: (id: string) => void;
  addPastSession: (session: TrainingSession) => void;
} 
