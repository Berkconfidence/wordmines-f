import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { INITIAL_BOARD } from '../constants/gameBoard';

const GameBoard: React.FC = () => {
  // Özel hücre tiplerini göstermek için yardımcı fonksiyon
  const renderCellContent = (cellValue: string) => {
    if (cellValue === "★") {
      return <Text style={styles.starCell}>★</Text>;
    }
    
    if (cellValue.includes('word')) {
      const multiplier = cellValue.split('*')[1];
      return (
        <View style={[styles.specialCell, styles.wordMultiplier]}>
          <Text style={styles.multiplierText}>W</Text>
          <Text style={styles.multiplierValue}>×{multiplier}</Text>
        </View>
      );
    }
    
    if (cellValue.includes('letter')) {
      const multiplier = cellValue.split('*')[1];
      return (
        <View style={[styles.specialCell, styles.letterMultiplier]}>
          <Text style={styles.multiplierText}>L</Text>
          <Text style={styles.multiplierValue}>×{multiplier}</Text>
        </View>
      );
    }
    
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.board}>
        {INITIAL_BOARD.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.row}>
            {row.map((cell, colIndex) => (
              <View 
                key={`cell-${rowIndex}-${colIndex}`} 
                style={[
                  styles.cell,
                  cell.includes('word') ? styles.wordCell : null,
                  cell.includes('letter') ? styles.letterCell : null,
                  cell === "★" ? styles.centerCell : null,
                  cell === "" ? styles.normalCell : null
                ]}
              >
                {renderCellContent(cell)}
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  board: {
    borderWidth: 0.5,
    borderColor: '#333',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: 24,
    height: 24,
    borderWidth: 0.5,
    borderColor: '#aaa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  normalCell: {
    backgroundColor: '#f5f5dc', // Bej renk
  },
  wordCell: {
    backgroundColor: '#ff9999', // Kelime çarpanı için kırmızı-pembe ton
  },
  letterCell: {
    backgroundColor: '#99ccff', // Harf çarpanı için açık mavi
  },
  centerCell: {
    backgroundColor: '#ffcc99', // Merkez hücre için turuncu
  },
  specialCell: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordMultiplier: {
    backgroundColor: '#ff9999',
  },
  letterMultiplier: {
    backgroundColor: '#99ccff',
  },
  multiplierText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  multiplierValue: {
    fontSize: 8,
  },
  starCell: {
    fontSize: 18,
    fontWeight: 'bold',
  }
});

export default GameBoard;
