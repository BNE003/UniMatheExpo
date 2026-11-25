/** Minimale Typen für pngjs (kommt über @expo/image-utils mit; nur von tools/build-icons.ts genutzt). */
declare module 'pngjs' {
  export class PNG {
    constructor(options?: { width?: number; height?: number });
    width: number;
    height: number;
    data: Buffer;
    static sync: {
      read(buffer: Buffer): PNG;
      write(png: PNG): Buffer;
    };
  }
}
