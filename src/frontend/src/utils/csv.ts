export interface ParsedCSV {
  headers: string[];
  rows: string[][];
}

export function parseCSV(csvText: string): ParsedCSV {
  const lines = csvText.trim().split('\n');
  
  if (lines.length === 0) {
    throw new Error('CSV is empty');
  }

  const headers = parseCSVLine(lines[0]);
  const rows: string[][] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      try {
        const row = parseCSVLine(line);
        rows.push(row);
      } catch (error) {
        console.warn(`Failed to parse row ${i + 1}:`, error);
      }
    }
  }

  return { headers, rows };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

export function normalizeHeaderName(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function findColumnIndex(headers: string[], searchTerms: string[]): number {
  const normalizedHeaders = headers.map(normalizeHeaderName);
  
  for (const term of searchTerms) {
    const normalizedTerm = normalizeHeaderName(term);
    const index = normalizedHeaders.indexOf(normalizedTerm);
    if (index >= 0) return index;
  }

  return -1;
}
