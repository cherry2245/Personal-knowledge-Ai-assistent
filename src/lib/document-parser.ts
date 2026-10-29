import pdf from 'pdf-parse';

export interface ParsedDocument {
  text: string;
  pages?: Array<{ pageNumber: number; text: string }>;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
  };
}

export async function parsePDF(buffer: Buffer): Promise<ParsedDocument> {
  try {
    const data = await pdf(buffer);
    return {
      text: data.text,
      pages: data.text.split('\n\n').map((text, index) => ({
        pageNumber: index + 1,
        text: text.trim(),
      })),
      metadata: {
        title: data.info?.Title,
        author: data.info?.Author,
        subject: data.info?.Subject,
      },
    };
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function parseMarkdown(text: string): ParsedDocument {
  const lines = text.split('\n');
  const pages: Array<{ pageNumber: number; text: string }> = [];
  let currentPage = '';
  let pageNumber = 1;

  for (const line of lines) {
    currentPage += line + '\n';
    
    // Split on markdown headers or every 500 lines as a fallback
    if (line.match(/^#{1,6}\s/) || currentPage.split('\n').length >= 500) {
      pages.push({
        pageNumber,
        text: currentPage.trim(),
      });
      currentPage = '';
      pageNumber++;
    }
  }

  if (currentPage.trim()) {
    pages.push({
      pageNumber,
      text: currentPage.trim(),
    });
  }

  return {
    text,
    pages: pages.length > 0 ? pages : [{ pageNumber: 1, text }],
  };
}

export function parsePlainText(text: string): ParsedDocument {
  const lines = text.split('\n');
  const pages: Array<{ pageNumber: number; text: string }> = [];
  let currentPage = '';
  let pageNumber = 1;

  for (const line of lines) {
    currentPage += line + '\n';
    
    // Split every 500 lines
    if (currentPage.split('\n').length >= 500) {
      pages.push({
        pageNumber,
        text: currentPage.trim(),
      });
      currentPage = '';
      pageNumber++;
    }
  }

  if (currentPage.trim()) {
    pages.push({
      pageNumber,
      text: currentPage.trim(),
    });
  }

  return {
    text,
    pages: pages.length > 0 ? pages : [{ pageNumber: 1, text }],
  };
}

export async function parseDocument(buffer: Buffer, filename: string): Promise<ParsedDocument> {
  const extension = filename.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'pdf':
      return parsePDF(buffer);
    case 'md':
    case 'markdown':
      return parseMarkdown(buffer.toString('utf-8'));
    case 'txt':
      return parsePlainText(buffer.toString('utf-8'));
    default:
      throw new Error(`Unsupported file type: ${extension}`);
  }
}
