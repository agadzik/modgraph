# modgraph

A fast TypeScript CLI tool that generates module dependency graphs from JavaScript/TypeScript codebases using ripgrep for blazing-fast performance.

## Features

- 🚀 Lightning fast - uses ripgrep for parallel file searching
- 📊 Generates comprehensive dependency graphs in JSON format
- 🔍 Supports both ES modules and CommonJS
- 🎯 Handles TypeScript path aliases from tsconfig.json
- 🌳 Identifies root nodes (entry points) automatically
- 📁 Works with .js, .jsx, .ts, .tsx, and .mjs files

## Installation

### Global Installation

```bash
npm install -g modgraph
```

### Using npx (no installation required)

You can use modgraph directly with npx without installing it:

```bash
npx modgraph
```

## Usage

### Basic Usage

Analyze all files in the current directory:

```bash
modgraph
# or with npx
npx modgraph
```

### Specify Entry Points

Analyze dependencies starting from specific files:

```bash
modgraph src/index.ts src/cli.ts
# or with npx
npx modgraph src/index.ts src/cli.ts
```

### Output to File

Save the dependency graph to a JSON file:

```bash
modgraph --output dependency-graph.json
# or with npx
npx modgraph --output dependency-graph.json
```

### Custom tsconfig.json

Use a custom TypeScript configuration file:

```bash
modgraph --config ./path/to/tsconfig.json
# or with npx
npx modgraph --config ./path/to/tsconfig.json
```

### Exclude Patterns

Exclude files matching glob patterns:

```bash
modgraph --exclude "**/*.test.ts" "**/*.spec.ts"
# or with npx
npx modgraph --exclude "**/*.test.ts" "**/*.spec.ts"
```

## Output Format

The tool generates a JSON object with the following structure:

```json
{
  "rootNodes": ["src/index.ts", "src/cli.ts"],
  "modules": {
    "src/index.ts": {
      "dependencies": ["src/utils/parser.ts", "lodash"],
      "dependents": []
    },
    "src/utils/parser.ts": {
      "dependencies": ["fs", "path"],
      "dependents": ["src/index.ts"]
    }
  },
  "metadata": {
    "cwd": "/home/user/my-project",
    "totalFiles": 42,
    "totalDependencies": 156,
    "generatedAt": "2025-06-19T10:30:00Z"
  }
}
```

### Field Descriptions

- **rootNodes**: Array of files that have no dependents (entry points)
- **modules**: Object mapping file paths to their dependencies and dependents
  - **dependencies**: Files that this module imports
  - **dependents**: Files that import this module
- **metadata**: Additional information about the scan
  - **cwd**: Current working directory
  - **totalFiles**: Number of files in the dependency graph
  - **totalDependencies**: Total number of import relationships
  - **generatedAt**: ISO timestamp of when the graph was generated

## Model Context Protocol (MCP) Support

modgraph includes built-in support for the Model Context Protocol, allowing AI assistants to analyze your codebase structure.

### Starting the MCP Server

```bash
modgraph mcp
# or with npx
npx modgraph mcp
```

This starts an MCP server via stdio that exposes the `analyze` tool.

### Using with Claude Desktop

Add the following to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "modgraph": {
      "command": "npx",
      "args": ["modgraph", "mcp"]
    }
  }
}
```

Or if you have modgraph installed globally:

```json
{
  "mcpServers": {
    "modgraph": {
      "command": "modgraph",
      "args": ["mcp"]
    }
  }
}
```

### Available Tools

#### `analyze`
Generates a module dependency graph with the following parameters:
- `directory` (required): The directory to analyze
- `entryPoints` (optional): Specific entry point files to analyze
- `tsConfigPath` (optional): Path to tsconfig.json
- `excludePatterns` (optional): Glob patterns to exclude
- `debug` (optional): Include debug information

Example usage in an AI assistant:
```
Use the analyze tool to understand the structure of /path/to/project
```

## Supported Import Patterns

The tool recognizes various import/require patterns:

### ES Modules
- Named imports: `import { foo } from './bar'`
- Default imports: `import foo from './bar'`
- Namespace imports: `import * as foo from './bar'`
- Dynamic imports: `import('./bar')`
- Side effect imports: `import './bar'`

### CommonJS
- Basic require: `const foo = require('./bar')`
- Destructured require: `const { foo } = require('./bar')`

### TypeScript Features
- Path aliases from tsconfig.json (e.g., `@utils/*`, `@/components`)
- Recognizes .ts, .tsx extensions
- Handles index file resolution

## Performance

modgraph is designed to handle large codebases efficiently:
- Can analyze 10,000+ files in under 5 seconds
- Uses ripgrep's parallel search capabilities
- Streams results to minimize memory usage

## Development

```bash
# Clone the repository
git clone https://github.com/yourusername/modgraph.git
cd modgraph

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.