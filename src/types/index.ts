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
  cwd?: string;
  output?: string;
  config?: string;
  exclude?: string[];
  include?: string[];
  debug?: boolean;
}

export interface ProcessedImport {
  fromFile: string;
  toFile: string;
}