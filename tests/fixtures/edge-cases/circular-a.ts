import { bFunction } from './circular-b';

export function aFunction() {
  return "A function";
}

export function callB() {
  return bFunction();
}