import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

interface LetterTileProps {
  letter: string;
  points: number;
}

const LetterTile: React.FC<LetterTileProps> = ({ letter, points }) => {
  // Calculate responsive tile size
  const { width } = Dimensions.get('window');
  const tileSize = Math.min(width / 10, 40); // Limit max size to 40

  return (
    <View style={[styles.tile, { width: tileSize, height: tileSize }]}>
      <Text style={[styles.letter, letter.length > 1 ? styles.smallerLetter : null]}>
        {letter}
      </Text>
      <Text style={styles.points}>{points}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  tile: {
    backgroundColor: '#fac800',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 2,
    position: 'relative',
  },
  letter: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#35235a',
  },
  smallerLetter: {
    fontSize: 12,
  },
  points: {
    position: 'absolute',
    top: 2,
    right: 3,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#555',
  },
});

export default LetterTile;
