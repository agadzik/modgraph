import { existsSync } from 'fs';
import { resolve, dirname, relative, extname } from 'path';
import { isRelativeImport } from './patterns';
import { tsconfigResolverSync } from 'tsconfig-resolver';

export interface TsConfigPaths {
  baseUrl?: string;
  paths?: Record<string, string[]>;
}

export class PathResolver {
  private tsConfigPaths: TsConfigPaths = {};
  private projectRoot: string;
  
  constructor(projectRoot: string, tsConfigPath?: string) {
    this.projectRoot = projectRoot;
    this.loadTsConfig(tsConfigPath);
  }
  
  private loadTsConfig(tsConfigPath?: string): void {
    try {
      // Use tsconfig-resolver to find and parse the tsconfig
      const result = tsConfigPath 
        ? tsconfigResolverSync({ filePath: tsConfigPath })
        : tsconfigResolverSync({ cwd: this.projectRoot });
      
      if (!result.exists) {
        return;
      }
      
      const config = result.config;
      
      if (config.compilerOptions) {
        this.tsConfigPaths = {
          baseUrl: config.compilerOptions.baseUrl,
          paths: config.compilerOptions.paths || {}
        };
        
        // If baseUrl is relative, resolve it relative to the tsconfig directory
        if (this.tsConfigPaths.baseUrl) {
          const tsConfigDir = dirname(result.path);
          this.tsConfigPaths.baseUrl = resolve(tsConfigDir, this.tsConfigPaths.baseUrl);
        }
      }
    } catch (err) {
      // Silently fail - tsconfig is optional
    }
  }
  
  resolveImport(importPath: string, fromFile: string): string | null {
    if (isRelativeImport(importPath)) {
      return this.resolveRelativeImport(importPath, fromFile);
    }
    
    return this.resolveTsConfigAlias(importPath, fromFile);
  }
  
  private resolveRelativeImport(importPath: string, fromFile: string): string | null {
    const fromDir = dirname(fromFile);
    const resolved = resolve(fromDir, importPath);
    
    const possiblePaths = this.getPossibleFilePaths(resolved);
    
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        return relative(this.projectRoot, path);
      }
    }
    
    return relative(this.projectRoot, resolved);
  }
  
  private resolveTsConfigAlias(importPath: string, fromFile: string): string | null {
    if (!this.tsConfigPaths.paths) {
      return null;
    }
    
    
    for (const [alias, replacements] of Object.entries(this.tsConfigPaths.paths)) {
      const aliasPattern = this.createAliasPattern(alias);
      const match = importPath.match(aliasPattern);
      
      if (match) {
        const wildcard = match[1] || '';
        
        for (const replacement of replacements) {
          const resolvedPath = replacement.replace('*', wildcard);
          const basePath = this.tsConfigPaths.baseUrl
            ? resolve(this.tsConfigPaths.baseUrl, resolvedPath)
            : resolve(this.projectRoot, resolvedPath);
          
          const possiblePaths = this.getPossibleFilePaths(basePath);
          
          for (const path of possiblePaths) {
            if (existsSync(path)) {
              return relative(this.projectRoot, path);
            }
          }
        }
      }
    }
    
    return null;
  }
  
  private createAliasPattern(alias: string): RegExp {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = escaped.replace(/\\\*/g, '(.*)');
    return new RegExp(`^${pattern}$`);
  }
  
  private getPossibleFilePaths(basePath: string): string[] {
    if (extname(basePath)) {
      return [basePath];
    }
    
    return [
      basePath + '.ts',
      basePath + '.tsx',
      basePath + '.js',
      basePath + '.jsx',
      basePath + '.mjs',
      resolve(basePath, 'index.ts'),
      resolve(basePath, 'index.tsx'),
      resolve(basePath, 'index.js'),
      resolve(basePath, 'index.jsx'),
      resolve(basePath, 'index.mjs'),
    ];
  }
  
  getRelativePath(absolutePath: string): string {
    return relative(this.projectRoot, absolutePath);
  }
}