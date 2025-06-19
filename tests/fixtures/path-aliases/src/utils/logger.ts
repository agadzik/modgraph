import { config } from '#config';
import type { Status } from '#types';

export class Logger {
  private prefix: string;
  
  constructor(prefix: string) {
    this.prefix = prefix;
  }
  
  log(message: string, status?: Status): void {
    if (config.environment === 'development') {
      console.log(`[${this.prefix}] ${message}`, status ? `(${status})` : '');
    }
  }
  
  error(message: string): void {
    console.error(`[${this.prefix}] ERROR: ${message}`);
  }
}