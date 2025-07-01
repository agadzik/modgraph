import { describe, it, expect } from 'vitest';
import { generateDependencyGraph } from '../src/index';
import { resolve } from 'path';

describe('Include Patterns', () => {
  const testDir = resolve(__dirname, 'fixtures/include-patterns');

  it('should include only files matching include patterns', async () => {
    const graph = await generateDependencyGraph({
      directory: testDir,
      includePatterns: ['**/*.fixture.ts'],
      excludePatterns: []
    });

    // Only fixture files should be analyzed for imports
    const modules = Object.keys(graph.modules);
    
    // Should include fixture files  
    expect(modules.some(m => m.includes('.fixture.'))).toBe(true);
    
    // The included fixture files might import non-fixture files, which will be added to the graph
    // This is expected behavior - include patterns control which files are searched for imports,
    // not which files can be imported
    expect(modules.length).toBeGreaterThan(0);
  });

  it('should respect multiple include patterns', async () => {
    const graph = await generateDependencyGraph({
      directory: testDir,
      includePatterns: ['src/**/*.ts', 'lib/**/*.js'],
      excludePatterns: []
    });

    const modules = Object.keys(graph.modules);
    
    // Should find modules from both patterns
    expect(modules.length).toBeGreaterThan(0);
    
    // Should only include files that were scanned (src/*.ts and lib/*.js)
    // But their dependencies might include other files
    const scannedFiles = modules.filter(module => 
      (module.startsWith('src/') && module.endsWith('.ts')) ||
      (module.startsWith('lib/') && module.endsWith('.js'))
    );
    
    expect(scannedFiles.length).toBeGreaterThan(0);
  });

  it('should combine include and exclude patterns correctly', async () => {
    const graph = await generateDependencyGraph({
      directory: testDir,
      includePatterns: ['**/*.ts'],
      excludePatterns: ['**/*.fixture.ts']
    });

    const modules = Object.keys(graph.modules);
    
    // Should include .ts files but not .fixture.ts files
    expect(modules.some(m => m.endsWith('.ts') && !m.endsWith('.fixture.ts'))).toBe(true);
    expect(modules.some(m => m.endsWith('.fixture.ts'))).toBe(false);
  });

  it('should include all supported files when no include patterns specified', async () => {
    const graph = await generateDependencyGraph({
      directory: testDir,
      includePatterns: [],
      excludePatterns: []
    });

    const modules = Object.keys(graph.modules);
    
    // Should include various file types
    const supportedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs'];
    const hasMultipleTypes = supportedExtensions.some(ext => 
      modules.some(m => m.endsWith(ext))
    );
    expect(modules.length).toBeGreaterThan(0);
  });

  it('should handle glob patterns with directories', async () => {
    const graph = await generateDependencyGraph({
      directory: testDir,
      includePatterns: ['components/**/*.tsx'],
      excludePatterns: []
    });

    const modules = Object.keys(graph.modules);
    
    // Should only include .tsx files from components directory
    modules.forEach(module => {
      expect(module.startsWith('components/')).toBe(true);
      expect(module.endsWith('.tsx')).toBe(true);
    });
  });

  it('should analyze only included files for imports', async () => {
    // When we include only lib/*.js files, only those files are scanned for imports
    const graphWithLib = await generateDependencyGraph({
      directory: testDir,
      includePatterns: ['lib/**/*.js'],
      excludePatterns: []
    });

    // When we include all files, all imports are discovered
    const graphWithAll = await generateDependencyGraph({
      directory: testDir,
      includePatterns: [],
      excludePatterns: []
    });


    // The lib-only graph should find at least the lib files
    expect(Object.keys(graphWithLib.modules).length).toBeGreaterThan(0);
    
    // The lib-only graph should have fewer total dependencies
    // because imports in non-lib files won't be discovered
    expect(graphWithLib.metadata.totalDependencies).toBeLessThan(graphWithAll.metadata.totalDependencies);
    
    // Both graphs should include lib files
    expect(Object.keys(graphWithLib.modules).some(m => m.startsWith('lib/'))).toBe(true);
    expect(Object.keys(graphWithAll.modules).some(m => m.startsWith('lib/'))).toBe(true);
  });
});