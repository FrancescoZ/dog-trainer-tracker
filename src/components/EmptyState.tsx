import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  title: string;
  message: string;
  icon: keyof typeof Ionicons.glyphMap;
  buttonText?: string;
  onButtonPress?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon,
  buttonText,
  onButtonPress,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={80} color={theme.colors.primary} />
      <Text variant="headlineMedium" style={styles.title}>{title}</Text>
      <Text variant="bodyLarge" style={styles.message}>{message}</Text>
      {buttonText && onButtonPress && (
        <Button 
          mode="contained" 
          onPress={onButtonPress} 
          style={styles.button}
        >
          {buttonText}
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.7,
  },
  button: {
    marginTop: 10,
  },
});

export default EmptyState; 
