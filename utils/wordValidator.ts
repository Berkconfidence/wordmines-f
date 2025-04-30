import * as FileSystem from 'expo-file-system';

// Önbelleğe alınmış kelimeler
const cachedWords: Record<string, string[]> = {};

/**
 * Verilen kelimeyi TDK listesinde kontrol eder
 * @param word Kontrol edilecek kelime
 * @returns Kelime geçerli ise true, değilse false döner
 */
export const isValidWord = async (word: string): Promise<boolean> => {
  if (!word || word.length < 2) return false;
  
  // Kelimeyi büyük harfe çevir
  const uppercaseWord = word.toUpperCase();
  
  // İlk harfi al
  const firstLetter = uppercaseWord.charAt(0).toLowerCase();
  
  // Eğer önbellekte varsa oradan kontrol et
  if (cachedWords[firstLetter]) {
    return cachedWords[firstLetter].includes(uppercaseWord.toLowerCase());
  }
  
  try {
    // Kelime listesi dosyasının yolunu oluştur
    const wordListPath = FileSystem.documentDirectory + `wordlist/${firstLetter}.list`;
    
    // Dosyayı oku
    const fileContent = await FileSystem.readAsStringAsync(wordListPath);
    
    // Satırlara ayır ve önbelleğe al
    const words = fileContent.split('\n').map(word => word.trim().toLowerCase());
    cachedWords[firstLetter] = words;
    
    // Kelimenin listede olup olmadığını kontrol et
    return words.includes(uppercaseWord.toLowerCase());
  } catch (error) {
    console.error("Kelime listesi okunurken hata oluştu:", error);
    return false;
  }
};

/**
 * Basitleştirilmiş, senkron kelime kontrolü (test amaçlı)
 */ 
export const isValidWordSync = (word: string): boolean => {
  // Bu örnek listesi yalnızca test amaçlı
  const sampleWords: Record<string, string[]> = {
    'k': ['kitap', 'kalem', 'küçük', 'kırmızı'],
    'a': ['araba', 'aslan', 'anahtar', 'a', 'al', 'ak'],
    // Diğer harfler için örnek kelimele
  };
  
  if (!word || word.length < 2) return false;
  
  const lowercaseWord = word.toLowerCase();
  const firstLetter = lowercaseWord.charAt(0);
  
  const wordList = sampleWords[firstLetter] || [];
  return wordList.includes(lowercaseWord);
};
