declare module 'express' {
  export interface Request {
    user?: any;
    headers: Record<string, string>;
    body: any;
    params: Record<string, string>;
    file?: any;
    files?: any;
  }
  export interface Response {
    status(code: number): Response;
    json(body: any): Response;
    send(body: any): Response;
    end(): void;
    setHeader(name: string, value: string): void;
  }
  export interface NextFunction {
    (err?: any): void;
  }
  export interface Router {
    get(path: string, ...handlers: Function[]): void;
    post(path: string, ...handlers: Function[]): void;
    put(path: string, ...handlers: Function[]): void;
    delete(path: string, ...handlers: Function[]): void;
  }
  export interface Express {
    use(middleware: Function): void;
    use(path: string, middleware: Function): void;
    get(path: string, ...handlers: Function[]): void;
    post(path: string, ...handlers: Function[]): void;
    put(path: string, ...handlers: Function[]): void;
    delete(path: string, ...handlers: Function[]): void;
    listen(port: number, callback?: Function): void;
    json(): Function;
    urlencoded(options: { extended: boolean }): Function;
    static(path: string): Function;
    Router(): Router;
  }
  const app: Express;
  export default app;
}

declare module 'jsonwebtoken' {
  export class JsonWebTokenError extends Error {}
  export class TokenExpiredError extends Error {}
  export function sign(payload: any, secret: string, options?: any): string;
  export function verify(token: string, secret: string, options?: any): any;
}

declare module 'multer' {
  import { Request } from 'express';
  export interface File {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    destination: string;
    filename: string;
    path: string;
    size: number;
  }
  export interface MulterRequest extends Request {
    file?: File;
    files?: { [fieldname: string]: File[] };
  }
  export interface StorageEngine {
    _handleFile(req: Request, file: File, callback: (error?: any, info?: Partial<File>) => void): void;
    _removeFile(req: Request, file: File, callback: (error: Error) => void): void;
  }
  export interface Options {
    dest?: string;
    storage?: StorageEngine;
    limits?: {
      fieldNameSize?: number;
      fieldSize?: number;
      fields?: number;
      fileSize?: number;
      files?: number;
      parts?: number;
      headerPairs?: number;
    };
    fileFilter?(req: Request, file: File, callback: (error: Error | null, acceptFile: boolean) => void): void;
  }
  export function diskStorage(options: {
    destination: string | ((req: Request, file: File, callback: (error: Error | null, destination: string) => void) => void);
    filename: (req: Request, file: File, callback: (error: Error | null, filename: string) => void) => void;
  }): StorageEngine;
  export default function(options?: Options): any;
} 