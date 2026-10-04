export class Logger {
  public static info(
    message: string,
    meta?: Record<string, unknown> | Error | string | number | boolean
  ): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] ${message}`, meta ? JSON.stringify(meta) : '');
  }

  public static warn(
    message: string,
    meta?: Record<string, unknown> | Error | string | number | boolean
  ): void {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] ${message}`, meta ? JSON.stringify(meta) : '');
  }

  public static error(
    message: string,
    meta?: Record<string, unknown> | Error | string | number | boolean
  ): void {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${message}`, meta ? JSON.stringify(meta) : '');
  }
}
