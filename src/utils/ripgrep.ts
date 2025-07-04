import { spawn } from 'child_process';
import { resolve, relative } from 'path';
import { COMBINED_PATTERN, shouldSkipImport, isExternalDependency, isRelativeImport } from './patterns';

export interface RipgrepMatch {
  type: string;
  data: {
    path: {
      text: string;
    };
    lines: {
      text: string;
    };
    line_number: number;
    absolute_offset: number;
    submatches: Array<{
      match: {
        text: string;
      };
      start: number;
      end: number;
    }>;
  };
}

export interface ImportResult {
  filePath: string;
  importPath: string;
  line: number;
}

// Simple glob pattern matching function
function matchesGlobPattern(filePath: string, pattern: string): boolean {
  // Normalize paths to use forward slashes
  filePath = filePath.replace(/\\/g, '/');
  pattern = pattern.replace(/\\/g, '/');
  
  // Convert glob pattern to regex
  let regexPattern = '';
  let i = 0;
  
  while (i < pattern.length) {
    const char = pattern[i];
    
    if (char === '*') {
      if (pattern[i + 1] === '*') {
        // Handle **
        regexPattern += '.*';
        i += 2;
        if (pattern[i] === '/') i++; // Skip trailing slash in **/
      } else {
        // Handle single *
        regexPattern += '[^/]*';
        i++;
      }
    } else if (char === '?') {
      regexPattern += '.';
      i++;
    } else if (char === '.') {
      regexPattern += '\\.';
      i++;
    } else if (char === '/') {
      regexPattern += '/';
      i++;
    } else {
      // Regular character
      regexPattern += char;
      i++;
    }
  }
  
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(filePath);
}

// Check if a file path matches any of the include patterns
function matchesIncludePatterns(filePath: string, includePatterns: string[]): boolean {
  if (includePatterns.length === 0) {
    return true; // No include patterns means include all
  }
  
  return includePatterns.some(pattern => matchesGlobPattern(filePath, pattern));
}

export async function* searchImports(
  directory: string,
  excludePatterns: string[] = [],
  includePatterns: string[] = []
): AsyncGenerator<ImportResult> {
  const rgPath = require('@vscode/ripgrep').rgPath;
  
  const args = [
    '--json',
    '--no-config',
    '--no-ignore-vcs',
    '-U', // Enable multiline mode
    '--multiline-dotall',
    '--glob', '**/*.{js,jsx,ts,tsx,mjs}',
    '--glob', '!node_modules/**',
    '--glob', '!dist/**',
    '--glob', '!build/**',
    ...excludePatterns.flatMap(pattern => ['--glob', `!${pattern}`]),
    '-e', COMBINED_PATTERN,
    directory
  ];

  const rg = spawn(rgPath, args);
  
  let buffer = '';
  
  for await (const chunk of rg.stdout) {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      try {
        const match: RipgrepMatch = JSON.parse(line);
        
        if (match.type !== 'match') continue;
        
        const lineText = match.data.lines.text;
        
        if (shouldSkipImport(lineText)) continue;
        
        const fullPath = resolve(match.data.path.text);
        const relativePath = relative(directory, fullPath);
        
        // Check if this file matches the include patterns
        if (!matchesIncludePatterns(relativePath, includePatterns)) {
          continue;
        }
        
        for (const submatch of match.data.submatches) {
          let importPath = extractImportPath(lineText, submatch.start, submatch.end);
          
          
          
          
          if (!importPath) continue;
          
          // Skip only node_modules imports (no ./ or ../ and no @ or # or ~)
          // Exception: include Node.js built-in submodules like 'fs/promises'
          if (!isRelativeImport(importPath) && 
              !importPath.startsWith('@') && 
              !importPath.startsWith('#') && 
              !importPath.startsWith('~')) {  // Allow paths with / like 'fs/promises'
            continue;
          }
          
          yield {
            filePath: fullPath,
            importPath,
            line: match.data.line_number
          };
        }
      } catch (err) {
        continue;
      }
    }
  }
  
  if (buffer.trim()) {
    try {
      const match: RipgrepMatch = JSON.parse(buffer);
      if (match.type === 'match') {
        const lineText = match.data.lines.text;
        
        if (!shouldSkipImport(lineText)) {
          const fullPath = resolve(match.data.path.text);
          const relativePath = relative(directory, fullPath);
          
          // Check if this file matches the include patterns
          if (!matchesIncludePatterns(relativePath, includePatterns)) {
            return;
          }
          
          for (const submatch of match.data.submatches) {
            const importPath = extractImportPath(lineText, submatch.start, submatch.end);
            
            if (importPath && (isRelativeImport(importPath) || 
                              importPath.startsWith('@') || 
                              importPath.startsWith('#') || 
                              importPath.startsWith('~'))) {  // Allow paths with / like 'fs/promises'
              yield {
                filePath: fullPath,
                importPath,
                line: match.data.line_number
              };
            }
          }
        }
      }
    } catch (err) {
    }
  }
}

export function extractImportPath(line: string, start: number, end: number): string | null {
  // First, try to extract just the relevant substring if we have position info
  const substring = line.substring(start, end);
  
  const patterns = [
    /from\s*['"\`]([^'"\`]+)['"\`]/s,
    /import\s*\([\s\S]*?['"\`]([^'"\`]+)['"\`]/,
    /require\s*\([\s\S]*?['"\`]([^'"\`]+)['"\`]/,
    /import\.source\s*\([\s\S]*?['"\`]([^'"\`]+)['"\`]/,
    /import\s*['"\`]([^'"\`]+)['"\`]/,
    /import\s*\{[\s\S]*?\}\s*from\s*['"\`]([^'"\`]+)['"\`]/,
    /const\s*\{[\s\S]*?\}\s*=\s*require\s*\([\s\S]*?['"\`]([^'"\`]+)['"\`]/,
    /=\s*import\s*\([\s\S]*?['"\`]([^'"\`]+)['"\`]/,  // For dynamic imports with assignment
    /import\s+source\s+\w+\s+from\s*['"\`]([^'"\`]+)['"\`]/,  // For source imports
    /import\s+\w+\s+from\s*['"\`]([^'"\`]+)['"\`]\s*(?:assert|with)\s*\{[\s\S]*?\}/,  // For imports with assertions
    /export\s*\*\s*from\s*['"\`]([^'"\`]+)['"\`]/,  // For export * from
    /export\s*\{[\s\S]*?\}\s*from\s*['"\`]([^'"\`]+)['"\`]/,  // For export { ... } from
  ];
  
  // Try patterns on the substring first (more specific)
  for (const pattern of patterns) {
    const match = substring.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // If no match on substring, try on the full line
  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  
  return null;
}