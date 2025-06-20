import { searchImports } from './utils/ripgrep';
import { searchImportsInFile } from './utils/ripgrep-file';
import { PathResolver } from './utils/resolver';
import { GraphBuilder } from './core/graphBuilder';
import { DependencyGraph } from './types';
import { existsSync } from 'fs';

export interface GenerateOptions {
  directory: string;
  entryPoints?: string[];
  tsConfigPath?: string;
  excludePatterns?: string[];
  debug?: boolean;
}

export function getEntryPointsForFiles(filePaths: string[], graph: DependencyGraph): string[] {
  const entryPoints = new Set<string>();
  
  for (const filePath of filePaths) {
    const visited = new Set<string>();
    
    const findEntryPoints = (currentFile: string) => {
      if (visited.has(currentFile)) return;
      visited.add(currentFile);
      
      const module = graph.modules[currentFile];
      if (!module) return;
      
      if (module.dependents.length === 0) {
        entryPoints.add(currentFile);
        return;
      }
      
      for (const dependent of module.dependents) {
        findEntryPoints(dependent);
      }
    };
    
    findEntryPoints(filePath);
  }
  
  return Array.from(entryPoints).sort();
}

export async function generateDependencyGraph(options: GenerateOptions): Promise<DependencyGraph> {
  const { directory, entryPoints, tsConfigPath, excludePatterns = [], debug } = options;
  
  const resolver = new PathResolver(directory, tsConfigPath);
  const graphBuilder = new GraphBuilder(directory);
  
  const processedImports = new Set<string>();
  
  for await (const importResult of searchImports(directory, excludePatterns)) {
    const resolvedImport = resolver.resolveImport(importResult.importPath, importResult.filePath);
    
    
    if (!resolvedImport) {
      continue;
    }
    
    const fromFile = resolver.getRelativePath(importResult.filePath);
    const toFile = resolvedImport;
    
    const importKey = `${fromFile}:${toFile}`;
    if (processedImports.has(importKey)) {
      continue;
    }
    
    processedImports.add(importKey);
    graphBuilder.addDependency(fromFile, toFile);
  }
  
  let graph = graphBuilder.build();
  
  if (entryPoints && entryPoints.length > 0) {
    // Ensure entry point files are analyzed even if not found in initial scan
    for (const entryPoint of entryPoints) {
      if (existsSync(entryPoint)) {
        const entryRelative = resolver.getRelativePath(entryPoint);
        
        // If this entry isn't in the graph, scan it directly
        if (!graph.modules[entryRelative]) {
          
          let importCount = 0;
          let resolvedCount = 0;
          for await (const importResult of searchImportsInFile(entryPoint)) {
            importCount++;
            const resolvedImport = resolver.resolveImport(importResult.importPath, importResult.filePath);
            
            if (!resolvedImport) {
              continue;
            }
            resolvedCount++;
            
            const fromFile = resolver.getRelativePath(importResult.filePath);
            const toFile = resolvedImport;
            
            const importKey = `${fromFile}:${toFile}`;
            if (!processedImports.has(importKey)) {
              processedImports.add(importKey);
              graphBuilder.addDependency(fromFile, toFile);
            }
          }
          
          
          // Ensure the entry point itself is in the graph
          // We need to add a self-reference to ensure it's included
          // This will be cleaned up later
          graphBuilder.addDependency(entryRelative, entryRelative);
        }
      }
    }
    
    // Rebuild graph with any newly added dependencies
    graph = graphBuilder.build();
    
    const entryFiles = entryPoints.map(ep => resolver.getRelativePath(ep));
    
    // Clean up any self-references we added
    for (const entryFile of entryFiles) {
      if (graph.modules[entryFile]) {
        graph.modules[entryFile].dependencies = graph.modules[entryFile].dependencies.filter(dep => dep !== entryFile);
        graph.modules[entryFile].dependents = graph.modules[entryFile].dependents.filter(dep => dep !== entryFile);
      }
    }
    
    
    const reachableFiles = new Set<string>();
    
    const traverse = (file: string) => {
      if (reachableFiles.has(file)) return;
      reachableFiles.add(file);
      
      const module = graph.modules[file];
      if (module) {
        module.dependencies.forEach(dep => traverse(dep));
      }
    };
    
    entryFiles.forEach(entry => {
      // Even if the entry point isn't in the graph (no imports TO it),
      // we should still include it if it exists
      if (!graph.modules[entry]) {
        // Check if any module in the graph matches this entry point
        // This handles cases where the path might have special characters
        const normalizedEntry = entry.replace(/\\/g, '/');
        const matchingKey = Object.keys(graph.modules).find(key => 
          key.replace(/\\/g, '/') === normalizedEntry
        );
        if (matchingKey) {
          entry = matchingKey;
        }
      }
      traverse(entry);
    });
    
    const filteredModules: Record<string, typeof graph.modules[string]> = {};
    for (const file of reachableFiles) {
      if (graph.modules[file]) {
        filteredModules[file] = {
          dependencies: graph.modules[file].dependencies.filter(dep => reachableFiles.has(dep)),
          dependents: graph.modules[file].dependents.filter(dep => reachableFiles.has(dep))
        };
      }
    }
    
    const rootNodes = Object.keys(filteredModules).filter(
      file => filteredModules[file].dependents.length === 0
    );
    
    return {
      rootNodes: rootNodes.sort(),
      modules: filteredModules,
      metadata: {
        ...graph.metadata,
        totalFiles: Object.keys(filteredModules).length,
        totalDependencies: Object.values(filteredModules).reduce(
          (sum, mod) => sum + mod.dependencies.length, 
          0
        )
      }
    };
  }
  
  return graph;
}