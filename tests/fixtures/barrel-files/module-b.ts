// Module B - provides functionality that gets selectively re-exported
export function functionB() {
  return 'Function B executed';
}

export const constantB = 'Constant from module B';

export class ClassB {
  getName() {
    return 'Class B';
  }
}

export const namedExport = 'Named export from module B';

export function anotherFunction() {
  return 'Another function from module B';
}

export default function defaultB() {
  return 'Default export from module B';
}