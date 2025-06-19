import { describe, it, expect } from 'vitest';
import { generateDependencyGraph } from '../src/index';
import { resolve } from 'path';

describe('TypeScript Path Aliases', () => {
  it('should resolve path aliases from tsconfig.json', async () => {
    const testDir = resolve(__dirname, 'fixtures/path-aliases');
    const entryPoint = resolve(testDir, 'src/index.ts');
    const tsConfigPath = resolve(testDir, 'tsconfig.json');
    
    const graph = await generateDependencyGraph({
      directory: testDir,
      entryPoints: [entryPoint],
      tsConfigPath,
      excludePatterns: []
    });

    // The entry point key should be relative to testDir
    const entryKey = 'src/index.ts';
    
    // Verify the main file is in the graph
    expect(graph.modules[entryKey]).toBeDefined();
    
    // Check that path aliases are resolved to actual files
    const dependencies = graph.modules[entryKey].dependencies;
    
    // @services/* aliases
    expect(dependencies).toContain('src/services/userService.ts');
    expect(dependencies).toContain('src/services/productService.ts');
    
    // @utils/* aliases
    expect(dependencies).toContain('src/utils/logger.ts');
    expect(dependencies).toContain('src/utils/validator.ts');
    
    // @components/* aliases
    expect(dependencies).toContain('src/components/UserCard.tsx');
    expect(dependencies).toContain('src/components/ProductList.tsx');
    
    // #config and #types aliases
    expect(dependencies).toContain('src/config/index.ts');
    expect(dependencies).toContain('src/types/index.ts');
    
    // Verify nested imports with aliases
    const loggerKey = 'src/utils/logger.ts';
    expect(graph.modules[loggerKey]).toBeDefined();
    expect(graph.modules[loggerKey].dependencies).toContain('src/config/index.ts');
    // Note: type-only imports are intentionally excluded from the dependency graph
    
    const validatorKey = 'src/utils/validator.ts';
    expect(graph.modules[validatorKey]).toBeDefined();
    expect(graph.modules[validatorKey].dependencies).toContain('src/types/index.ts');
    expect(graph.modules[validatorKey].dependencies).toContain('src/utils/logger.ts');
    
    // Verify component imports
    const userCardKey = 'src/components/UserCard.tsx';
    expect(graph.modules[userCardKey]).toBeDefined();
    expect(graph.modules[userCardKey].dependencies).toContain('src/types/index.ts');
    expect(graph.modules[userCardKey].dependencies).toContain('src/services/userService.ts');
    expect(graph.modules[userCardKey].dependencies).toContain('src/utils/logger.ts');
  });

  it('should handle multiple alias patterns for the same directory', async () => {
    const testDir = resolve(__dirname, 'fixtures/path-aliases');
    const entryPoint = resolve(testDir, 'src/index.ts');
    const tsConfigPath = resolve(testDir, 'tsconfig.json');
    
    const graph = await generateDependencyGraph({
      directory: testDir,
      entryPoints: [entryPoint],
      tsConfigPath,
      excludePatterns: []
    });

    const entryKey = 'src/index.ts';
    const dependencies = graph.modules[entryKey].dependencies;
    
    // Both @/* and ~/* should resolve to src/*
    // The index.ts file imports types using both patterns
    expect(dependencies).toContain('src/types/index.ts');
    expect(dependencies).toContain('src/config/index.ts');
    
    // Count should be 1 for each unique file (deduplication)
    const typesCount = dependencies.filter(d => d === 'src/types/index.ts').length;
    const configCount = dependencies.filter(d => d === 'src/config/index.ts').length;
    
    expect(typesCount).toBe(1);
    expect(configCount).toBe(1);
  });

  it('should build correct dependency graph with path aliases', async () => {
    const testDir = resolve(__dirname, 'fixtures/path-aliases');
    const entryPoint = resolve(testDir, 'src/index.ts');
    const tsConfigPath = resolve(testDir, 'tsconfig.json');
    
    const graph = await generateDependencyGraph({
      directory: testDir,
      entryPoints: [entryPoint],
      tsConfigPath,
      excludePatterns: []
    });

    // Verify the dependency relationships
    const userServiceKey = 'src/services/userService.ts';
    const loggerKey = 'src/utils/logger.ts';
    const typesKey = 'src/types/index.ts';
    
    // UserService should depend on types, validator, logger, and config
    expect(graph.modules[userServiceKey].dependencies).toContain(typesKey);
    expect(graph.modules[userServiceKey].dependencies).toContain('src/utils/validator.ts');
    expect(graph.modules[userServiceKey].dependencies).toContain(loggerKey);
    expect(graph.modules[userServiceKey].dependencies).toContain('src/config/index.ts');
    
    // Logger should have userService as a dependent
    expect(graph.modules[loggerKey].dependents).toContain(userServiceKey);
    
    // Types should have multiple dependents
    expect(graph.modules[typesKey].dependents.length).toBeGreaterThan(3);
  });
});