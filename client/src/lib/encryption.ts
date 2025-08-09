// クライアント側暗号化ライブラリ
// 会話内容を暗号化してプライバシーを保護

export class ClientEncryption {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  
  // セッション固有の暗号化キーを生成
  static async generateEncryptionKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  }

  // テキストを暗号化
  static async encryptText(text: string, key: CryptoKey): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv: iv,
      },
      key,
      data
    );
    
    // IV + 暗号化データを結合してBase64エンコード
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode.apply(null, Array.from(combined)));
  }

  // テキストを復号化
  static async decryptText(encryptedText: string, key: CryptoKey): Promise<string> {
    try {
      const combined = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
      
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);
      
      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: iv,
        },
        key,
        encrypted
      );
      
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('復号化エラー:', error);
      return '[復号化できません]';
    }
  }

  // キーをローカルストレージに保存（セッション間で永続化）
  static async saveKeyToStorage(key: CryptoKey): Promise<void> {
    const exported = await crypto.subtle.exportKey('raw', key);
    const keyData = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(exported))));
    localStorage.setItem('failseed_encryption_key', keyData);
  }

  // ローカルストレージからキーを読み込み
  static async loadKeyFromStorage(): Promise<CryptoKey | null> {
    const keyData = localStorage.getItem('failseed_encryption_key');
    if (!keyData) return null;
    
    try {
      const imported = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
      return await crypto.subtle.importKey(
        'raw',
        imported,
        { name: this.ALGORITHM },
        true,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.error('キー読み込みエラー:', error);
      return null;
    }
  }

  // 新しいセッション用のキーを初期化
  static async initializeEncryption(): Promise<CryptoKey> {
    let key = await this.loadKeyFromStorage();
    
    if (!key) {
      key = await this.generateEncryptionKey();
      await this.saveKeyToStorage(key);
    }
    
    return key;
  }
}