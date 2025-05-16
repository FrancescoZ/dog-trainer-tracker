import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text, FAB, Card, Avatar, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DogsStackParamList } from '../../navigation/DogsStackNavigator';
import { useDogStore } from '../../store/dogStore';
import EmptyState from '../../components/EmptyState';
import { Dog } from '../../types';

type DogListScreenNavigationProp = NativeStackNavigationProp<DogsStackParamList, 'DogList'>;

const DogListScreen = () => {
  const navigation = useNavigation<DogListScreenNavigationProp>();
  const theme = useTheme();
  const { dogs } = useDogStore();

  const handleAddDog = () => {
    navigation.navigate('AddDog');
  };

  const handleDogPress = (dogId: string) => {
    navigation.navigate('DogDetail', { dogId });
  };

  // Render a dog card with proper typing
  const renderDogItem = ({ item }: { item: Dog }) => (
    <TouchableOpacity onPress={() => handleDogPress(item.id)}>
      <Card 
        style={styles.dogCard}
      >
        <Card.Content style={styles.dogCardContent}>
          <View style={styles.dogInfo}>
            <Text variant="titleLarge">{item.name}</Text>
            <Text variant="bodyMedium">{item.breed}</Text>
            <Text variant="bodySmall">{item.age} years old</Text>
          </View>
          <View style={styles.dogImageContainer}>
            {item.photo ? (
              <Image source={{ uri: item.photo }} style={styles.dogImage} />
            ) : (
              <Avatar.Icon size={60} icon="paw" />
            )}
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {dogs.length === 0 ? (
        <EmptyState
          title="No Dogs Added Yet"
          message="Add your first dog to start tracking their training progress"
          icon="paw"
          buttonText="Add Your First Dog"
          onButtonPress={handleAddDog}
        />
      ) : (
        <FlatList
          data={dogs}
          renderItem={renderDogItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleAddDog}
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
  dogCard: {
    marginBottom: 12,
    elevation: 2,
  },
  dogCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dogInfo: {
    flex: 1,
  },
  dogImageContainer: {
    marginLeft: 16,
  },
  dogImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default DogListScreen; 
