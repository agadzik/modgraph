export interface ImportMatch {
  fullMatch: string;
  modulePath: string;
  line: number;
  column: number;
}

export const IMPORT_PATTERNS = {
  dynamicImport: String.raw`import\s*\([\s\S]*?['"\`]([^'"\`]+)['"\`][\s\S]*?\)`,
  
  namedImport: String.raw`import\s*\{[\s\S]*?\}\s*from\s*['"\`]([^'"\`]+)['"\`]`,
  
  defaultImport: String.raw`import\s+\w+\s+from\s*['"\`]([^'"\`]+)['"\`]`,
  
  mixedImport: String.raw`import\s+\w+\s*,\s*\{[\s\S]*?\}\s*from\s*['"\`]([^'"\`]+)['"\`]`,
  
  sideEffectImport: String.raw`import\s*['"\`]([^'"\`]+)['"\`]`,
  
  requireCall: String.raw`require\s*\([\s\S]*?['"\`]([^'"\`]+)['"\`][\s\S]*?\)`,
  
  withAssert: String.raw`import\s+[\s\S]+?\s+from\s*['"\`]([^'"\`]+)['"\`]\s*assert\s*\{[\s\S]*?\}`,
  
  sourcePhase: String.raw`import\s+source\s+\w+\s+from\s*['"\`]([^'"\`]+)['"\`]`,
  
  dynamicSource: String.raw`import\.source\s*\([\s\S]*?['"\`]([^'"\`]+)['"\`][\s\S]*?\)`,

  // Re-export patterns
  exportAll: String.raw`export\s*\*\s*from\s*['"\`]([^'"\`]+)['"\`]`,
  
  exportNamed: String.raw`export\s*\{[\s\S]*?\}\s*from\s*['"\`]([^'"\`]+)['"\`]`,
};

// Pattern that matches import/require/export statements including multi-line
// Broken down into specific patterns unioned together:
// 1. Named imports: import { ... } from '...'
// 2. Mixed imports: import default, { ... } from '...'
// 3. Default imports: import default from '...'
// 4. Side-effect imports: import '...'
// 5. Dynamic imports: import(...)
// 6. Require calls: require(...)
// 7. Source imports: import source ... from '...'
// 8. Dynamic source: import.source(...)
// 9. Imports with assertions/attributes: import ... from '...' assert/with { ... }
// 10. Re-export all: export * from '...'
// 11. Re-export named: export { ... } from '...'
export const COMBINED_PATTERN = '(^import\\s+\\{[\\s\\S]*?\\}\\s*from[\\s\\S]*?[\'"`][^\'"`]+[\'"`](?:\\s*(?:assert|with)\\s*\\{[\\s\\S]*?\\})?)|(^import\\s+\\w+\\s*,\\s*\\{[\\s\\S]*?\\}\\s*from[\\s\\S]*?[\'"`][^\'"`]+[\'"`](?:\\s*(?:assert|with)\\s*\\{[\\s\\S]*?\\})?)|(^import\\s+\\w+\\s+from[\\s\\S]*?[\'"`][^\'"`]+[\'"`](?:\\s*(?:assert|with)\\s*\\{[\\s\\S]*?\\})?)|(^import\\s+[\'"`][^\'"`]+[\'"`])|(import\\s*\\([\\s\\S]*?[\'"`][^\'"`]+[\'"`][\\s\\S]*?\\))|(require\\s*\\([\\s\\S]*?[\'"`][^\'"`]+[\'"`][\\s\\S]*?\\))|(^import\\s+source\\s+\\w+\\s+from[\\s\\S]*?[\'"`][^\'"`]+[\'"`])|(import\\.source\\s*\\([\\s\\S]*?[\'"`][^\'"`]+[\'"`][\\s\\S]*?\\))|(^export\\s*\\*\\s*from\\s*[\'"`][^\'"`]+[\'"`])|(^export\\s*\\{[\\s\\S]*?\\}\\s*from\\s*[\'"`][^\'"`]+[\'"`])';

export const TYPE_ONLY_PATTERN = String.raw`import\s+type\s+`;

export function isRelativeImport(importPath: string): boolean {
  return importPath.startsWith('./') || importPath.startsWith('../');
}

export function isExternalDependency(importPath: string): boolean {
  return !isRelativeImport(importPath) && !importPath.startsWith('@/') && !importPath.startsWith('~');
}

export function shouldSkipImport(line: string): boolean {
  // Skip type-only imports
  if (new RegExp(TYPE_ONLY_PATTERN).test(line)) {
    return true;
  }
  
  // Check for dynamic imports with variables (not string literals)
  // Must exclude whitespace/comments to avoid false positives with multi-line imports
  const hasVariable = /import\s*\(\s*[^'"\`\s\/]/.test(line);
  const hasTemplateLiteral = /import\s*\(\s*`.*\$\{/.test(line);
  if (hasVariable || hasTemplateLiteral) {
    return true;
  }
  
  return false;
}