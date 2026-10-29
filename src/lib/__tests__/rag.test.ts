import { generateAnswer, RAGResponse } from '../rag';

// Mock the AI SDK
jest.mock('ai', () => ({
  generateText: jest.fn(),
}));

jest.mock('@ai-sdk/openai', () => ({
  createOpenAI: jest.fn(() => ({
    'gpt-4o-mini': jest.fn(),
  })),
}));

describe('RAG Pipeline', () => {
  describe('generateAnswer', () => {
    beforeEach(() => {
      // Mock environment variable
      process.env.OPENAI_API_KEY = 'test-key';
    });

    it('should return no-answer response when no chunks provided', async () => {
      const retrievedChunks = [];
      
      const response: RAGResponse = await generateAnswer('test query', retrievedChunks);
      
      expect(response.hasAnswer).toBe(false);
      expect(response.answer).toContain("couldn't find any relevant information");
      expect(response.citations).toEqual([]);
    });

    it('should handle chunks with citations', async () => {
      const { generateText } = require('ai');
      generateText.mockResolvedValue({
        text: 'This is an answer [1].',
      });

      const retrievedChunks = [
        {
          id: 'chunk1',
          content: 'Test content',
          documentFilename: 'test.pdf',
          pageNumber: 1,
          similarity: 0.9,
        },
      ];
      
      const response: RAGResponse = await generateAnswer('test query', retrievedChunks);
      
      expect(response.hasAnswer).toBe(true);
      expect(response.answer).toContain('[1]');
    });

    it('should extract citations from answer', async () => {
      const { generateText } = require('ai');
      generateText.mockResolvedValue({
        text: 'Answer based on [1] and [2].',
      });

      const retrievedChunks = [
        {
          id: 'chunk1',
          content: 'Content 1',
          documentFilename: 'doc1.pdf',
          pageNumber: 1,
          similarity: 0.9,
        },
        {
          id: 'chunk2',
          content: 'Content 2',
          documentFilename: 'doc2.pdf',
          pageNumber: 2,
          similarity: 0.8,
        },
      ];
      
      const response: RAGResponse = await generateAnswer('test query', retrievedChunks);
      
      expect(response.citations.length).toBe(2);
      expect(response.citations[0].documentFilename).toBe('doc1.pdf');
      expect(response.citations[1].documentFilename).toBe('doc2.pdf');
    });

    it('should handle missing OPENAI_API_KEY', async () => {
      delete process.env.OPENAI_API_KEY;
      
      const retrievedChunks = [{ id: '1', content: 'test', documentFilename: 'test.pdf', similarity: 0.9 }];
      
      await expect(generateAnswer('query', retrievedChunks)).rejects.toThrow('OPENAI_API_KEY is not configured');
    });
  });
});
