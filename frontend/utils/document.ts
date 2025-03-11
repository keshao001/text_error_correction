import crypto from 'crypto';
import { db } from '@/db';
import { documents } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function calculateFileHash(buffer: Buffer): Promise<string> {
  const hash = crypto.createHash('sha256');
  hash.update(buffer);
  return hash.digest('hex');
}

export async function checkDocumentExists(userId: string, fileHash: string) {
  try {
    console.log('Checking document exists:', { userId, fileHash });
    console.log('Documents schema:', documents);

    const existingDocument = await db.select()
      .from(documents)
      .where(
        and(
          eq(documents.userId, userId),
          eq(documents.fileHash, fileHash)
        )
      )
      .limit(1);

    console.log('Existing document:', existingDocument);
    return existingDocument.length > 0 ? existingDocument[0] : null;
  } catch (error) {
    console.error('Error in checkDocumentExists:', error);
    throw error;
  }
}

export async function createDocument({
  userId,
  title,
  fileHash,
  fileType,
  fileSize,
  status,
  error,
  originalContent,
  totalPages
}: {
  userId: string;
  title: string;
  fileHash: string;
  fileType: string;
  fileSize: number;
  status: 'pending' | 'processing' | 'processed' | 'error';
  error?: string;
  originalContent: string;
  totalPages: number;
}) {
  const [newDocument] = await db.insert(documents).values({
    userId,
    title,
    fileHash,
    fileType,
    fileSize,
    originalContent,
    status,
    error,
    totalPages,
    createdAt: new Date(),
    updatedAt: new Date()
  }).returning();

  return newDocument;
}

export async function updateDocumentContent(
  documentId: string,
  parsedContent: string
) {
  const [updatedDocument] = await db.update(documents)
    .set({
      parsedContent: parsedContent,
      status: 'processed'
    })
    .where(eq(documents.id, documentId))
    .returning();

  return updatedDocument;
}

export async function updateDocumentStatus(
  documentId: string,
  status: 'pending' | 'processing' | 'processed' | 'error' | 'corrected',
  error?: string
) {
  console.log('Updating document status:', { documentId, status });
  const [updatedDocument] = await db.update(documents)
    .set({ 
      status,
      updatedAt: new Date()
    })
    .where(eq(documents.id, documentId))
    .returning();

  console.log('Document status updated:', updatedDocument);
  return updatedDocument;
}

export async function addDocumentCorrection(
  documentId: string,
  correction: string
) {
  const existingCorrections = await db.select()
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);

  const currentCorrections = existingCorrections.length > 0 ? JSON.parse(existingCorrections[0].corrections) : [];

  const newCorrections = [...currentCorrections, correction];

  const [updatedDocument] = await db.update(documents)
    .set({
      corrections: JSON.stringify(newCorrections)
    })
    .where(eq(documents.id, documentId))
    .returning();

  return updatedDocument;
}
