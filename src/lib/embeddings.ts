// Simple keyword-based search (no API required)
export function generateKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2);
  
  // Remove common stop words
  const stopWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'this', 'that', 'with', 'they', 'from', 'what', 'which', 'when', 'where', 'who', 'how']);
  
  return Array.from(new Set(words.filter(word => !stopWords.has(word))));
}

export function calculateKeywordScore(query: string, content: string): number {
  const queryKeywords = generateKeywords(query);
  const contentKeywords = generateKeywords(content);
  
  if (queryKeywords.length === 0) return 0;
  
  let matches = 0;
  for (const keyword of queryKeywords) {
    if (contentKeywords.includes(keyword)) {
      matches++;
    }
  }
  
  return matches / queryKeywords.length;
}
