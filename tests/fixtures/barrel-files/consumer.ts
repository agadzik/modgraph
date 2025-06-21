// Consumer that imports from the barrel file
// This should create dependency: consumer.ts -> index.ts

import { 
  functionA, 
  constantA, 
  ClassA, 
  namedExport, 
  renamedFunctionB,
  moduleADefault,
  barrelConstant,
  barrelFunction
} from './index';

export function useBarrelExports() {
  const instance = new ClassA();
  return {
    a: functionA(),
    constant: constantA,
    className: instance.getName(),
    named: namedExport,
    renamedB: renamedFunctionB(),
    defaultA: moduleADefault(),
    barrel: barrelConstant,
    barrelFunc: barrelFunction()
  };
}