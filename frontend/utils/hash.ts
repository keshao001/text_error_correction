import CryptoJS from 'crypto-js';

export function calculateDocumentHash(content: string): string {
  return CryptoJS.SHA256(content).toString();
}
