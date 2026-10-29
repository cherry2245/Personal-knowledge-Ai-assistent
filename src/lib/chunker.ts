export interface Chunk {
  content: string;
  pageNumber?: number;
  heading?: string;
  chunkIndex: number;
}

export function chunkText(
  text: string,
  pages: Array<{ pageNumber: number; text: string }>,
  maxChunkSize: number = 1000,
  overlap: number = 200
): Chunk[] {
  const chunks: Chunk[] = [];
  let chunkIndex = 0;

  for (const page of pages) {
    const pageText = page.text;
    const sentences = pageText.match(/[^.!?]+[.!?]+/g) || [pageText];
    
    let currentChunk = '';
    let currentHeading = extractHeading(pageText);

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      
      if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push({
          content: currentChunk.trim(),
          pageNumber: page.pageNumber,
          heading: currentHeading,
          chunkIndex,
        });
        chunkIndex++;
        
        // Keep overlap
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-Math.floor(overlap / 5));
        currentChunk = overlapWords.join(' ') + ' ';
      }
      
      currentChunk += sentence + ' ';
    }

    if (currentChunk.trim()) {
      chunks.push({
        content: currentChunk.trim(),
        pageNumber: page.pageNumber,
        heading: currentHeading,
        chunkIndex,
      });
      chunkIndex++;
    }
  }

  return chunks;
}

function extractHeading(text: string): string | undefined {
  // Try to extract markdown heading
  const headingMatch = text.match(/^#{1,6}\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }
  
  // Try to extract first line as heading if it's short
  const firstLine = text.split('\n')[0];
  if (firstLine && firstLine.length < 100 && firstLine.length > 3) {
    return firstLine.trim();
  }
  
  return undefined;
}
