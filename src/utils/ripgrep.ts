import { spawn } from 'child_process';
import { resolve } from 'path';
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

export async function* searchImports(
  directory: string,
  excludePatterns: string[] = []
): AsyncGenerator<ImportResult> {
  const rgPath = require('@vscode/ripgrep').rgPath;
  
  const args = [
    '--json',
    '--no-config',
    '--no-ignore-vcs',
    '--glob', '*.{js,jsx,ts,tsx,mjs}',
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
        
        for (const submatch of match.data.submatches) {
          const importPath = extractImportPath(lineText, submatch.start, submatch.end);
          
          if (!importPath) continue;
          
          // Skip only node_modules imports (no ./ or ../ and no @ or # or ~)
          if (!isRelativeImport(importPath) && 
              !importPath.startsWith('@') && 
              !importPath.startsWith('#') && 
              !importPath.startsWith('~')) {
            continue;
          }
          
          yield {
            filePath: resolve(match.data.path.text),
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
          for (const submatch of match.data.submatches) {
            const importPath = extractImportPath(lineText, submatch.start, submatch.end);
            
            if (importPath && (isRelativeImport(importPath) || 
                              importPath.startsWith('@') || 
                              importPath.startsWith('#') || 
                              importPath.startsWith('~'))) {
              yield {
                filePath: resolve(match.data.path.text),
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
  const patterns = [
    /from\s*['"\`]([^'"\`]+)['"\`]/,
    /import\s*\(\s*['"\`]([^'"\`]+)['"\`]/,
    /require\s*\(\s*['"\`]([^'"\`]+)['"\`]/,
    /import\.source\s*\(\s*['"\`]([^'"\`]+)['"\`]/,
    /import\s*['"\`]([^'"\`]+)['"\`]/,
  ];
  
  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}