import { prisma } from './prisma';
import { calculateKeywordScore } from './embeddings';

export interface RetrievedChunk {
  id: string;
  content: string;
  pageNumber?: number;
  heading?: string;
  documentId: string;
  documentFilename: string;
  similarity: number;
}

export async function retrieveRelevantChunks(
  query: string,
  userId: string,
  topK: number = 5
): Promise<RetrievedChunk[]> {
  // Get all chunks for the user
  const chunks = await prisma.chunk.findMany({
    where: {
      document: {
        userId,
        status: 'completed',
      },
    },
    include: {
      document: {
        select: {
          id: true,
          filename: true,
        },
      },
    },
  });

  // Calculate keyword similarity scores
  const scoredChunks: RetrievedChunk[] = chunks
    .map((chunk) => {
      const similarity = calculateKeywordScore(query, chunk.content);
      
      return {
        id: chunk.id,
        content: chunk.content,
        pageNumber: chunk.pageNumber || undefined,
        heading: chunk.heading || undefined,
        documentId: chunk.documentId,
        documentFilename: chunk.document.filename,
        similarity,
      };
    })
    .filter((chunk) => chunk.similarity > 0.1) // Filter low similarity
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return scoredChunks;
}
