# modgraph - Same-Day Development Roadmap

## 📋 Project Overview
**Tool Name**: `modgraph`
**Goal**: Build a TypeScript CLI tool that generates module dependency graphs from JS/TS codebases
**Timeline**: Today (6-8 hours)
**Tech Stack**: TypeScript, vscode-ripgrep, Node.js

---

## 🚀 Phase 1: Project Setup (30 minutes)
- [ ] Initialize new TypeScript project (`modgraph`)
- [ ] Set up package.json with CLI bin entry for `modgraph`
- [ ] Install dependencies:
  - `@vscode/ripgrep` 
  - `typescript`, `@types/node`
  - `commander` (CLI framework)
  - `vitest` (testing)
- [ ] Configure TypeScript (tsconfig.json)
- [ ] Set up basic project structure

---

## 🔍 Phase 2: Core Parsing Engine (2 hours)
- [ ] Create regex patterns for import/require detection:
  - Dynamic imports: `import('...')`
  - Named imports: `import { a, b } from '...'`
  - Default imports: `import x from '...'`
  - Alias imports: `import { x as y } from '...'`
  - Mixed imports: `import x, { y } from '...'`
  - Require statements: `require('...')`
  - **Edge cases**:
    - Unicode in module names: `import { name } from 'mod\\u1011'`
    - Type assertions: `import json from './json.json' assert { type: 'json' }`
    - Comments in dynamic imports: `import /*comment!*/ ('asdf', { assert: { type: 'json' }})`
    - import.meta with comments: `import /*comment!*/.meta.asdf`
    - Source phase imports: `import source mod from './mod.wasm'`
    - Dynamic source imports: `import.source('./mod.wasm')`
- [ ] Implement ripgrep integration
- [ ] Build file content parser
- [ ] Handle TypeScript path aliases (tsconfig.json parsing)

---

## 🌳 Phase 3: Graph Builder (1.5 hours)
- [ ] Design module graph data structure
- [ ] Implement dependency resolution
- [ ] Handle circular dependencies
- [ ] Identify root nodes (entry points)
- [ ] Build tree-like JSON output format

---

## 🛠 Phase 4: CLI Interface (1 hour)
- [ ] Implement commander.js CLI
- [ ] Add command-line options:
  - `[files...]` (optional entry points to parse, defaults to scanning all)
  - `--output` (output file, default stdout)
  - `--config` (custom tsconfig path)
  - `--exclude` (ignore patterns)
- [ ] Add help text and usage examples
- [ ] Handle multiple entry points: `npx modgraph ./file1.tsx ./file2.js`

---

## ✅ Phase 5: Testing & Validation (1 hour)
- [ ] Create test fixtures (sample TS/JS projects)
- [ ] Unit tests for parsing functions
- [ ] Integration tests for full workflow
- [ ] Test edge cases:
  - Circular imports
  - Missing files
  - Invalid syntax
  - Path aliases
  - Unicode module names
  - Type assertions
  - Comments in imports
  - Source phase imports

---

## 📦 Phase 6: NPM Publishing (1 hour)
- [ ] Build production bundle
- [ ] Create README.md with:
  - Installation instructions (`npm install -g modgraph`)
  - Usage examples (`npx modgraph`, `npx modgraph ./src/index.ts`)
  - API documentation
- [ ] Set up npm publishing workflow
- [ ] Version and publish `modgraph` to NPM
- [ ] Test installation from NPM (`npm install -g modgraph`)

---

## 🔧 Key Implementation Notes

### Regex Patterns Needed
```typescript
// Import patterns to handle (including edge cases)
const IMPORT_PATTERNS = {
  // Standard patterns
  dynamic: /import\s*\(\s*['"`]([^'"`]+)['"`]\s*(?:,\s*\{[^}]*\})?\s*\)/g,
  named: /import\s*\{([^}]+)\}\s*from\s*['"`]([^'"`]+)['"`]/g,
  default: /import\s+(\w+)\s*from\s*['"`]([^'"`]+)['"`]/g,
  mixed: /import\s+(\w+)\s*,\s*\{([^}]+)\}\s*from\s*['"`]([^'"`]+)['"`]/g,
  require: /(?:const|let|var)\s+(?:\{([^}]+)\}|\w+)\s*=\s*require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
  
  // Edge cases
  withAssert: /import\s+[^from]+\s+from\s*['"`]([^'"`]+)['"`]\s*assert\s*\{[^}]*\}/g,
  sourcePhase: /import\s+source\s+\w+\s+from\s*['"`]([^'"`]+)['"`]/g,
  dynamicSource: /import\.source\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
  withComments: /import\s*\/\*[^*]*\*\/\s*\(\s*['"`]([^'"`]+)['"`][^)]*\)/g,
  importMeta: /import\s*\/\*[^*]*\*\/\s*\.meta/g
};
```

### Output Format
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

---

## ⚡ Quick Start Commands
```bash
# 1. Project setup
npm init -y && npm install typescript @vscode/ripgrep commander vitest

# 2. Development
npm run dev -- ./src/index.ts ./src/cli.ts

# 3. Testing
npm run test

# 4. Publishing
npm run build && npm publish

# 5. Usage after publishing
npm install -g modgraph
modgraph ./src/index.ts
```

---

## 🎯 Success Criteria
- [ ] Can parse 10,000+ files in under 5 seconds
- [ ] Handles all major import/require patterns
- [ ] Generates valid JSON module graph
- [ ] Published and installable via NPM
- [ ] Works with TypeScript path aliases
- [ ] Clear documentation and examples