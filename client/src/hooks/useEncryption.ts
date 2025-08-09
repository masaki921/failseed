import { useState, useEffect } from 'react';
import { ClientEncryption } from '@/lib/encryption';

export function useEncryption() {
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeEncryption = async () => {
      try {
        const key = await ClientEncryption.initializeEncryption();
        setEncryptionKey(key);
        setIsReady(true);
      } catch (error) {
        console.error('暗号化初期化エラー:', error);
        setIsReady(true); // エラーでも続行
      }
    };

    initializeEncryption();
  }, []);

  const encryptText = async (text: string): Promise<string> => {
    if (!encryptionKey) return text;
    return await ClientEncryption.encryptText(text, encryptionKey);
  };

  const decryptText = async (encryptedText: string): Promise<string> => {
    if (!encryptionKey) return encryptedText;
    return await ClientEncryption.decryptText(encryptedText, encryptionKey);
  };

  return {
    isReady,
    encryptText,
    decryptText,
    hasEncryption: !!encryptionKey,
  };
}