import { RetrievedChunk } from './retrieval';

export interface RAGResponse {
  answer: string;
  citations: Array<{
    chunkId: string;
    documentFilename: string;
    pageNumber?: number;
    heading?: string;
    content: string;
  }>;
  hasAnswer: boolean;
}

export async function generateAnswer(
  query: string,
  retrievedChunks: RetrievedChunk[]
): Promise<RAGResponse> {
  if (retrievedChunks.length === 0) {
    return {
      answer: "I couldn't find any relevant information in your documents to answer this question. Please try rephrasing your question or upload more relevant documents.",
      citations: [],
      hasAnswer: false,
    };
  }

  // Build a simple answer from retrieved chunks
  const relevantText = retrievedChunks
    .map((chunk, index) => {
      const source = chunk.documentFilename + (chunk.pageNumber ? ` (page ${chunk.pageNumber})` : '');
      return `From ${source}:\n${chunk.content}`;
    })
    .join('\n\n---\n\n');

  const answer = `Based on your documents, here's what I found:\n\n${relevantText}`;

  const citations = retrievedChunks.map((chunk) => ({
    chunkId: chunk.id,
    documentFilename: chunk.documentFilename,
    pageNumber: chunk.pageNumber,
    heading: chunk.heading,
    content: chunk.content,
  }));

  return {
    answer,
    citations,
    hasAnswer: true,
  };
}
