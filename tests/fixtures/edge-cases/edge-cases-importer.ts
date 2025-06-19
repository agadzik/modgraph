// This file tests all the edge cases mentioned in dev_roadmap.md

// Standard imports
import defaultExport from './unicode-module';
import { unicodeExport } from './unicode-module';
import mixedDefault, { unicodeExport as aliasedExport } from './unicode-module';

// Unicode in module names
import { name } from 'mod\u1011';

// Type assertions for JSON
import json from './json-data.json' assert { type: 'json' };
import jsonWithAttributes from "./json-data.json" with { type: "json" };

// Dynamic imports with comments
const dynamicWithComment = import /*comment!*/ ('./dynamic-module', { assert: { type: 'json' }});
const simpleDynamic = import('./dynamic-module');

// import.meta with comments
const metaUrl = import /*comment!*/.meta.url;
const metaProp = import /*another comment*/.meta.asdf;

// Source phase imports (Stage 3 proposal)
import source wasmSource from './wasm-module.wasm';

// Dynamic source imports
const dynamicSource = import.source('./wasm-module.wasm');

// Circular imports
import { aFunction } from './circular-a';
import { bFunction } from './circular-b';

// Complex dynamic imports with multiline
const multilineDynamic = import(
  /* some comment */
  './dynamic-module'
  /* another comment */
);

// Require statements
const fs = require('fs');
const { readFile, writeFile } = require('fs/promises');
const path = require('path');

// Mixed require patterns
const lodash = require('lodash');
const { debounce, throttle } = require('lodash');

// Template literal imports (should be ignored by parser)
const templateImport = `import { fake } from 'not-real'`;

// Import in comments (should be ignored)
// import { commented } from 'should-not-parse';
/* import { blockComment } from 'also-should-not-parse'; */

// Import-like strings (should be ignored)
const importString = "import { stringImport } from 'string-module'";

// Import the multi-line imports test file
import { testMultiLineImports } from './multi-line-imports';

// Export statements to make this a module
export {
  defaultExport,
  unicodeExport,
  aliasedExport,
  aFunction,
  bFunction,
  testMultiLineImports
};