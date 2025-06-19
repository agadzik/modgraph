#!/usr/bin/env node

import { program } from 'commander';
import { resolve } from 'path';
import { writeFileSync } from 'fs';
import ms from 'ms';
import { generateDependencyGraph } from './index';
import { CliOptions } from './types';

program
  .name('modgraph')
  .description('Generate module dependency graphs from JS/TS codebases')
  .version('0.1.0')
  .argument('[files...]', 'Entry point files to analyze (analyzes all files if not specified)')
  .option('-o, --output <file>', 'Output file path (defaults to stdout)')
  .option('-c, --config <path>', 'Path to tsconfig.json (searches for tsconfig.json in project root if not specified)')
  .option('-e, --exclude <patterns...>', 'Glob patterns to exclude')
  .option('-d, --debug', 'Show debug information including generation time')
  .action(async (files: string[], options: CliOptions) => {
    try {
      const cwd = process.cwd();
      const entryPoints = files.map(f => resolve(cwd, f));
      
      const startTime = Date.now();
      
      const graph = await generateDependencyGraph({
        directory: cwd,
        entryPoints: entryPoints.length > 0 ? entryPoints : undefined,
        tsConfigPath: options.config ? resolve(cwd, options.config) : undefined,
        excludePatterns: options.exclude || [],
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
  });

program.parse();