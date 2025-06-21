// Barrel file - re-exports from other modules
// This should create dependencies: index.ts -> module-a.ts and index.ts -> module-b.ts

// Re-export everything from module A
export * from './module-a';

// Re-export specific items from module B
export { namedExport, functionB as renamedFunctionB } from './module-b';

// Re-export default with a new name
export { default as moduleADefault } from './module-a';

// Additional exports (not re-exports)
export const barrelConstant = 'Defined in barrel file';

export function barrelFunction() {
  return 'Function defined in barrel file';
}