import { chunkText } from '../chunker';

describe('Text Chunking', () => {
  it('should chunk text with overlap', () => {
    const text = 'This is sentence one. This is sentence two. This is sentence three. This is sentence four.';
    const pages = [{ pageNumber: 1, text }];
    
    const chunks = chunkText(text, pages, 50, 10);
    
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].content).toContain('This is sentence one');
    expect(chunks[0].pageNumber).toBe(1);
    expect(chunks[0].chunkIndex).toBe(0);
  });

  it('should preserve page numbers', () => {
    const text = 'This is sentence one. This is sentence two.';
    const pages = [{ pageNumber: 5, text }];
    
    const chunks = chunkText(text, pages, 100, 20);
    
    expect(chunks[0].pageNumber).toBe(5);
  });

  it('should extract headings from markdown', () => {
    const text = '# Heading 1\nThis is content under heading 1.';
    const pages = [{ pageNumber: 1, text }];
    
    const chunks = chunkText(text, pages, 100, 20);
    
    expect(chunks[0].heading).toBe('Heading 1');
  });

  it('should handle empty text', () => {
    const text = '';
    const pages = [{ pageNumber: 1, text }];
    
    const chunks = chunkText(text, pages, 100, 20);
    
    expect(chunks.length).toBe(0);
  });

  it('should handle multiple pages', () => {
    const pages = [
      { pageNumber: 1, text: 'Page one content.' },
      { pageNumber: 2, text: 'Page two content.' },
    ];
    
    const chunks = chunkText('', pages, 100, 20);
    
    expect(chunks.some(c => c.pageNumber === 1)).toBe(true);
    expect(chunks.some(c => c.pageNumber === 2)).toBe(true);
  });
});
