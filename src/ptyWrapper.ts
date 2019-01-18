/*********************************************************************
 * Copyright (c) 2018 Ericsson and others
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *********************************************************************/

// tslint:disable:max-classes-per-file

import { ITerminal } from '@theia/node-pty/src/interfaces';
import { EventEmitter } from 'events';
import { Readable, Writable } from 'stream';

declare interface PtyOut {
    on(event: 'data', listener: (chunk: string) => void): this;
    on(event: 'close', listener: () => void): this;

    emit(event: 'data', chunk: string): boolean;
    emit(event: 'close'): boolean;
}
class PtyOut extends EventEmitter {

    constructor(
        private pty: ITerminal,
    ) {
        super();
        this.pty.on('data', (data) => this.emit('data', data));
        this.pty.once('close', () => this.emit('close'));
    }
}

class PtyIn {

    constructor(
        private pty: ITerminal,
    ) { }

    public write(chunk: string): void {
        this.pty.write(chunk);
    }

}

export class PtyWrapper {

    public out = new PtyOut(this.pty) as any as Readable;
    public in = new PtyIn(this.pty) as any as Writable;

    constructor(
        private pty: ITerminal,
    ) { }

    get name(): string {
        const name: string | undefined = (this.pty as any)._pty;
        if (typeof name !== 'string') {
            throw new Error('issue fetching the pty name');
        }
        return name;
    }
}
