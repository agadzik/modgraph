import { describe, it, expect } from 'vitest';
import { generateDependencyGraph } from '../src/index';
import { resolve } from 'path';

describe('Edge Cases', () => {
  it('should handle all edge cases mentioned in dev_roadmap.md', async () => {
    const testDir = resolve(__dirname, 'fixtures/edge-cases');
    const entryPoint = resolve(testDir, 'edge-cases-importer.ts');
    const tsConfigPath = resolve(testDir, 'tsconfig.json');
    
    const graph = await generateDependencyGraph({
      directory: testDir,
      entryPoints: [entryPoint],
      tsConfigPath,
      excludePatterns: []
    });

    // The entry point key in the graph will be relative to testDir
    const entryKey = 'edge-cases-importer.ts';
    
    // Verify the main file is in the graph
    expect(graph.modules[entryKey]).toBeDefined();
    
    // Check standard imports
    const dependencies = graph.modules[entryKey].dependencies;
    
    // Should find unicode-module imports
    expect(dependencies).toContain('unicode-module.ts');
    
    // Should find JSON imports with assertions
    expect(dependencies).toContain('json-data.json');
    
    // Should find dynamic module imports
    expect(dependencies).toContain('dynamic-module.ts');
    
    // Should find WASM module imports
    expect(dependencies).toContain('wasm-module.wasm');
    
    // Should find circular imports
    expect(dependencies).toContain('circular-a.ts');
    expect(dependencies).toContain('circular-b.ts');
    
    // Verify circular dependencies are handled
    const circularAKey = 'circular-a.ts';
    const circularBKey = 'circular-b.ts';
    
    expect(graph.modules[circularAKey]).toBeDefined();
    expect(graph.modules[circularBKey]).toBeDefined();
    expect(graph.modules[circularAKey].dependencies).toContain(circularBKey);
    expect(graph.modules[circularBKey].dependencies).toContain(circularAKey);
    
    // Note: External modules (fs, lodash, etc.) and non-existent modules (mod\u1011) 
    // are not included in the current implementation
    
    // Should NOT find imports in comments or strings
    expect(dependencies).not.toContain('not-real');
    expect(dependencies).not.toContain('should-not-parse');
    expect(dependencies).not.toContain('also-should-not-parse');
    expect(dependencies).not.toContain('string-module');
    
    // Should find multi-line imports file
    expect(dependencies).toContain('multi-line-imports.ts');
    
    // Verify metadata
    expect(graph.metadata.totalFiles).toBeGreaterThan(0);
    expect(graph.metadata.totalDependencies).toBeGreaterThan(0);
    expect(graph.metadata.cwd).toBe(testDir);
  });

  it('should handle multi-line import statements', async () => {
    const testDir = resolve(__dirname, 'fixtures/edge-cases');
    const entryPoint = resolve(testDir, 'multi-line-imports.ts');
    const tsConfigPath = resolve(testDir, 'tsconfig.json');
    
    const graph = await generateDependencyGraph({
      directory: testDir,
      entryPoints: [entryPoint],
      tsConfigPath,
      excludePatterns: []
    });

    const entryKey = 'multi-line-imports.ts';
    expect(graph.modules[entryKey]).toBeDefined();
    
    const dependencies = graph.modules[entryKey].dependencies;
    
    // Should find all multi-line imports
    expect(dependencies).toContain('app/(flags)/server.ts');
    expect(dependencies).toContain('utils/validators.ts');
    expect(dependencies).toContain('utils/logging.ts');
    expect(dependencies).toContain('auth/utils.ts');
    expect(dependencies).toContain('dynamic-module.ts');
    expect(dependencies).toContain('components.ts');
    expect(dependencies).toContain('mixed-exports.ts');
    
    // Should NOT find type-only imports
    expect(dependencies).not.toContain('types.ts');
    
    // Should handle CommonJS require (external dependency, so not included)
    expect(dependencies).not.toContain('fs/promises');
    
    // Should handle React (external dependency, so not included)
    expect(dependencies).not.toContain('react');
  });

  it('should handle import patterns with complex syntax', async () => {
    const testDir = resolve(__dirname, 'fixtures/edge-cases');
    const entryPoint = resolve(testDir, 'edge-cases-importer.ts');
    const tsConfigPath = resolve(testDir, 'tsconfig.json');
    
    const graph = await generateDependencyGraph({
      directory: testDir,
      entryPoints: [entryPoint],
      tsConfigPath,
      excludePatterns: []
    });

    const entryKey = 'edge-cases-importer.ts';
    const dependencies = graph.modules[entryKey].dependencies;
    
    // Count occurrences of each import
    const moduleCount = dependencies.filter(d => d.includes('unicode-module')).length;
    const dynamicCount = dependencies.filter(d => d.includes('dynamic-module')).length;
    const jsonCount = dependencies.filter(d => d.includes('json-data.json')).length;
    const wasmCount = dependencies.filter(d => d.includes('wasm-module.wasm')).length;
    
    // Should handle multiple import styles for the same module
    expect(moduleCount).toBe(1); // Should deduplicate
    expect(dynamicCount).toBe(1); // Multiple dynamic imports of same module
    expect(jsonCount).toBe(1); // Both assert and with syntax
    expect(wasmCount).toBe(1); // Both source import and import.source()
  });
});