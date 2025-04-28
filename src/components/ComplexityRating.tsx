import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

interface ComplexityRatingProps {
  level: number;
  size?: number;
  showLabel?: boolean;
}

const ComplexityRating: React.FC<ComplexityRatingProps> = ({
  level,
  size = 18, // Default size of 18
  showLabel = false,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {showLabel && (
        <Text variant="bodySmall" style={styles.label}>
          Complexity:
        </Text>
      )}
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Text
            key={star}
            style={{
              fontSize: size,
              color: star <= level ? theme.colors.primary : '#D1D1D1',
              marginRight: 2,
            }}
          >
            ★
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    marginRight: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ComplexityRating; 
