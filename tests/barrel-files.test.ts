import { describe, it, expect } from 'vitest';
import { generateDependencyGraph } from '../src/index';
import { resolve } from 'path';

describe('Barrel Files', () => {
  const fixtureDir = resolve(__dirname, 'fixtures/barrel-files');

  it('should detect dependencies from barrel files with export * syntax', async () => {
    const graph = await generateDependencyGraph({
      directory: fixtureDir,
      excludePatterns: []
    });

    // The barrel file (index.ts) should depend on module-a.ts due to "export * from './module-a'"
    expect(graph.modules['index.ts']).toBeDefined();
    expect(graph.modules['index.ts'].dependencies).toContain('module-a.ts');
  });

  it('should detect dependencies from barrel files with export { } syntax', async () => {
    const graph = await generateDependencyGraph({
      directory: fixtureDir,
      excludePatterns: []
    });

    // The barrel file (index.ts) should depend on module-b.ts due to "export { namedExport, functionB } from './module-b'"
    expect(graph.modules['index.ts']).toBeDefined();
    expect(graph.modules['index.ts'].dependencies).toContain('module-b.ts');
  });

  it('should detect dependencies from barrel files with default re-export syntax', async () => {
    const graph = await generateDependencyGraph({
      directory: fixtureDir,
      excludePatterns: []
    });

    // The barrel file should have both dependencies
    expect(graph.modules['index.ts'].dependencies).toEqual(
      expect.arrayContaining(['module-a.ts', 'module-b.ts'])
    );
  });

  it('should create proper dependency chain through barrel files', async () => {
    const graph = await generateDependencyGraph({
      directory: fixtureDir,
      excludePatterns: []
    });

    // Consumer should depend on the barrel file
    expect(graph.modules['consumer.ts']).toBeDefined();
    expect(graph.modules['consumer.ts'].dependencies).toContain('index.ts');

    // Barrel file should depend on both modules
    expect(graph.modules['index.ts'].dependencies).toEqual(
      expect.arrayContaining(['module-a.ts', 'module-b.ts'])
    );

    // The modules should list the barrel file as a dependent
    expect(graph.modules['module-a.ts'].dependents).toContain('index.ts');
    expect(graph.modules['module-b.ts'].dependents).toContain('index.ts');

    // The barrel file should list the consumer as a dependent
    expect(graph.modules['index.ts'].dependents).toContain('consumer.ts');
  });

  it('should not create direct dependencies from consumer to re-exported modules', async () => {
    const graph = await generateDependencyGraph({
      directory: fixtureDir,
      excludePatterns: []
    });

    // Consumer should only depend on the barrel file, not directly on module-a or module-b
    expect(graph.modules['consumer.ts'].dependencies).toEqual(['index.ts']);
    expect(graph.modules['consumer.ts'].dependencies).not.toContain('module-a.ts');
    expect(graph.modules['consumer.ts'].dependencies).not.toContain('module-b.ts');
  });

  it('should include all files in the dependency graph', async () => {
    const graph = await generateDependencyGraph({
      directory: fixtureDir,
      excludePatterns: []
    });

    // All files should be present in the graph
    const expectedFiles = ['consumer.ts', 'index.ts', 'module-a.ts', 'module-b.ts'];
    expectedFiles.forEach(file => {
      expect(graph.modules[file]).toBeDefined();
    });

    expect(Object.keys(graph.modules)).toHaveLength(4);
  });

  it('should identify consumer.ts as root node', async () => {
    const graph = await generateDependencyGraph({
      directory: fixtureDir,
      excludePatterns: []
    });

    // consumer.ts should be a root node (no dependents)
    expect(graph.rootNodes).toContain('consumer.ts');
    expect(graph.modules['consumer.ts'].dependents).toHaveLength(0);
  });

  it('should correctly count total dependencies', async () => {
    const graph = await generateDependencyGraph({
      directory: fixtureDir,
      excludePatterns: []
    });

    // Expected dependencies:
    // consumer.ts -> index.ts (1)
    // index.ts -> module-a.ts (1) 
    // index.ts -> module-b.ts (1)
    // Total: 3 dependencies
    expect(graph.metadata.totalDependencies).toBe(3);
  });
});