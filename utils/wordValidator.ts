// expo-file-system kaldırıldı
// import * as FileSystem from 'expo-file-system';

// Önbelleğe alınmış kelimeler
// const cachedWords: Record<string, string[]> = {};

/**
 * Verilen kelimeyi TDK listesinde kontrol eder
 * @param word Kontrol edilecek kelime
 * @returns Kelime geçerli ise true, değilse false döner
 */
// export const isValidWord = async (word: string): Promise<boolean> => {
//   ...dosya okuma kodları devre dışı bırakıldı...
//   return false;
// };

/**
 * Basitleştirilmiş, senkron kelime kontrolü (test amaçlı)
 */ 
export const isValidWordSync = (word: string): boolean => {
  // Bu örnek listesi yalnızca test amaçlı
  const sampleWords: Record<string, string[]> = {
    'k': ['kitap', 'kalem', 'küçük', 'kırmızı','ka'],
    'a': ['araba', 'aslan', 'anahtar', 'as', 'al', 'ak'],
    'i': ['iç', 'iğne', 'ilginç', 'iz','ia'],
    'b': ['baba', 'balık', 'büyük', 'beyaz','bn'],
    'c': ['çocuk', 'çilek', 'çalışkan','ç'],
    'd': ['deniz', 'dağ', 'dost','d'],
    's': ['sa'],
    'n': ['na','ne'],
    'm': ['ma','me'],
    'o': ['oa','oe'],
    'p': ['pa','pe'],
    'r': ['ra','rs','rb','rn'],
    't': ['ta','te'],
    'u': ['ua','ue'],
    'v': ['va','ve'],
    'y': ['ya','ye'],
    'z': ['za','ze','zr'],
    'h': ['ha','he'],
    'g': ['ga','ge'],
    'j': ['ja','je'],

    // Diğer harfler için örnek kelimele
  };
  
  if (!word || word.length < 2) return false;
  
  const lowercaseWord = word.toLowerCase();
  const firstLetter = lowercaseWord.charAt(0);
  
  const wordList = sampleWords[firstLetter] || [];
  return wordList.includes(lowercaseWord);
};
