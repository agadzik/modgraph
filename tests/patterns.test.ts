import { describe, it, expect } from 'vitest';
import { isRelativeImport, isExternalDependency, shouldSkipImport } from '../src/utils/patterns';

describe('Pattern Utils', () => {
  describe('isRelativeImport', () => {
    it('should identify relative imports', () => {
      expect(isRelativeImport('./foo')).toBe(true);
      expect(isRelativeImport('../bar')).toBe(true);
      expect(isRelativeImport('./deep/path')).toBe(true);
    });
    
    it('should not identify non-relative imports', () => {
      expect(isRelativeImport('lodash')).toBe(false);
      expect(isRelativeImport('@company/package')).toBe(false);
      expect(isRelativeImport('fs')).toBe(false);
    });
  });
  
  describe('isExternalDependency', () => {
    it('should identify external dependencies', () => {
      expect(isExternalDependency('lodash')).toBe(true);
      expect(isExternalDependency('react')).toBe(true);
      expect(isExternalDependency('fs')).toBe(true);
    });
    
    it('should not identify relative imports as external', () => {
      expect(isExternalDependency('./foo')).toBe(false);
      expect(isExternalDependency('../bar')).toBe(false);
    });
    
    it('should not identify alias imports as external', () => {
      expect(isExternalDependency('@/components')).toBe(false);
      expect(isExternalDependency('~/utils')).toBe(false);
    });
  });
  
  describe('shouldSkipImport', () => {
    it('should skip type-only imports', () => {
      expect(shouldSkipImport('import type { Foo } from "./foo"')).toBe(true);
    });
    
    it('should not skip re-exports (they create dependencies)', () => {
      expect(shouldSkipImport('export * from "./foo"')).toBe(false);
      expect(shouldSkipImport('export { bar } from "./foo"')).toBe(false);
    });
    
    it('should skip dynamic imports with variables', () => {
      expect(shouldSkipImport('import(someVar)')).toBe(true);
      expect(shouldSkipImport('import(`${path}/file`)')).toBe(true);
    });
    
    it('should not skip valid imports', () => {
      expect(shouldSkipImport('import { foo } from "./bar"')).toBe(false);
      expect(shouldSkipImport('import("./foo")')).toBe(false);
      expect(shouldSkipImport('const x = require("./bar")')).toBe(false);
    });
  });
});