/*********************************************************************
 * Copyright (c) 2018 Ericsson and others
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *********************************************************************/
import * as stream from 'stream';
import { FileDuplex } from '../fileDuplex';

// tslint:disable-next-line:no-var-requires
const pty = require('../../build/Release/pty.node');
interface PtyHandles {
    master_fd: number;
    slave_name: string;
}

export class Pty {

    public master: stream.Duplex;
    public name: string;

    constructor() {
        const handles: PtyHandles = pty.create_pty();
        this.master = FileDuplex.FromFd(handles.master_fd);
        this.master.once('close', () => this.name = '');
        this.name = handles.slave_name;
    }

    public destroy(): void {
        this.master.destroy();
    }
}
