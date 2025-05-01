import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import LetterTile from './LetterTile';
import { LETTER_DISTRIBUTION } from '../constants/letterDistribution';
import { isValidWordSync } from '../utils/wordValidator';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '@/config';
import { sendMove, listenForBoardUpdates } from '../services/socketService';

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
  const [matrixState, setMatrixState] = useState<any[][]>([]);
  const [wordDirection, setWordDirection] = useState<WordDirection>(WordDirection.NONE);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [wordValidation, setWordValidation] = useState<WordValidationState>(WordValidationState.NONE);
  const { width: windowWidth } = Dimensions.get('window');
  const [isUsersTurn, setIsUsersTurn] = useState<boolean>(false);
  const [boardListener, setBoardListener] = useState<(() => void) | null>(null);

  // Calculate responsive sizes
  const cellSize = Math.min(windowWidth / 17, 24); // Limiting to max 24px
  const boardContainerWidth = (cellSize + 3) * 15; // 15 cells per row + margins

  //Tahtayı çekme işlemleri
  useEffect(() => {
    const fetchBoardMatrix = async () => {
      try {
        const res = await fetch(`${API_URL}/gameboard/matrix?roomId=${roomId}`);
        const matrix = await res.json();
        setMatrixState(matrix);
      } catch (error) {
        console.error("Tahta verisi alınamadı", error);
      }
    };
  
    if (roomId) {
      fetchBoardMatrix();
    }
  }, [roomId]);

  // WebSocket ile board güncellemelerini dinle
  useEffect(() => {
    if (!roomId || !userId) return;
    // Önceki dinleyiciyi kaldır
    if (boardListener) boardListener();
    const unsubscribe = listenForBoardUpdates(roomId, async (matrix) => {
      setMatrixState(matrix);
      // Hamle sonrası harfleri güncelle
      try {
        const res = await fetch(`${API_URL}/letters?userId=${userId}&roomId=${roomId}`);
        const data: string[] = await res.json();
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
    });
    setBoardListener(() => unsubscribe);
    return () => {
      unsubscribe();
    };
  }, [roomId, userId]);

  //Harfleri çekme ve ilk sırayı kontrol etme işlemleri
  useEffect(() => {
    const fetchLetters = async () => {
      try {
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
    const fetchTurn = async () => {
      try {
        const res = await fetch(`${API_URL}/gameboard/turn?roomId=${roomId}`);
        const data = await res.json(); // örn: 5 veya "5"
        // userId ve currentTurn'u string olarak karşılaştır
        setIsUsersTurn(String(userId) === String(data));
      } catch (e) {
        setIsUsersTurn(false);
      }
    };
    if (roomId && userId) {
      fetchTurn();
      fetchLetters();
    }
  }, [roomId, userId]);

  // Sıra bilgisini düzenli olarak güncelle (polling)
  useEffect(() => {
    let isMounted = true;

    const interval = setInterval(async () => {
      if (!isMounted) return;
      try {
        const res = await fetch(`${API_URL}/gameboard/turn?roomId=${roomId}`);
        const data = await res.json();
        if (isMounted) {
          setIsUsersTurn(String(userId) === String(data));
        }
      } catch (e) {
        if (isMounted) {
          setIsUsersTurn(false);
        }
      }
    }, 3000);

    return () => {
      clearInterval(interval);
      isMounted = false;
    };
  }, [roomId, userId]);


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
    if (!isUsersTurn) return;
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

  // Yön belirleme fonksiyonu (iki harf arası)
  const getDirection = (from: {row: number, col: number}, to: {row: number, col: number}): WordDirection => {
    const dr = to.row - from.row;
    const dc = to.col - from.col;
    if (dr === 0 && dc === 1) return WordDirection.HORIZONTAL;
    if (dr === 1 && dc === 0) return WordDirection.VERTICAL;
    if (dr === 1 && dc === 1) return WordDirection.DIAGONAL_DOWN;
    if (dr === -1 && dc === 1) return WordDirection.DIAGONAL_UP;
    return WordDirection.NONE;
  };

  // Harfin yerleştirilebileceği kareleri hesaplayan fonksiyon
  const calculatePlaceablePositions = (): {row: number, col: number}[] => {
    // Matris yüklenmediyse veya boşsa erken çık
    if (!matrixState || matrixState.length === 0) return [];

    // Boardda hiç harf yoksa (oyunun ilk hamlesi)
    const isBoardEmpty = matrixState.every(row => row.every(cell => !cell.letter || cell.letter === ""));

    // Durum 1: Oyunun ilk harfi yerleştiriliyor (placedLetters boş)
    if (isBoardEmpty && placedLetters.length === 0) {
      return [centerCell];
    }

    // Durum 2: Oyunun ikinci harfi yerleştiriliyor (ilk harf geçici olarak konuldu)
    // VEYA sonraki bir turda kelimenin ikinci harfi yerleştiriliyor
    if (placedLetters.length === 1) {
      const first = placedLetters[0].position;
      const directions = [
        { dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
        { dr: -1, dc: -1 }, { dr: -1, dc: 1 }, { dr: 1, dc: -1 }, { dr: 1, dc: 1 },
      ];
      const positions: {row: number, col: number}[] = [];
      directions.forEach(dir => {
        const nr = first.row + dir.dr;
        const nc = first.col + dir.dc;
        // Sınırları ve hücrenin boş olup olmadığını kontrol et (hem matriste hem geçici harflerde)
        if (
          nr >= 0 && nr < 15 && nc >= 0 && nc < 15 &&
          !(matrixState[nr][nc].letter && matrixState[nr][nc].letter !== "") && // Matriste harf yok
          !placedLetters.some(item => item.position.row === nr && item.position.col === nc) // Geçici harf yok
        ) {
          positions.push({ row: nr, col: nc });
        }
      });
      return positions;
    }

    // Durum 3: Üçüncü ve sonraki harfler yerleştiriliyor (yön belirlenmiş)
    if (placedLetters.length >= 2) {
      const first = placedLetters[0].position;
      const second = placedLetters[1].position;
      const direction = getDirection(first, second);
      const last = placedLetters[placedLetters.length - 1].position;
      let nextPos: {row: number, col: number} | null = null;

      switch (direction) {
        case WordDirection.HORIZONTAL: nextPos = { row: last.row, col: last.col + 1 }; break;
        case WordDirection.VERTICAL: nextPos = { row: last.row + 1, col: last.col }; break;
        case WordDirection.DIAGONAL_DOWN: nextPos = { row: last.row + 1, col: last.col + 1 }; break;
        case WordDirection.DIAGONAL_UP: nextPos = { row: last.row - 1, col: last.col + 1 }; break;
      }

      // Sonraki pozisyon geçerli ve boş mu?
      if (
        nextPos &&
        nextPos.row >= 0 && nextPos.row < 15 &&
        nextPos.col >= 0 && nextPos.col < 15 &&
        !(matrixState[nextPos.row][nextPos.col].letter && matrixState[nextPos.row][nextPos.col].letter !== "") &&
        !placedLetters.some(item => item.position.row === nextPos!.row && item.position.col === nextPos!.col)
      ) {
        return [nextPos];
      }
      return []; // Yön boyunca devam edilemiyorsa boş dizi
    }

    // Durum 4: Sonraki turlarda yeni bir kelimenin ilk harfi yerleştiriliyor (placedLetters boş)
    if (!isBoardEmpty && placedLetters.length === 0) {
      const positions: {row: number, col: number}[] = [];
      for (let row = 0; row < matrixState.length; row++) {
        for (let col = 0; col < matrixState[row].length; col++) {
          const hasLetter = matrixState[row][col].letter && matrixState[row][col].letter !== "";
          if (!hasLetter) {
            positions.push({ row, col });
          }
        }
      }
      return positions;
    }


    return []; // Hiçbir duruma uymuyorsa (genelde olmamalı)
  };

  // Harfin yerleştirilebileceği konumlar - useMemo ile optimize edildi
  // selectedTileIndex veya placedLetters değiştiğinde yeniden hesaplanır
  const placeablePositions = useMemo(() => {
    if (selectedTileIndex === null) {
      return [];
    }
    return calculatePlaceablePositions();
  }, [selectedTileIndex, placedLetters, matrixState]); // matrixState'i de bağımlılıklara ekle

  // Bir hücrenin yerleştirilebilir olup olmadığını kontrol et
  const isPlaceablePosition = (rowIndex: number, colIndex: number): boolean => {
    return placeablePositions.some(pos => pos.row === rowIndex && pos.col === colIndex);
  };

  // Handle cell selection for placing a letter
  const handleCellSelect = (rowIndex: number, colIndex: number) => {
    if (!isUsersTurn) return;
    // Check if a tile is selected
    if(selectedTileIndex !== null) {
      const selectedTile = playerTiles[selectedTileIndex];

      // Sadece yerleştirilebilir pozisyonlara harf koy
      if (!isPlaceablePosition(rowIndex, colIndex)) {
        return;
      }

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
    } else {
      // Sadece kendi koyduğu harfi kaldırabilir (son koyduğu harfi)
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
    if (word.length >= 1) {
      setWordValidation(WordValidationState.CHECKING);
      
      // Gerçek uygulamada isValidWord yerine isValidWordSync kullanılabilir
      const isValid = isValidWordSync(word);
      setWordValidation(isValid ? WordValidationState.VALID : WordValidationState.INVALID);
    } else {
      setWordValidation(WordValidationState.NONE);
    }
  }, [placedLetters]);

  // Onaylama işlemi (WebSocket ile hamle gönder)
  const handleConfirm = async () => {
    if (wordValidation === WordValidationState.VALID && isUsersTurn) {
      try {
        // WebSocket ile hamle gönder
        sendMove(roomId!, placedLetters);

        setPlacedLetters([]);
        setWordDirection(WordDirection.NONE);
        setCurrentWord('');
        setWordValidation(WordValidationState.NONE);

        // Harfleri yeniden çek
        const res = await fetch(`${API_URL}/letters?userId=${userId}&roomId=${roomId}`);
        const data: string[] = await res.json();
        const tiles = data.map(letter => {
          const info = LETTER_DISTRIBUTION.find(l => l.letter === letter);
          return {
            letter,
            points: info ? info.points : 0
          };
        });
        setPlayerTiles(tiles);
      } catch (error) {
        console.error(error);
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

  // Hücre tipine göre arka plan stilini döndür
  const getCellBackgroundStyle = (cell: any, rowIndex: number, colIndex: number) => {
    // Merkez hücre
    if (rowIndex === centerCell.row && colIndex === centerCell.col) {
      return styles.centerCell;
    }
    // Çarpan hücresi
    if (cell.type === "multiplier" && cell.multiplier) {
      if (cell.multiplier.startsWith("word")) {
        return styles.wordCell;
      }
      if (cell.multiplier.startsWith("letter")) {
        return styles.letterCell;
      }
    }
    // Normal hücre
    return styles.normalCell;
  };

  // Hücre içeriğini render et
  const renderCellContent = (cell: any, rowIndex: number, colIndex: number) => {
    // Öncelikle geçici olarak yerleştirilen harf var mı kontrol et
    const tempPlaced = placedLetters.find(
      item => item.position.row === rowIndex && item.position.col === colIndex
    );
    if (tempPlaced) {
      return (
        <View style={[styles.placedLetterContainer, getLetterFrameStyle()]}>
          <Text style={styles.placedLetter}>{tempPlaced.letter}</Text>
        </View>
      );
    }

    // Yerleştirilmiş harf varsa göster (sunucudan gelen)
    if (cell.letter && cell.letter !== "") {
      return (
        <View style={[styles.placedLetterContainer, getLetterFrameStyle()]}>
          <Text style={styles.placedLetter}>{cell.letter}</Text>
        </View>
      );
    }

    // Merkez hücre (★)
    if (rowIndex === centerCell.row && colIndex === centerCell.col) {
      return <Text style={styles.starCell}>★</Text>;
    }

    // Çarpan hücresi
    if (cell.type === "multiplier" && cell.multiplier) {
      const [type, multiplier] = cell.multiplier.split("*");
      const style =
        type === "word"
          ? multiplier === "2"
            ? styles.wordMultiplier2
            : styles.wordMultiplier3
          : multiplier === "2"
          ? styles.letterMultiplier2
          : styles.letterMultiplier3;

      return (
        <View style={[styles.specialCell, style]}>
          <Text style={styles.multiplierText}>{type === "word" ? "W" : "L"}</Text>
          <Text style={styles.multiplierValue}>{multiplier}</Text>
        </View>
      );
    }

    // Mayın hücresi
    if (cell.type === "mine" && cell.mineActive) {
      return <Text style={{ color: 'red' }}>💣</Text>;
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {/* Room Info (Sıra bilgisi güncellendi) */}
      {roomId && userId && (
        <View style={styles.roomInfoContainer}>
          <Text style={styles.roomInfoText}>Oda: {roomId}</Text>
          <Text style={[
            styles.roomInfoText,
            isUsersTurn ? { color: '#27ae60', fontWeight: 'bold' } : { color: '#e74c3c', fontWeight: 'bold' }
          ]}>
            {isUsersTurn ? "Sizin sıranız" : "Karşı oyuncunun sırası"}
          </Text>
          <Text style={styles.roomInfoText}>Oyuncu: {userId}</Text>
        </View>
      )}
      {/* Game board */}
      <View style={[styles.boardContainer, { width: boardContainerWidth }]}>
        <View style={styles.board}>
          {matrixState.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.row}>
              {row.map((cell, colIndex) => (
                <TouchableOpacity
                  key={`cell-${rowIndex}-${colIndex}`}
                  onPress={() => handleCellSelect(rowIndex, colIndex)}
                  style={[
                    styles.cell,
                    { width: cellSize, height: cellSize },
                    getCellBackgroundStyle(cell, rowIndex, colIndex),
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
            (!isUsersTurn || wordValidation !== WordValidationState.VALID) ? styles.confirmButtonDisabled : null
          ]}
          onPress={handleConfirm}
          disabled={!isUsersTurn || wordValidation !== WordValidationState.VALID}
        >
          <Ionicons name="checkmark-circle" size={22} color={isUsersTurn && wordValidation === WordValidationState.VALID ? "#fff" : "#999"} />
          <Text style={[styles.confirmButtonText, (!isUsersTurn || wordValidation !== WordValidationState.VALID) ? styles.confirmButtonTextDisabled : null]}>
            Onayla
          </Text>
        </TouchableOpacity>
      </View>

      {/* Letter tiles */}
      <View style={[styles.tilesContainer, !isUsersTurn ? { opacity: 0.5 } : null]}>
        {playerTiles.map((tile, index) => (
          <TouchableOpacity 
            key={`tile-${index}`}
            onPress={() => handleTileSelect(index)}
            style={[
              styles.tileWrapper,
              selectedTileIndex === index ? styles.selectedTile : null
            ]}
            disabled={!isUsersTurn}
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
