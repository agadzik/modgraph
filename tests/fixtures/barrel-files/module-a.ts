// Module A - provides functionality that gets re-exported
export function functionA() {
  return 'Function A executed';
}

export const constantA = 'Constant from module A';

export class ClassA {
  getName() {
    return 'Class A';
  }
}

export default function defaultA() {
  return 'Default export from module A';
}