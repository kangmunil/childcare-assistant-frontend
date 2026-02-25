export const normalizeMarkdownTable = (text) => {
  const lines = text.split('\n');
  const normalizedLines = [];
  const getNextNonEmptyLine = (startIndex) => {
    for (let i = startIndex; i < lines.length; i += 1) {
      const next = lines[i];
      if (next && next.trim()) {
        return next;
      }
    }
    return '';
  };

  const isTableSeparator = (line) => {
    if (!line) {
      return false;
    }

    const trimmedLine = line.trim();
    if (!trimmedLine.includes('|') || !trimmedLine.includes('-')) {
      return false;
    }

    const normalizedLine = trimmedLine.replace(/^\|/, '').replace(/\|$/, '');
    const columns = normalizedLine.split('|').map((column) => column.trim());

    return columns.length >= 2 && columns.every((column) => /^:?-{2,}:?$/.test(column));
  };

  const isPotentialTableRow = (line) => {
    if (!line || !line.includes('|') || line.trim().startsWith('```') || line.trim().endsWith('```')) {
      return false;
    }

    const normalizedLine = line.trim().replace(/^\|/, '').replace(/\|$/, '');
    const columns = normalizedLine.split('|').map((column) => column.trim());

    return columns.length >= 2 && columns.some((column) => column.length > 0);
  };

  const splitTableRow = (line) => {
    const normalizedLine = line.trim().replace(/^\|/, '').replace(/\|$/, '');
    return normalizedLine
      .split('|')
      .map((column) => column.trim())
      .filter((column) => column.length > 0);
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmedLine = line.trim();

    if (isTableSeparator(trimmedLine)) {
      continue;
    }

    if (!isPotentialTableRow(trimmedLine)) {
      normalizedLines.push(line);
      continue;
    }

    const nextLine = getNextNonEmptyLine(i + 1).trim();
    if (nextLine && isTableSeparator(nextLine)) {
      // header row of table-like block is not needed in plain text.
      continue;
    }

    const columns = splitTableRow(trimmedLine);

    if (columns.length >= 2) {
      normalizedLines.push(`${columns[0]}: ${columns.slice(1).join(' / ')}`);
      continue;
    }

    if (columns.length === 1) {
      normalizedLines.push(columns[0]);
      continue;
    }

    normalizedLines.push(line);
  }

  return normalizedLines.join('\n');
};

export const normalizeMarkdownText = (text) => {
  if (!text) {
    return '';
  }

  const withNormalizedTable = normalizeMarkdownTable(text);

  return withNormalizedTable
    .replace(/```[\s\S]*?```/g, (block) => {
      return block
        .replace(/^```[\w-]*\n?/, '')
        .replace(/\n?```$/, '')
        .trim();
    })
    .replace(/^(#{1,6})\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/!\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/(?<!\\)\*(.*?)\*/g, '$1')
    .replace(/(?<!\\)_(.*?)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1');
};
