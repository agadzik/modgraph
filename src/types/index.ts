export interface ModuleNode {
  dependencies: string[];
  dependents: string[];
}

export interface DependencyGraph {
  rootNodes: string[];
  modules: Record<string, ModuleNode>;
  metadata: {
    cwd: string;
    totalFiles: number;
    totalDependencies: number;
    generatedAt: string;
  };
}

export interface CliOptions {
  output?: string;
  config?: string;
  exclude?: string[];
  debug?: boolean;
}

export interface ProcessedImport {
  fromFile: string;
  toFile: string;
}