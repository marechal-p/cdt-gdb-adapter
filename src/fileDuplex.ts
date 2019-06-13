/*********************************************************************
 * Copyright (c) 2019 Ericsson and others
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *********************************************************************/
import * as fs from 'fs';
import * as stream from 'stream';

/**
 * Handle files/fds as a `stream.Duplex`.
 */
export class FileDuplex extends stream.Duplex {

    public static MIN_BUFFER_SIZE = 1024; // 1 << 10
    public static DEFAULT_BUFFER_SIZE = 65536; // 1 << 16

    /**
     * Open a file from a file system path. Asynchronous.
     *
     * @param path File system path of the file to open.
     * @param flags https://nodejs.org/docs/latest-v10.x/api/fs.html#fs_file_system_flags.
     * @param mode UNIX like file mode (e.g. 0o666).
     */
    public static FromPath(path: string, flags?: string | number, mode?: number): Promise<FileDuplex> {
        return new Promise((resolve, reject) => fs.open(path, flags!, mode, (error, fd) => {
            if (error) {
                reject(error);
            } else {
                resolve(new this(fd));
            }
        }));
    }

    /**
     * Open a file from a file system path. Synchronous.
     *
     * @param path File system path of the file to open.
     * @param flags https://nodejs.org/docs/latest-v10.x/api/fs.html#fs_file_system_flags.
     * @param mode UNIX like file mode (e.g. 0o666).
     */
    public static FromPathSync(path: string, flags?: string | number, mode?: number): FileDuplex {
        return new this(fs.openSync(path, flags!, mode));
    }

    /**
     * Wraps a file descriptor in a `stream.Duplex`.
     *
     * @param fd File descriptor.
     */
    public static FromFd(fd: number): FileDuplex {
        return new this(fd);
    }

    /**
     * Buffer to store data when reading.
     */
    protected buffer: Buffer;

    protected constructor(
        public readonly fd: number,
        bufferSize: number = FileDuplex.DEFAULT_BUFFER_SIZE,
    ) {
        super();
        this.buffer = Buffer.alloc(Math.max(bufferSize, FileDuplex.MIN_BUFFER_SIZE));
    }

    public get bufferSize(): number {
        return this.buffer.length;
    }

    public _write(str: string, encoding: string, callback: (error?: Error | null) => void): void {
        fs.write(this.fd, Buffer.from(str, encoding), callback);
    }

    public _read(size: number): void {
        fs.read(this.fd, this.buffer, 0, Math.min(this.buffer.length, size), null,
            (error, bytesRead, readBuffer) => {
                if (error) {
                    this._throw(error);
                } else {
                    this.push(readBuffer.slice(0, bytesRead));
                }
            },
        );
    }

    public _destroy(error: Error | null, callback: (error: Error | null) => void): void {
        if (error) {
            this._throw(error);
        } else {
            fs.close(this.fd, callback);
        }
    }

    protected _throw(error: Error): void {
        process.nextTick(() => this.emit('error', error));
    }
}
