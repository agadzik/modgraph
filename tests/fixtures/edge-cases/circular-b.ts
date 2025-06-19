import { aFunction } from './circular-a';

export function bFunction() {
  return "B function";
}

export function callA() {
  return aFunction();
}