export interface ImportMatch {
  fullMatch: string;
  modulePath: string;
  line: number;
  column: number;
}

export const IMPORT_PATTERNS = {
  dynamicImport: String.raw`import\s*\(\s*['"\`]([^'"\`]+)['"\`]\s*\)`,
  
  namedImport: String.raw`import\s*\{[^}]+\}\s*from\s*['"\`]([^'"\`]+)['"\`]`,
  
  defaultImport: String.raw`import\s+\w+\s+from\s*['"\`]([^'"\`]+)['"\`]`,
  
  mixedImport: String.raw`import\s+\w+\s*,\s*\{[^}]+\}\s*from\s*['"\`]([^'"\`]+)['"\`]`,
  
  sideEffectImport: String.raw`import\s*['"\`]([^'"\`]+)['"\`]`,
  
  requireCall: String.raw`require\s*\(\s*['"\`]([^'"\`]+)['"\`]\s*\)`,
  
  withAssert: String.raw`import\s+[^from]+\s+from\s*['"\`]([^'"\`]+)['"\`]\s*assert\s*\{[^}]*\}`,
  
  sourcePhase: String.raw`import\s+source\s+\w+\s+from\s*['"\`]([^'"\`]+)['"\`]`,
  
  dynamicSource: String.raw`import\.source\s*\(\s*['"\`]([^'"\`]+)['"\`]\s*\)`,
};

export const COMBINED_PATTERN = '(import|require)';

export const TYPE_ONLY_PATTERN = String.raw`import\s+type\s+`;

export const REEXPORT_PATTERNS = [
  String.raw`export\s*\*\s*from`,
  String.raw`export\s*\{[^}]*\}\s*from`,
];

export function isRelativeImport(importPath: string): boolean {
  return importPath.startsWith('./') || importPath.startsWith('../');
}

export function isExternalDependency(importPath: string): boolean {
  return !isRelativeImport(importPath) && !importPath.startsWith('@/') && !importPath.startsWith('~');
}

export function shouldSkipImport(line: string): boolean {
  if (REEXPORT_PATTERNS.some(pattern => new RegExp(pattern).test(line))) {
    return true;
  }
  
  if (new RegExp(TYPE_ONLY_PATTERN).test(line)) {
    return true;
  }
  
  const hasVariable = /import\s*\(\s*[^'"\`]/.test(line);
  const hasTemplateLiteral = /import\s*\(\s*`.*\$\{/.test(line);
  if (hasVariable || hasTemplateLiteral) {
    return true;
  }
  
  return false;
}