export class Logger {
  log(message: string): void {
    console.log(message);
  }
}

export class FileLogger extends Logger {}
export class ConsoleLogger extends Logger {}
export class RemoteLogger extends Logger {}