// Utility functions for handling @ mentions

export function parseMentions(text: string): Array<{type: 'text' | 'mention', content: string, username?: string}> {
  const mentionRegex = /@[\w]+/g;
  const parts = [];
  let lastIndex = 0;

  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index),
      });
    }

    // Add mention
    const username = match[0].substring(1); // Remove @
    parts.push({
      type: 'mention',
      content: match[0],
      username,
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex),
    });
  }

  return parts.length > 0 ? parts : [{type: 'text', content: text}];
}

export function extractMentions(text: string): string[] {
  const mentionRegex = /@[\w]+/g;
  const mentions = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[0].substring(1)); // Remove @
  }

  return mentions;
}

// Get mention suggestion from current cursor position
export function getMentionSuggestion(text: string, cursorPosition: number): {
  start: number;
  end: number;
  query: string;
} | null {
  // Find the @ symbol before cursor
  const beforeCursor = text.substring(0, cursorPosition);
  const lastAtIndex = beforeCursor.lastIndexOf('@');

  if (lastAtIndex === -1) return null;

  // Check if @ is at word boundary (space before it or at start)
  if (lastAtIndex > 0 && beforeCursor[lastAtIndex - 1] !== ' ' && beforeCursor[lastAtIndex - 1] !== '\n') {
    return null;
  }

  // Get text after @
  const afterAt = text.substring(lastAtIndex + 1, cursorPosition);

  // Check if it contains only valid username characters
  if (!/^[\w]*$/.test(afterAt)) {
    return null;
  }

  return {
    start: lastAtIndex,
    end: cursorPosition,
    query: afterAt.toLowerCase(),
  };
}
