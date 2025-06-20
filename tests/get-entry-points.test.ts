import { describe, it, expect } from 'vitest';
import { generateDependencyGraph, getEntryPointsForFiles } from '../src/index';
import { resolve } from 'path';

describe('getEntryPointsForFiles', () => {
  it('should find entry points for files in simple project', async () => {
    const fixtureDir = resolve(__dirname, 'fixtures/simple-project');
    
    const graph = await generateDependencyGraph({
      directory: fixtureDir,
      excludePatterns: []
    });
    
    // Test finding entry points for helper.js
    const entryPoints = getEntryPointsForFiles(['src/helper.js'], graph);
    expect(entryPoints).toEqual(['src/index.js']);
  });

  it('should find entry points for multiple files', async () => {
    const fixtureDir = resolve(__dirname, 'fixtures/simple-project');
    
    const graph = await generateDependencyGraph({
      directory: fixtureDir,
      excludePatterns: []
    });
    
    // Test finding entry points for both helper.js and utils.js
    const entryPoints = getEntryPointsForFiles(['src/helper.js', 'src/utils.js'], graph);
    expect(entryPoints).toEqual(['src/index.js']);
  });

  it('should return the file itself if it is an entry point', async () => {
    const fixtureDir = resolve(__dirname, 'fixtures/simple-project');
    
    const graph = await generateDependencyGraph({
      directory: fixtureDir,
      excludePatterns: []
    });
    
    // Test with the entry point file itself
    const entryPoints = getEntryPointsForFiles(['src/index.js'], graph);
    expect(entryPoints).toEqual(['src/index.js']);
  });

  it('should handle non-existent files gracefully', async () => {
    const fixtureDir = resolve(__dirname, 'fixtures/simple-project');
    
    const graph = await generateDependencyGraph({
      directory: fixtureDir,
      excludePatterns: []
    });
    
    // Test with non-existent file
    const entryPoints = getEntryPointsForFiles(['src/non-existent.js'], graph);
    expect(entryPoints).toEqual([]);
  });

  it('should handle mixed existing and non-existing files', async () => {
    const fixtureDir = resolve(__dirname, 'fixtures/simple-project');
    
    const graph = await generateDependencyGraph({
      directory: fixtureDir,
      excludePatterns: []
    });
    
    // Test with mix of existing and non-existing files
    const entryPoints = getEntryPointsForFiles(['src/helper.js', 'src/non-existent.js'], graph);
    expect(entryPoints).toEqual(['src/index.js']);
  });

  it('should work with filtered entry points', async () => {
    const fixtureDir = resolve(__dirname, 'fixtures/simple-project');
    
    // Generate graph with utils.js as entry point
    const graph = await generateDependencyGraph({
      directory: fixtureDir,
      entryPoints: [resolve(fixtureDir, 'src/utils.js')],
      excludePatterns: []
    });
    
    // Test finding entry points for helper.js (should find utils.js)
    const entryPoints = getEntryPointsForFiles(['src/helper.js'], graph);
    expect(entryPoints).toEqual(['src/utils.js']);
  });

  it('should handle circular dependencies', async () => {
    const fixtureDir = resolve(__dirname, 'fixtures/edge-cases');
    
    const graph = await generateDependencyGraph({
      directory: fixtureDir,
      excludePatterns: []
    });
    
    // Test with circular dependency files
    const entryPoints = getEntryPointsForFiles(['circular-a.ts'], graph);
    expect(entryPoints).toContain('edge-cases-importer.ts');
  });

  it('should handle deeply nested dependencies', async () => {
    const fixtureDir = resolve(__dirname, 'fixtures/path-aliases');
    
    const graph = await generateDependencyGraph({
      directory: fixtureDir,
      tsConfigPath: resolve(fixtureDir, 'tsconfig.json'),
      excludePatterns: []
    });
    
    // Test finding entry points for a deeply nested utility
    const entryPoints = getEntryPointsForFiles(['src/utils/logger.ts'], graph);
    expect(entryPoints).toContain('src/index.ts');
  });

  it('should return unique entry points when multiple paths lead to same entry', async () => {
    const fixtureDir = resolve(__dirname, 'fixtures/simple-project');
    
    const graph = await generateDependencyGraph({
      directory: fixtureDir,
      excludePatterns: []
    });
    
    // Both helper.js and utils.js lead to index.js
    const entryPoints = getEntryPointsForFiles(['src/helper.js', 'src/utils.js'], graph);
    expect(entryPoints).toEqual(['src/index.js']);
    expect(entryPoints.length).toBe(1); // Should not duplicate index.js
  });

  it('should sort entry points consistently', async () => {
    const fixtureDir = resolve(__dirname, 'fixtures/edge-cases');
    
    const graph = await generateDependencyGraph({
      directory: fixtureDir,
      excludePatterns: []
    });
    
    // Find entry points for multiple files that might have different entry points
    const entryPoints = getEntryPointsForFiles(['types.ts', 'utils/logging.ts'], graph);
    
    // Verify that results are sorted
    const sortedEntryPoints = [...entryPoints].sort();
    expect(entryPoints).toEqual(sortedEntryPoints);
  });
});