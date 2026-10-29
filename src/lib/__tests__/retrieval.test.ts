import { cosineSimilarity } from '../embeddings';

describe('Retrieval', () => {
  describe('cosineSimilarity', () => {
    it('should calculate similarity for identical vectors', () => {
      const vec1 = [1, 2, 3];
      const vec2 = [1, 2, 3];
      
      const similarity = cosineSimilarity(vec1, vec2);
      
      expect(similarity).toBeCloseTo(1.0);
    });

    it('should calculate similarity for orthogonal vectors', () => {
      const vec1 = [1, 0, 0];
      const vec2 = [0, 1, 0];
      
      const similarity = cosineSimilarity(vec1, vec2);
      
      expect(similarity).toBeCloseTo(0.0);
    });

    it('should calculate similarity for opposite vectors', () => {
      const vec1 = [1, 1, 1];
      const vec2 = [-1, -1, -1];
      
      const similarity = cosineSimilarity(vec1, vec2);
      
      expect(similarity).toBeCloseTo(-1.0);
    });

    it('should throw error for different length vectors', () => {
      const vec1 = [1, 2];
      const vec2 = [1, 2, 3];
      
      expect(() => cosineSimilarity(vec1, vec2)).toThrow();
    });

    it('should handle zero vectors', () => {
      const vec1 = [0, 0, 0];
      const vec2 = [1, 2, 3];
      
      expect(() => cosineSimilarity(vec1, vec2)).toThrow();
    });
  });
});
