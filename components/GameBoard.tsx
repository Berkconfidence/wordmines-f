import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import LetterTile from './LetterTile';
import { LETTER_DISTRIBUTION } from '../constants/letterDistribution';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '@/config';
import { sendMove, listenForBoardUpdates } from '../services/socketService';

interface GameBoardProps {
  roomId?: string;
  userId?: string;
  duration?: number; // dakika cinsinden props ile alınacak
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

interface PlayerInfo {
  username: string;
  score: number;
}

interface GameStatus {
  player1: PlayerInfo;
  player2: PlayerInfo;
  remainingLetters: number;
  duration?: number;  // Optional duration property in minutes
}

const GameBoard: React.FC<GameBoardProps> = ({ roomId, userId, duration }) => {
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
  const [wordScore, setWordScore] = useState<number | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(false);
  const [isBoardLoading, setIsBoardLoading] = useState<boolean>(false);
  const [isLettersLoading, setIsLettersLoading] = useState<boolean>(false);
  const [moveTimer, setMoveTimer] = useState<number | null>(null);
  const [moveTimerRunning, setMoveTimerRunning] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [lastMoveInfo, setLastMoveInfo] = useState<{ lastMoveAt: string, isFirstMove: boolean } | null>(null);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [finishMessage, setFinishMessage] = useState<string | null>(null);

  // Calculate responsive sizes
  const cellSize = Math.min(windowWidth / 17, 24); // Limiting to max 24px
  const boardContainerWidth = (cellSize + 3) * 15; // 15 cells per row + margins

  // Fetch game status function (using useCallback for stability)
  const fetchGameStatus = useCallback(async () => {
    if (!roomId) return;
    setIsLoadingStatus(true);
    try {
      const res = await fetch(`${API_URL}/gameroom/status?roomId=${roomId}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data: GameStatus = await res.json();
      setGameStatus(data); // Update state directly
    } catch (error) {
      console.error("Oyun durumu alınamadı:", error);
      setGameStatus(null); // Hata durumunda sıfırla
    } finally {
      setIsLoadingStatus(false);
    }
  }, [roomId]); // Dependency: roomId

  //Tahtayı çekme işlemleri
  useEffect(() => {
    let retryTimeout: NodeJS.Timeout | null = null;
    const fetchBoardMatrix = async (retryCount = 0) => {
      if (!roomId) return;
      setIsBoardLoading(true);
      try {
        const res = await fetch(`${API_URL}/gameboard/matrix?roomId=${roomId}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const matrix = await res.json();
        setMatrixState(matrix);
        setIsBoardLoading(false);
      } catch (error) {
        if (retryCount < 5) {
          retryTimeout = setTimeout(() => fetchBoardMatrix(retryCount + 1), 1000);
        } else {
          setIsBoardLoading(false);
          console.error("Tahta verisi alınamadı", error);
        }
      }
    };
  
    if (roomId) {
      fetchBoardMatrix();
    }
    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
    };
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
      // Fetch game status after board update
      fetchGameStatus();
    });
    setBoardListener(() => unsubscribe);
    return () => {
      unsubscribe();
    };
  }, [roomId, userId, fetchGameStatus]); // Add fetchGameStatus to dependencies

  //Harfleri çekme ve ilk sırayı kontrol etme işlemleri
  useEffect(() => {
    let retryTimeout: NodeJS.Timeout | null = null;
    const fetchLetters = async (retryCount = 0) => {
      setIsLettersLoading(true);
      try {
        const res = await fetch(`${API_URL}/letters?userId=${userId}&roomId=${roomId}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
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
        setIsLettersLoading(false);
      } catch (error) {
        if (retryCount < 5) {
          retryTimeout = setTimeout(() => fetchLetters(retryCount + 1), 1000);
        } else {
          setIsLettersLoading(false);
          console.error("Harfler alınamadı", error);
        }
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
    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
    };
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

  // Fetch game status (player info, scores, remaining letters) - Initial fetch only
  useEffect(() => {
    let retryTimeout: NodeJS.Timeout | null = null;
    const fetchStatusWithRetry = async (retryCount = 0) => {
      setIsLoadingStatus(true);
      try {
        const res = await fetch(`${API_URL}/gameroom/status?roomId=${roomId}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data: GameStatus = await res.json();
        setGameStatus(data);
        setIsLoadingStatus(false);
      } catch (error) {
        if (retryCount < 5) {
          retryTimeout = setTimeout(() => fetchStatusWithRetry(retryCount + 1), 1000);
        } else {
          setGameStatus(null);
          setIsLoadingStatus(false);
          console.error("Oyun durumu alınamadı:", error);
        }
      }
    };
    fetchStatusWithRetry();
    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [fetchGameStatus]); // Use the useCallback version

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
    if (!matrixState || matrixState.length === 0) return [];

    const isBoardEmpty = matrixState.every(row => row.every(cell => !cell.letter || cell.letter === ""));

    // Durum 1: Oyunun ilk harfi yerleştiriliyor (placedLetters boş)
    if (isBoardEmpty && placedLetters.length === 0) {
      return [centerCell];
    }

    // Durum 2: Oyunun ikinci harfi yerleştiriliyor (ilk harf geçici olarak konuldu)
    // Bu kısım değişmiyor, çapraz dahil tüm komşular geçerli
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
    // Bu kısım değişmiyor, belirlenen yönde devam ediyor (çapraz dahil)
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
      // SADECE SAĞ, SOL, ÜST, ALT komşulara izin ver (çapraz yok)
      const directions = [
        { dr: -1, dc: 0 }, // yukarı
        { dr: 1, dc: 0 },  // aşağı
        { dr: 0, dc: -1 }, // sol
        { dr: 0, dc: 1 },  // sağ
      ];
      for (let row = 0; row < matrixState.length; row++) {
        for (let col = 0; col < matrixState[row].length; col++) {
          const hasLetter = matrixState[row][col].letter && matrixState[row][col].letter !== "";
          if (hasLetter) {
            // Sadece dikey/yatay komşu boş kareleri bul
            directions.forEach(dir => {
              const nr = row + dir.dr;
              const nc = col + dir.dc;
              if (
                nr >= 0 && nr < 15 && nc >= 0 && nc < 15 &&
                !(matrixState[nr][nc].letter && matrixState[nr][nc].letter !== "") &&
                !positions.some(pos => pos.row === nr && pos.col === nc)
              ) {
                positions.push({ row: nr, col: nc });
              }
            });
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
      setWordScore(null);
      return;
    }
    
    // Kelimeyi oluştur
    const word = placedLetters.map(letter => letter.letter).join('');
    setCurrentWord(word);

    // Kelimeyi doğrula (en az 2 harf olmalı)
    if (word.length >= 1) {
      setWordValidation(WordValidationState.CHECKING);
      setWordScore(null);

      // Backend'e yeni API ile istek at
      fetch(`${API_URL}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: roomId,
          moves: placedLetters.map(l => ({
            letter: l.letter,
            points: l.points,
            position: l.position
          }))
        })
      })
        .then(res => res.json())
        .then((response: { valid: boolean | string; score: number }) => { // 'isValid' yerine 'valid' kullanıldı
          // Log the raw response from the backend
          console.log('Backend Validation Response:', response);
      
          // Check for both boolean true and string "true" using 'valid'
          const isValidWord = response.valid === true || response.valid === "true"; // 'isValid' yerine 'valid' kullanıldı
          const validationState = isValidWord ? WordValidationState.VALID : WordValidationState.INVALID;
      
          // Log the determined validation state before setting it
          console.log('Setting wordValidation state to:', validationState);
      
          setWordValidation(validationState);
          setWordScore(response.score ?? null);
        })
        .catch((error) => { // Also log any errors during fetch/parsing
          console.error('Error during word validation fetch:', error);
          setWordValidation(WordValidationState.INVALID);
          setWordScore(null);
        });
    } else {
      setWordValidation(WordValidationState.NONE);
      setWordScore(null);
    }
  }, [placedLetters]);

  // Hamle onaylandığında timer'ı tetiklemek için state
  const [movePlayed, setMovePlayed] = useState(false);

  // Hamle onaylandığında movePlayed'i tetikle
  const handleConfirm = async () => {
    if (wordValidation === WordValidationState.VALID && isUsersTurn) {
      try {
        sendMove(roomId!, placedLetters);
        setPlacedLetters([]);
        setWordDirection(WordDirection.NONE);
        setCurrentWord('');
        setWordValidation(WordValidationState.NONE);
        setWordScore(null);
        // Hamle oynandı, timer tetiklenmeli
        setMovePlayed(true);
      } catch (error) {
        console.error("Hamle gönderilirken hata:", error);
      }
    }
  };

  // Sıra kullanıcıya geçtiğinde veya hamle oynandığında timer'ı başlat
  useEffect(() => {
    if (!roomId || !gameStatus) {
      setMoveTimer(null);
      setMoveTimerRunning(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    // Hamle oynandıysa veya sıra kullanıcıya geçtiyse moveinfo çek
    const fetchMoveInfoAndStartTimer = async () => {
      try {
        const res = await fetch(`${API_URL}/gameboard/moveinfo?roomId=${roomId}`);
        const data = await res.json(); // { lastMoveAt, isFirstMove }
        setLastMoveInfo(data);

        // Süre hesaplama
        const now = new Date();
        const lastMoveAt = new Date(data.lastMoveAt);
        const isFirstMove = data.isFirstMove;
        // Öncelik sırası: props.duration > gameStatus?.duration > fallback
        let durationSec = 180;
        if (isFirstMove) {
          durationSec = 3600;
        } else if (typeof duration === "number" && !isFirstMove) {
          durationSec = duration * 60;
        } else if (gameStatus?.duration && !isFirstMove) {
          durationSec = gameStatus.duration * 60;
        }
        const elapsed = Math.floor((now.getTime() - lastMoveAt.getTime()) / 1000);
        const left = durationSec - elapsed;
        setMoveTimer(left > 0 ? left : 0);
        setMoveTimerRunning(true);
      } catch (e) {
        setMoveTimer(null);
        setMoveTimerRunning(false);
      }
    };

    fetchMoveInfoAndStartTimer();
    setMovePlayed(false); // resetle

    // Temizlik
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [movePlayed, roomId, gameStatus, duration]);

  // Timer'ı azalt
  useEffect(() => {
    if (!moveTimerRunning || moveTimer === null) return;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    timerIntervalRef.current = setInterval(() => {
      setMoveTimer(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          // Süre bittiğinde oyun bitirme işlemi
          if (
            isUsersTurn &&
            !isGameFinished &&
            roomId
          ) {
            // Yeni backend endpointine sadece roomId ile POST isteği gönder
            fetch(`${API_URL}/gameroom/finish?roomId=${roomId}`, {
              method: "POST"
            })
              .then(async res => {
                const data = await res.json();
                // Kullanıcıya göre mesaj hazırla
                const winnerId = data.winnerId !== undefined ? String(data.winnerId) : "";
                const loserId = data.loserId !== undefined ? String(data.loserId) : "";
                const myId = userId !== undefined ? String(userId) : "";
                if (myId && winnerId && myId === winnerId) {
                  setFinishMessage(`Tebrikler, kazandınız! 🎉\nKazanan: ${data.winnerUsername}`);
                } else if (myId && loserId && myId === loserId) {
                  setFinishMessage(`Üzgünüz, kaybettiniz.\nKazanan: ${data.winnerUsername}`);
                } else {
                  setFinishMessage("Oyun sona erdi.");
                }
                setIsGameFinished(true);
              })
              .catch(() => {
                setFinishMessage("Oyun sona erdi.");
                setIsGameFinished(true);
              });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [moveTimerRunning, moveTimer, isUsersTurn, isGameFinished, roomId, userId]);

  // Süreyi dakika:saniye olarak formatla
  const formatTime = (sec: number | null) => {
    if (sec === null) return "--:--";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
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
      // Sadece kendi koyduğu harfler için çerçeve rengi uygula
      return (
        <View style={[styles.placedLetterContainer, getLetterFrameStyle()]}>
          <Text style={styles.placedLetter}>{tempPlaced.letter}</Text>
        </View>
      );
    }

    // Yerleştirilmiş harf varsa göster (sunucudan gelen)
    if (cell.letter && cell.letter !== "") {
      // Önceden konulan harfler için çerçeve rengi uygulama
      return (
        <View style={styles.placedLetterContainer}>
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
      {/* Oyun bitiş mesajı */}
      {isGameFinished && (
        <View style={{ backgroundColor: "#fffbe6", padding: 12, borderRadius: 8, marginBottom: 10 }}>
          <Text style={{ color: "#e74c3c", fontWeight: "bold", textAlign: "center", fontSize: 16 }}>
            {finishMessage || "Oyun sona erdi."}
          </Text>
        </View>
      )}
      {/* Modern Room Info & Timer */}
      {roomId && userId && (
        <View style={styles.modernRoomCard}>
          <View style={styles.modernRoomRow}>
            <Text style={styles.modernRoomLabel}>Oda</Text>
            <Text style={styles.modernRoomValue}>{roomId}</Text>
          </View>
          <View style={styles.modernRoomRow}>
            <Text
              style={[
                styles.modernTurnText,
                isUsersTurn ? styles.modernTurnActive : styles.modernTurnPassive,
              ]}
            >
              {isUsersTurn ? "Sizin sıranız" : "Karşı oyuncunun sırası"}
            </Text>
          </View>
          <View style={styles.modernRoomRow}>
            <Text style={styles.modernRoomLabel}>Oyuncu</Text>
            <Text style={styles.modernRoomValue}>{userId}</Text>
          </View>
          <View style={styles.modernTimerContainer}>
            <Text
              style={[
                styles.modernTimerText,
                moveTimer !== null && moveTimer < 15
                  ? styles.modernTimerWarning
                  : styles.modernTimerNormal,
              ]}
            >
              Hamle süresi: {formatTime(moveTimer)}
            </Text>
            <View style={styles.modernProgressBarBackground}>
              <View
                style={[
                  styles.modernProgressBarFill,
                  {
                    width: `${
                      moveTimer !== null
                        ? Math.max(0, Math.min(100, (100 * moveTimer) / ((typeof duration === "number" ? duration : 3) * 60)))
                        : 100
                    }%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      )}
      {/* Game board */}
      <View style={[styles.boardContainer, { width: boardContainerWidth }]}>
        {isBoardLoading || isLettersLoading ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', height: 350 }}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={{ marginTop: 10, color: '#555' }}>Oyun hazırlanıyor...</Text>
          </View>
        ) : (
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
        )}
      </View>

      
      {/* Kullanıcıların bilgiler ve kalan harf sayısı */}
      <View style={styles.userinformation}>
        {isLoadingStatus ? (
          <ActivityIndicator size="small" />
        ) : gameStatus ? (
          (() => {
            // id değerleri string'e çevrilerek karşılaştırılır
            const userIdStr = String(userId);
            const p1 = gameStatus.player1 as any;
            const p2 = gameStatus.player2 as any;
            // id alanı backend'den geliyor, yoksa fallback olarak eski haliyle devam et
            const isUserP1 = p1.id !== undefined && String(p1.id) === userIdStr;
            const left = isUserP1 ? p1 : p2;
            const right = isUserP1 ? p2 : p1;
            return (
              <View style={styles.statusRowModern}>
                <Text style={styles.nameModern} numberOfLines={1}>{left.username}</Text>
                <Text style={styles.scoreModern}>{left.score}</Text>
                <Text style={styles.remainingModern}>{gameStatus.remainingLetters}</Text>
                <Text style={styles.scoreModern}>{right.score}</Text>
                <Text style={styles.nameModern} numberOfLines={1}>{right.username}</Text>
              </View>
            );
          })()
        ) : (
          <Text style={styles.userInfoText}>Oyun bilgileri yüklenemedi.</Text>
        )}
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

      {/* Kelime kontrolü ve onay butonu */}
      <View style={styles.controlsContainer}>
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
        <View style={styles.wordInfoContainer}>
          {wordValidation === WordValidationState.CHECKING && <ActivityIndicator size="small" />}
          {/* Puanı göster */}
          {wordScore !== null && wordValidation !== WordValidationState.NONE && (
            <Text style={{ marginLeft: 8, fontWeight: 'bold', color: '#555' }}>
              Kelime: ({wordScore} puan)
            </Text>
          )}
        </View>
        
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
    width: '105%',
    backgroundColor: '#3498db',
    borderBottomWidth: 1,
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
  // Kullanıcıların bilgiler ve kalan harf sayısı
  userinformation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '105%',
    paddingHorizontal: 10,
    marginTop: 5,
    minHeight: 40,
    backgroundColor: '#3498db',
    borderBottomWidth: 1,
  },
  playerInfoBox: {
    flex: 1, // Take up available space
    alignItems: 'center', // Center text horizontally
    paddingHorizontal: 5, // Add some padding
  },
  userInfoText: {
    fontSize: 13, // Slightly smaller font size
    fontWeight: 'bold',
    color: '#333', // Darker color
    textAlign: 'center', // Ensure text is centered
  },
  remainingLettersBox: {
    alignItems: 'center', // Center text horizontally
    marginHorizontal: 10, // Add horizontal margin
  },
  remainingLettersText: {
    fontSize: 12,
    color: '#555',
  },
  remainingLettersCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
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
    width: '105%',
    height: 50,
    marginBottom: 10,
    padding: 5,
    backgroundColor: '#3498db',
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
    backgroundColor: '#00cd5a',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    elevation: 2,
    left: 5,
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
  statusRowModern: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 6,
  },
  nameModern: {
    backgroundColor: '#fafafa',
    color: '#32235f',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    fontWeight: 'bold',
    fontSize: 14,
    maxWidth: 90,
    overflow: 'hidden',
    textAlign: 'center',
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#000',
  },
  scoreModern: {
    backgroundColor: '#32235f',
    color: '#fafafa',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    fontWeight: 'bold',
    fontSize: 14,
    minWidth: 36,
    textAlign: 'center',
    marginHorizontal: 2,
  },
  remainingModern: {
    backgroundColor: '#fafafa',
    color: '#32235f',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    fontWeight: 'bold',
    fontSize: 15,
    minWidth: 36,
    textAlign: 'center',
    marginHorizontal: 2,
    borderWidth: 2,
    borderColor: '#00cd5f',
  },
  modernRoomCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    width: '95%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  modernRoomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  modernRoomLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
  },
  modernRoomValue: {
    fontSize: 14,
    color: '#333',
  },
  modernTurnText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  modernTurnActive: {
    color: '#27ae60',
  },
  modernTurnPassive: {
    color: '#e74c3c',
  },
  modernTimerContainer: {
    marginTop: 5,
  },
  modernTimerText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  modernTimerWarning: {
    color: '#e74c3c',
  },
  modernTimerNormal: {
    color: '#32235f',
  },
  modernProgressBarBackground: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 2,
  },
  modernProgressBarFill: {
    height: '100%',
    backgroundColor: '#27ae60',
  },
});

export default GameBoard;
