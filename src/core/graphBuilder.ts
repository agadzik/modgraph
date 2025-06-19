import { DependencyGraph, ModuleNode, ProcessedImport } from '../types';

export class GraphBuilder {
  private modules: Map<string, ModuleNode> = new Map();
  private projectRoot: string;
  
  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }
  
  addDependency(fromFile: string, toFile: string): void {
    this.ensureModule(fromFile);
    this.ensureModule(toFile);
    
    const fromModule = this.modules.get(fromFile)!;
    const toModule = this.modules.get(toFile)!;
    
    if (!fromModule.dependencies.includes(toFile)) {
      fromModule.dependencies.push(toFile);
    }
    
    if (!toModule.dependents.includes(fromFile)) {
      toModule.dependents.push(fromFile);
    }
  }
  
  private ensureModule(filePath: string): void {
    if (!this.modules.has(filePath)) {
      this.modules.set(filePath, {
        dependencies: [],
        dependents: []
      });
    }
  }
  
  getRootNodes(): string[] {
    const rootNodes: string[] = [];
    
    for (const [filePath, module] of this.modules) {
      if (module.dependents.length === 0) {
        rootNodes.push(filePath);
      }
    }
    
    return rootNodes.sort();
  }
  
  build(): DependencyGraph {
    const modules: Record<string, ModuleNode> = {};
    
    for (const [filePath, module] of this.modules) {
      modules[filePath] = {
        dependencies: [...module.dependencies].sort(),
        dependents: [...module.dependents].sort()
      };
    }
    
    const totalDependencies = Array.from(this.modules.values())
      .reduce((sum, module) => sum + module.dependencies.length, 0);
    
    return {
      rootNodes: this.getRootNodes(),
      modules,
      metadata: {
        cwd: this.projectRoot,
        totalFiles: this.modules.size,
        totalDependencies,
        generatedAt: new Date().toISOString()
      }
    };
  }
  
  getCircularDependencies(): string[][] {
    const visited = new Set<string>();
    const stack = new Set<string>();
    const cycles: string[][] = [];
    
    const dfs = (node: string, path: string[]): void => {
      if (stack.has(node)) {
        const cycleStart = path.indexOf(node);
        if (cycleStart !== -1) {
          cycles.push(path.slice(cycleStart));
        }
        return;
      }
      
      if (visited.has(node)) {
        return;
      }
      
      visited.add(node);
      stack.add(node);
      path.push(node);
      
      const module = this.modules.get(node);
      if (module) {
        for (const dep of module.dependencies) {
          dfs(dep, [...path]);
        }
      }
      
      stack.delete(node);
    };
    
    for (const node of this.modules.keys()) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }
    
    return cycles;
  }
}