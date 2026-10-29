import { parsePlainText, parseMarkdown } from '../document-parser';

describe('Document Parsing', () => {
  describe('parsePlainText', () => {
    it('should parse plain text', () => {
      const text = 'This is plain text content.';
      const result = parsePlainText(text);
      
      expect(result.text).toBe(text);
      expect(result.pages).toBeDefined();
      expect(result.pages!.length).toBeGreaterThan(0);
    });

    it('should split long text into pages', () => {
      const longText = 'Sentence. '.repeat(600);
      const result = parsePlainText(longText);
      
      expect(result.pages!.length).toBeGreaterThan(1);
    });

    it('should preserve page numbers', () => {
      const text = 'Content';
      const result = parsePlainText(text);
      
      expect(result.pages![0].pageNumber).toBe(1);
    });
  });

  describe('parseMarkdown', () => {
    it('should parse markdown text', () => {
      const text = '# Title\n\nSome content.';
      const result = parseMarkdown(text);
      
      expect(result.text).toBe(text);
      expect(result.pages).toBeDefined();
    });

    it('should split on headers', () => {
      const text = '# Section 1\nContent 1\n\n# Section 2\nContent 2';
      const result = parseMarkdown(text);
      
      expect(result.pages!.length).toBeGreaterThan(1);
    });

    it('should extract headings', () => {
      const text = '# Main Title\nContent';
      const result = parseMarkdown(text);
      
      expect(result.pages![0].text).toContain('# Main Title');
    });
  });
});
