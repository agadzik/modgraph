import { describe, it, expect } from 'vitest';
import { generateDependencyGraph } from '../src/index';
import { resolve } from 'path';

describe('GraphBuilder', () => {
  it('should generate dependency graph for simple project', async () => {
    const fixtureDir = resolve(__dirname, 'fixtures/simple-project');
    
    const graph = await generateDependencyGraph({
      directory: fixtureDir,
      excludePatterns: []
    });
    
    expect(graph.rootNodes).toContain('src/index.js');
    expect(graph.modules['src/index.js']).toEqual({
      dependencies: ['src/helper.js', 'src/utils.js'],
      dependents: []
    });
    expect(graph.modules['src/helper.js']).toEqual({
      dependencies: [],
      dependents: ['src/index.js', 'src/utils.js']
    });
    expect(graph.modules['src/utils.js']).toEqual({
      dependencies: ['src/helper.js'],
      dependents: ['src/index.js']
    });
    expect(graph.metadata.totalFiles).toBe(3);
    expect(graph.metadata.totalDependencies).toBe(3);
  });
  
  it('should filter by entry points', async () => {
    const fixtureDir = resolve(__dirname, 'fixtures/simple-project');
    
    const graph = await generateDependencyGraph({
      directory: fixtureDir,
      entryPoints: [resolve(fixtureDir, 'src/utils.js')],
      excludePatterns: []
    });
    
    expect(graph.rootNodes).toContain('src/utils.js');
    expect(graph.modules['src/utils.js']).toBeDefined();
    expect(graph.modules['src/helper.js']).toBeDefined();
    expect(graph.modules['src/index.js']).toBeUndefined();
    expect(graph.metadata.totalFiles).toBe(2);
  });
});