import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { existsSync } from 'fs';
import { ImportResult, extractImportPath } from './ripgrep';
import { shouldSkipImport } from './patterns';
import { isRelativeImport } from './patterns';

export async function* searchImportsInFile(
  filePath: string
): AsyncGenerator<ImportResult> {
  // Check if file exists
  if (!existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }
  
  const rgPath = require('@vscode/ripgrep').rgPath;
  
  // When scanning a single file, pass the file path directly
  const args = [
    '--json',
    '--no-config',
    '-e', '(import|require)',
    filePath  // Pass the file directly, not as a glob
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
        const match = JSON.parse(line);
        
        if (match.type !== 'match') continue;
        
        const lineText = match.data.lines.text;
        
        if (shouldSkipImport(lineText)) continue;
        
        for (const submatch of match.data.submatches) {
          const importPath = extractImportPath(lineText, submatch.start, submatch.end);
          
          if (!importPath) continue;
          
          // Include all non-node_modules imports
          if (!isRelativeImport(importPath) && 
              !importPath.startsWith('@') && 
              !importPath.startsWith('#') && 
              !importPath.startsWith('~')) {
            continue;
          }
          
          yield {
            filePath: resolve(filePath),
            importPath,
            line: match.data.line_number
          };
        }
      } catch (err) {
        continue;
      }
    }
  }
  
  // Process remaining buffer
  if (buffer.trim()) {
    try {
      const match = JSON.parse(buffer);
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
                filePath: resolve(filePath),
                importPath,
                line: match.data.line_number
              };
            }
          }
        }
      }
    } catch (err) {
      // Ignore parse errors
    }
  }
}

