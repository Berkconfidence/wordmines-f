import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { INITIAL_BOARD } from '../constants/gameBoard';
import LetterTile from './LetterTile';
import { getRandomLetters } from '../constants/letterDistribution';
import { LETTER_DISTRIBUTION } from '../constants/letterDistribution';
import { isValidWordSync } from '../utils/wordValidator';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '@/config';

interface GameBoardProps {
  roomId?: string;
  userId?: string;
}

interface PlacedLetter {
  letter: string;
  points: number;
  position: { row: number; col: number };
}

// Kelimenin yönünü belirten enum
enum WordDirection {
  NONE = 'none',
  HORIZONTAL = 'horizontal', // Yatay (sağa doğru)
  VERTICAL = 'vertical',     // Dikey (aşağı doğru)
  DIAGONAL_DOWN = 'diagonal_down', // Çapraz aşağı (sağ alt)
  DIAGONAL_UP = 'diagonal_up'      // Çapraz yukarı (sağ üst)
}

// Kelime doğrulama durumunu temsil eden enum
enum WordValidationState {
  NONE = 'none',
  VALID = 'valid',
  INVALID = 'invalid',
  CHECKING = 'checking'
}

const GameBoard: React.FC<GameBoardProps> = ({ roomId, userId }) => {
  const [playerTiles, setPlayerTiles] = useState<{ letter: string; points: number }[]>([]);
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [placedLetters, setPlacedLetters] = useState<PlacedLetter[]>([]);
  const [wordDirection, setWordDirection] = useState<WordDirection>(WordDirection.NONE);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [wordValidation, setWordValidation] = useState<WordValidationState>(WordValidationState.NONE);
  const { width: windowWidth } = Dimensions.get('window');
  
  // Calculate responsive sizes
  const cellSize = Math.min(windowWidth / 17, 24); // Limiting to max 24px
  const boardContainerWidth = (cellSize + 3) * 15; // 15 cells per row + margins
  /*
  useEffect(() => {
    // Initialize with 7 random letters
    setPlayerTiles(getRandomLetters(7));
  }, []);
  */

  useEffect(() => {
    const fetchLetters = async () => {
        try {
          console.log("Merhaba")
            const res = await fetch(`${API_URL}/letters?userId=${userId}&roomId=${roomId}`);
            const data: string[] = await res.json(); // ["A", "İ", "K", ...]
            // Her harf için puan bilgisini ekle
            const tiles = data.map(letter => {
                const info = LETTER_DISTRIBUTION.find(l => l.letter === letter);
                return {
                    letter,
                    points: info ? info.points : 0
                };
            });
            setPlayerTiles(tiles);
        } catch (error) {
            console.error("Harfler alınamadı", error);
        }
    };

    fetchLetters();
}, []);

  // Log roomId and userId when they change
  useEffect(() => {
    if (roomId && userId) {
      console.log(`GameBoard initialized with roomId: ${roomId}, userId: ${userId}`);
      // Burada oyun odasına bağlanma işlemleri yapılabilir
    }
  }, [roomId, userId]);

  // Merkez hücrenin koordinatları (7,7) - 15x15 board için orta nokta
  const centerCell = { row: 7, col: 7 };
  
  // Handle tile selection
  const handleTileSelect = (index: number) => {
    setSelectedTileIndex(index === selectedTileIndex ? null : index);
  };

  // İkinci harf için geçerli hücreleri kontrol eden fonksiyon
  const isValidSecondLetterPosition = (rowIndex: number, colIndex: number): boolean => {
    // İlk harf merkezdedir (centerCell)
    const isRightCell = rowIndex === centerCell.row && colIndex === centerCell.col + 1;
    const isBottomCell = rowIndex === centerCell.row + 1 && colIndex === centerCell.col;
    const isBottomRightCell = rowIndex === centerCell.row + 1 && colIndex === centerCell.col + 1;
    const isTopRightCell = rowIndex === centerCell.row - 1 && colIndex === centerCell.col + 1;
    
    return isRightCell || isBottomCell || isBottomRightCell || isTopRightCell;
  };

  // İkinci harfin konumuna göre kelime yönünü belirleyen fonksiyon
  const determineWordDirection = (rowIndex: number, colIndex: number): WordDirection => {
    if (rowIndex === centerCell.row && colIndex === centerCell.col + 1) {
      return WordDirection.HORIZONTAL; // Sağa doğru
    } else if (rowIndex === centerCell.row + 1 && colIndex === centerCell.col) {
      return WordDirection.VERTICAL; // Aşağı doğru
    } else if (rowIndex === centerCell.row + 1 && colIndex === centerCell.col + 1) {
      return WordDirection.DIAGONAL_DOWN; // Sağ alt (çapraz aşağı)
    } else if (rowIndex === centerCell.row - 1 && colIndex === centerCell.col + 1) {
      return WordDirection.DIAGONAL_UP; // Sağ üst (çapraz yukarı)
    }
    return WordDirection.NONE;
  };

  // Mevcut kelime yönüne göre geçerli bir sonraki konumu kontrol eden fonksiyon
  const isValidNextPosition = (rowIndex: number, colIndex: number): boolean => {
    // Yerleştirilmiş son harfi bulalım
    const lastPlacedLetter = placedLetters[placedLetters.length - 1];
    
    switch (wordDirection) {
      case WordDirection.HORIZONTAL:
        // Yatay yönde devam ediyor (son harfin sağına)
        return rowIndex === lastPlacedLetter.position.row && 
               colIndex === lastPlacedLetter.position.col + 1;
      
      case WordDirection.VERTICAL:
        // Dikey yönde devam ediyor (son harfin altına)
        return colIndex === lastPlacedLetter.position.col && 
               rowIndex === lastPlacedLetter.position.row + 1;
      
      case WordDirection.DIAGONAL_DOWN:
        // Aşağı çaprazda devam ediyor (son harfin sağ altına)
        return rowIndex === lastPlacedLetter.position.row + 1 && 
               colIndex === lastPlacedLetter.position.col + 1;
      
      case WordDirection.DIAGONAL_UP:
        // Yukarı çaprazda devam ediyor (son harfin sağ üstüne)
        return rowIndex === lastPlacedLetter.position.row - 1 && 
               colIndex === lastPlacedLetter.position.col + 1;
      
      default:
        return false;
    }
  };

  // Harfin yerleştirilebileceği kareleri hesaplayan fonksiyon
  const calculatePlaceablePositions = (): {row: number, col: number}[] => {
    // Hiç harf yerleştirilmemişse, sadece merkez hücre kullanılabilir
    if (placedLetters.length === 0) {
      return [centerCell];
    }
    
    // Sadece bir harf varsa (merkezdeki ilk harf), ikinci harf için 4 pozisyon kullanılabilir
    if (placedLetters.length === 1) {
      return [
        { row: centerCell.row, col: centerCell.col + 1 }, // Sağ
        { row: centerCell.row + 1, col: centerCell.col }, // Alt
        { row: centerCell.row + 1, col: centerCell.col + 1 }, // Sağ alt
        { row: centerCell.row - 1, col: centerCell.col + 1 }, // Sağ üst
      ];
    }
    
    // İki veya daha fazla harf yerleştirilmiş ve yön belirlenmiş
    const lastLetter = placedLetters[placedLetters.length - 1];
    const nextPosition = { row: lastLetter.position.row, col: lastLetter.position.col };
    
    switch (wordDirection) {
      case WordDirection.HORIZONTAL:
        nextPosition.col += 1; // Sağa doğru
        break;
      case WordDirection.VERTICAL:
        nextPosition.row += 1; // Aşağı doğru
        break;
      case WordDirection.DIAGONAL_DOWN:
        nextPosition.row += 1;
        nextPosition.col += 1; // Sağ alt çapraz
        break;
      case WordDirection.DIAGONAL_UP:
        nextPosition.row -= 1;
        nextPosition.col += 1; // Sağ üst çapraz
        break;
      default:
        return [];
    }
    
    // Boardun sınırları içinde olduğundan emin olalım (15x15 board)
    if (nextPosition.row >= 0 && nextPosition.row < 15 && 
        nextPosition.col >= 0 && nextPosition.col < 15) {
      // Pozisyon boş mu kontrol edelim
      const isOccupied = placedLetters.some(
        item => item.position.row === nextPosition.row && item.position.col === nextPosition.col
      );
      
      if (!isOccupied) {
        return [nextPosition];
      }
    }
    
    return []; // Yerleştirilebilecek kare yoksa boş dizi döndür
  };
  
  // Harfin yerleştirilebileceği konumlar
  const placeablePositions = selectedTileIndex !== null ? calculatePlaceablePositions() : [];
  
  // Bir hücrenin yerleştirilebilir olup olmadığını kontrol et
  const isPlaceablePosition = (rowIndex: number, colIndex: number): boolean => {
    return placeablePositions.some(pos => pos.row === rowIndex && pos.col === colIndex);
  };

  // Handle cell selection for placing a letter
  const handleCellSelect = (rowIndex: number, colIndex: number) => {
    // Check if a tile is selected
    if(selectedTileIndex !== null) {
      const selectedTile = playerTiles[selectedTileIndex];
      
      // İlk harf yıldıza konulmalı kontrolü
      if(placedLetters.length === 0 && (rowIndex !== centerCell.row || colIndex !== centerCell.col)) {
        // İlk harfin merkeze koyulması gerekiyor, başka bir yere koyulamaz
        return;
      }
      
      // İkinci harf kontrolü
      if(placedLetters.length === 1) {
        if(!isValidSecondLetterPosition(rowIndex, colIndex)) {
          // İkinci harf sadece belirli pozisyonlara konulabilir
          return;
        }
        // Kelime yönünü belirle
        const direction = determineWordDirection(rowIndex, colIndex);
        setWordDirection(direction);
      }
      
      // Üçüncü ve sonraki harfler için yön kontrolü
      if(placedLetters.length >= 2) {
        if(!isValidNextPosition(rowIndex, colIndex)) {
          // Sonraki harf, belirlenen yönde devam etmeli
          return;
        }
      }

      // Check if the cell is empty
      const isOccupied = placedLetters.some(
        item => item.position.row === rowIndex && item.position.col === colIndex
      );
      
      if(!isOccupied) {
        // Place the letter
        const newPlacedLetters = [...placedLetters, {
          letter: selectedTile.letter,
          points: selectedTile.points,
          position: { row: rowIndex, col: colIndex }
        }];
        
        setPlacedLetters(newPlacedLetters);
        
        // Remove the letter from player tiles
        const newPlayerTiles = [...playerTiles];
        newPlayerTiles.splice(selectedTileIndex, 1);
        setPlayerTiles(newPlayerTiles);
        
        // Reset selection
        setSelectedTileIndex(null);
      }
    } else {
      // Check if there's a letter at this position to remove
      const letterIndex = placedLetters.findIndex(
        item => item.position.row === rowIndex && item.position.col === colIndex
      );
      
      if(letterIndex !== -1) {
        // Son harf mi kontrol et (son harfi kaldırmak izin veriliyor)
        if(letterIndex === placedLetters.length - 1) {
          // Return the letter to player tiles
          const removedLetter = placedLetters[letterIndex];
          const newPlayerTiles = [...playerTiles, {
            letter: removedLetter.letter,
            points: removedLetter.points
          }];
          
          // Remove from placed letters
          const newPlacedLetters = [...placedLetters];
          newPlacedLetters.splice(letterIndex, 1);
          
          setPlayerTiles(newPlayerTiles);
          setPlacedLetters(newPlacedLetters);
          
          // Eğer kalan harf sayısı 1 ise, yön sıfırlanmalı
          if(newPlacedLetters.length === 1) {
            setWordDirection(WordDirection.NONE);
          }
        }
      }
    }
  };

  // Find a placed letter at a specific position
  const getPlacedLetterAt = (rowIndex: number, colIndex: number) => {
    return placedLetters.find(
      item => item.position.row === rowIndex && item.position.col === colIndex
    );
  };

  // Yerleştirilen harflerden kelime oluşturulup doğruluğunu kontrol eden useEffect
  useEffect(() => {
    if (placedLetters.length === 0) {
      setCurrentWord('');
      setWordValidation(WordValidationState.NONE);
      return;
    }
    
    // Kelimeyi oluştur
    const word = placedLetters.map(letter => letter.letter).join('');
    setCurrentWord(word);
    
    // Kelimeyi doğrula (en az 2 harf olmalı)
    if (word.length >= 2) {
      setWordValidation(WordValidationState.CHECKING);
      
      // Gerçek uygulamada isValidWord yerine isValidWordSync kullanılabilir
      const isValid = isValidWordSync(word);
      setWordValidation(isValid ? WordValidationState.VALID : WordValidationState.INVALID);
    } else {
      setWordValidation(WordValidationState.NONE);
    }
  }, [placedLetters]);

  // Onaylama işlemi
  const handleConfirm = () => {
    if (wordValidation === WordValidationState.VALID) {
      // Puanlama yapılabilir (burada yapmıyoruz)
      console.log(`Confirmed word "${currentWord}" in room ${roomId} by user ${userId}`);
      
      // Yerleştirilen harfleri temizle
      setPlacedLetters([]);
      setWordDirection(WordDirection.NONE);
      setCurrentWord('');
      setWordValidation(WordValidationState.NONE);
      
      // Yeni harfler çek, mevcut harflere 7'ye tamamlayacak kadar ekle
      const newLettersNeeded = 7 - playerTiles.length;
      if (newLettersNeeded > 0) {
        const newLetters = getRandomLetters(newLettersNeeded);
        setPlayerTiles([...playerTiles, ...newLetters]);
      }
    }
  };

  // Kelime doğrulama durumuna göre çerçeve rengini belirle
  const getLetterFrameStyle = () => {
    switch (wordValidation) {
      case WordValidationState.VALID:
        return styles.validWordFrame;
      case WordValidationState.INVALID:
        return styles.invalidWordFrame;
      default:
        return null;
    }
  };

  // Özel hücre tiplerini göstermek için yardımcı fonksiyon
  const renderCellContent = (cellValue: string, rowIndex: number, colIndex: number) => {
    // Check if there's a placed letter at this position
    const placedLetter = getPlacedLetterAt(rowIndex, colIndex);
    if(placedLetter) {
      return (
        <View style={[
          styles.placedLetterContainer,
          getLetterFrameStyle()
        ]}>
          <Text style={styles.placedLetter}>{placedLetter.letter}</Text>
          <Text style={styles.placedPoints}>{placedLetter.points}</Text>
        </View>
      );
    }
    
    if(cellValue === "★") {
      return <Text style={styles.starCell}>★</Text>;
    }
    
    if(cellValue.includes('word')) {
      const multiplier = cellValue.split('*')[1];
      if(multiplier === '2') {
        return (
          <View style={[styles.specialCell, styles.wordMultiplier2]}>
            <Text style={styles.multiplierText}>W</Text>
            <Text style={styles.multiplierValue}>{multiplier}</Text>
          </View>
        );
      }
      if(multiplier === '3') {
        return (
          <View style={[styles.specialCell, styles.wordMultiplier3]}>
            <Text style={styles.multiplierText}>W</Text>
            <Text style={styles.multiplierValue}>{multiplier}</Text>
          </View>
        );
      }
    }
    
    if(cellValue.includes('letter')) {
      const multiplier = cellValue.split('*')[1];
      if(multiplier === '2') {
        return (
          <View style={[styles.specialCell, styles.letterMultiplier2]}>
            <Text style={styles.multiplierText}>L</Text>
            <Text style={styles.multiplierValue}>{multiplier}</Text>
          </View>
        );
      }
      if(multiplier === '3') {
        return (
          <View style={[styles.specialCell, styles.letterMultiplier3]}>
            <Text style={styles.multiplierText}>L</Text>
            <Text style={styles.multiplierValue}>{multiplier}</Text>
          </View>
        );
      }
    }
    
    return null;
  };

  return (
    <View style={styles.container}>
      {/* Room Info (Optional) */}
      {roomId && userId && (
        <View style={styles.roomInfoContainer}>
          <Text style={styles.roomInfoText}>Oda: {roomId}</Text>
          <Text style={styles.roomInfoText}>Oyuncu: {userId}</Text>
        </View>
      )}
      {/* Game board */}
      <View style={[styles.boardContainer, { width: boardContainerWidth }]}>
        <View style={styles.board}>
          {INITIAL_BOARD.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.row}>
              {row.map((cell, colIndex) => (
                <TouchableOpacity 
                  key={`cell-${rowIndex}-${colIndex}`}
                  onPress={() => handleCellSelect(rowIndex, colIndex)}
                  style={[
                    styles.cell,
                    { width: cellSize, height: cellSize },
                    cell.includes('word') ? styles.wordCell : null,
                    cell.includes('letter') ? styles.letterCell : null,
                    cell === "★" ? styles.centerCell : null,
                    cell === "" ? styles.normalCell : null,
                    isPlaceablePosition(rowIndex, colIndex) ? styles.placeableCell : null,
                  ]}
                >
                  {renderCellContent(cell, rowIndex, colIndex)}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Kelime kontrolü ve onay butonu */}
      <View style={styles.controlsContainer}>
        <View style={styles.wordInfoContainer}>
          <Text style={styles.currentWordLabel}>Kelime: </Text>
          <Text style={[
            styles.currentWord,
            wordValidation === WordValidationState.VALID ? styles.validWord : null,
            wordValidation === WordValidationState.INVALID ? styles.invalidWord : null,
          ]}>
            {currentWord}
          </Text>
          {wordValidation === WordValidationState.CHECKING && <ActivityIndicator size="small" />}
        </View>
        
        <TouchableOpacity 
          style={[
            styles.confirmButton,
            wordValidation !== WordValidationState.VALID ? styles.confirmButtonDisabled : null
          ]}
          onPress={handleConfirm}
          disabled={wordValidation !== WordValidationState.VALID}
        >
          <Ionicons name="checkmark-circle" size={22} color={wordValidation === WordValidationState.VALID ? "#fff" : "#999"} />
          <Text style={[styles.confirmButtonText, wordValidation !== WordValidationState.VALID ? styles.confirmButtonTextDisabled : null]}>
            Onayla
          </Text>
        </TouchableOpacity>
      </View>

      {/* Letter tiles */}
      <View style={styles.tilesContainer}>
        {playerTiles.map((tile, index) => (
          <TouchableOpacity 
            key={`tile-${index}`}
            onPress={() => handleTileSelect(index)}
            style={[
              styles.tileWrapper,
              selectedTileIndex === index ? styles.selectedTile : null
            ]}
          >
            <LetterTile
              letter={tile.letter}
              points={tile.points}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  board: {
    borderWidth: 0.5,
    borderColor: '#333',
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    backgroundColor: '#a9ddfe',
  },
  cell: {
    borderWidth: 0.5,
    borderRadius: 6,
    borderColor: '#e1f0fa',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 1,
  },
  normalCell: {
    backgroundColor: '#e1f0fa',
  },
  wordCell: {
    backgroundColor: '#ff9999',
  },
  letterCell: {
    backgroundColor: '#6ebefa',
  },
  centerCell: {
    backgroundColor: '#ffcc99',
  },
  specialCell: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  wordMultiplier2: {
    backgroundColor: '#82e1af',
  },
  wordMultiplier3: {
    backgroundColor: '#bcaa98',
  },
  letterMultiplier2: {
    backgroundColor: '#6ebefa',
  },
  letterMultiplier3: {
    backgroundColor: '#dea09d',
  },
  multiplierText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  multiplierValue: {
    position: 'absolute',
    top: 1,
    right: 2,
    fontSize: 7,
    fontWeight: 'bold',
    color: '#fff',
  },
  starCell: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  tilesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    padding: 5,
    marginTop: 10,
    maxWidth: '95%',
  },
  tileWrapper: {
    margin: 2,
  },
  selectedTile: {
    transform: [{ scale: 1.1 }],
    borderWidth: 2,
    borderColor: '#35235a',
    borderRadius: 6,
  },
  placedLetterContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fac800',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  placedLetter: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#35235a',
  },
  placedPoints: {
    position: 'absolute',
    top: 0,
    right: 1,
    fontSize: 6,
    fontWeight: 'bold',
    color: '#555',
  },
  placeableCell: {
    borderWidth: 2,
    borderColor: '#2ecc71', // Yeşil renkte çerçeve
    shadowColor: '#2ecc71',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  // Kelime doğrulama ve onay butonu için stiller
  validWordFrame: {
    borderWidth: 2,
    borderColor: '#27ae60', // Yeşil çerçeve
  },
  invalidWordFrame: {
    borderWidth: 2,
    borderColor: '#e74c3c', // Kırmızı çerçeve
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
    marginTop: 10,
    marginBottom: 10,
    padding: 5,
  },
  wordInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentWordLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentWord: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 50,
  },
  validWord: {
    color: '#27ae60',
  },
  invalidWord: {
    color: '#e74c3c',
  },
  confirmButton: {
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    elevation: 2,
    position: 'absolute',
    left: 5,
    bottom: 5,
  },
  confirmButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 5,
  },
  confirmButtonTextDisabled: {
    color: '#999',
  },
  roomInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  roomInfoText: {
    fontSize: 12,
    color: '#555',
  },
  });

export default GameBoard;
