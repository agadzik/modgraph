#!/usr/bin/env node

import { program } from 'commander';
import { resolve } from 'path';
import { writeFileSync } from 'fs';
import ms from 'ms';
import { generateDependencyGraph } from './index';
import { CliOptions } from './types';
import { startMcpServer } from './mcp/server';

// Default command behavior (analyze)
const defaultAction = async (files: string[], options: CliOptions) => {
  try {
    const cwd = options.cwd ? resolve(process.cwd(), options.cwd) : process.cwd();
    const entryPoints = files.map(f => resolve(cwd, f));
    
    const startTime = Date.now();
    
    const graph = await generateDependencyGraph({
      directory: cwd,
      entryPoints: entryPoints.length > 0 ? entryPoints : undefined,
      tsConfigPath: options.config ? resolve(cwd, options.config) : undefined,
      excludePatterns: options.exclude || [],
      includePatterns: options.include || [],
      debug: options.debug
    });
    
    const output = JSON.stringify(graph, null, 2);
    
    if (options.output) {
      const outputPath = resolve(cwd, options.output);
      writeFileSync(outputPath, output, 'utf-8');
      console.log(`Dependency graph written to: ${outputPath}`);
    } else {
      console.log(output);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (options.debug) {
      console.log(`\nModule graph generated in ${ms(duration)}`);
    }
  } catch (error) {
    console.error('Error generating dependency graph:', error);
    process.exit(1);
  }
};

program
  .name('modgraph')
  .description('Generate module dependency graphs from JS/TS codebases')
  .version('1.0.0');

// Add MCP server command
program
  .command('mcp')
  .description('Start Model Context Protocol (MCP) server')
  .action(async () => {
    try {
      await startMcpServer();
    } catch (error) {
      console.error('Failed to start MCP server:', error);
      process.exit(1);
    }
  });

// Default command (when no subcommand is provided)
program
  .argument('[files...]', 'Entry point files to analyze (analyzes all files if not specified)')
  .option('-w, --cwd <path>', 'Working directory (defaults to current working directory)')
  .option('-o, --output <file>', 'Output file path (defaults to stdout)')
  .option('-c, --config <path>', 'Path to tsconfig.json (searches for tsconfig.json in project root if not specified)')
  .option('-e, --exclude <patterns...>', 'Glob patterns to exclude')
  .option('-i, --include <patterns...>', 'Glob patterns to include (if not specified, all supported files are included)')
  .option('-d, --debug', 'Show debug information including generation time')
  .action(defaultAction);

program.parse();