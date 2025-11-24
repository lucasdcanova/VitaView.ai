declare module 'html-pdf-node' {
    export interface Options {
        format?: string;
        path?: string;
        printBackground?: boolean;
        margin?: {
            top?: string | number;
            right?: string | number;
            bottom?: string | number;
            left?: string | number;
        };
        [key: string]: any;
    }

    export interface File {
        url?: string;
        content?: string;
    }

    export function generatePdf(file: File, options: Options): Promise<Buffer>;
    export function generatePdf(file: File, options: Options, callback: (err: Error, buffer: Buffer) => void): void;
}
