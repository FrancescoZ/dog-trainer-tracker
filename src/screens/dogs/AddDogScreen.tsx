import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { Text, TextInput, Button, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { DogsStackParamList } from '../../navigation/DogsStackNavigator';
import { useDogStore } from '../../store/dogStore';

type AddDogScreenNavigationProp = NativeStackNavigationProp<DogsStackParamList, 'AddDog'>;

const AddDogScreen = () => {
  const navigation = useNavigation<AddDogScreenNavigationProp>();
  const theme = useTheme();
  const addDog = useDogStore((state) => state.addDog);

  // Form state
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);

  // Form validation
  const [nameError, setNameError] = useState('');
  const [breedError, setBreedError] = useState('');
  const [ageError, setAgeError] = useState('');

  const validateForm = (): boolean => {
    let isValid = true;

    if (!name.trim()) {
      setNameError('Name is required');
      isValid = false;
    } else {
      setNameError('');
    }

    if (!breed.trim()) {
      setBreedError('Breed is required');
      isValid = false;
    } else {
      setBreedError('');
    }

    if (!age.trim()) {
      setAgeError('Age is required');
      isValid = false;
    } else if (isNaN(Number(age)) || Number(age) <= 0) {
      setAgeError('Age must be a positive number');
      isValid = false;
    } else {
      setAgeError('');
    }

    return isValid;
  };

  const handleAddDog = () => {
    if (validateForm()) {
      addDog({
        name,
        breed,
        age: Number(age),
        photo: photo || undefined,
      });
      navigation.goBack();
    }
  };

  const handleSelectImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access camera roll is required');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <TouchableOpacity 
          style={styles.photoContainer}
          onPress={handleSelectImage}
        >
          {photo ? (
            <Image source={{ uri: photo }} style={styles.photo} />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Ionicons name="camera" size={40} color={theme.colors.primary} />
              <Text style={{ color: theme.colors.primary, marginTop: 8 }}>Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <TextInput
          label="Dog Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
          error={!!nameError}
        />
        {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

        <TextInput
          label="Breed"
          value={breed}
          onChangeText={setBreed}
          style={styles.input}
          error={!!breedError}
        />
        {breedError ? <Text style={styles.errorText}>{breedError}</Text> : null}

        <TextInput
          label="Age (in years)"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
          style={styles.input}
          error={!!ageError}
        />
        {ageError ? <Text style={styles.errorText}>{ageError}</Text> : null}

        <Button 
          mode="contained" 
          onPress={handleAddDog}
          style={styles.button}
        >
          Add Dog
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
  photoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photo: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  photoPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
    marginTop: -4,
    fontSize: 12,
  },
  button: {
    marginTop: 24,
  },
});

export default AddDogScreen; 
