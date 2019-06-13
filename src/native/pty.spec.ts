/*********************************************************************
 * Copyright (c) 2019 Ericsson and others
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *********************************************************************/
const debug = require(require.resolve('why-is-node-running', { paths: ['/home/emaapur/.nvm/versions/node/v10.2.1/lib/node_modules'] }));
import { expect } from 'chai';
import * as os from 'os';
import * as stream from 'stream';
import { FileDuplex } from '../fileDuplex';
import { Pty } from '../native/pty';

// Allow non-arrow functions: https://mochajs.org/#arrow-functions
// tslint:disable:only-arrow-functions no-console no-bitwise

if (os.platform() !== 'win32') {

    let master: stream.Duplex | undefined;
    let slave: stream.Duplex | undefined;

    afterEach(function() {
        if (slave) {
            slave.destroy();
            slave = undefined;
        }
        if (master) {
            master.destroy();
            master = undefined;
        }
    });

    describe('pty creation', function() {

        it('should be able to open a working ptmx/pts pair', async function() {
            const pty = new Pty();

            master = pty.master;
            slave = await FileDuplex.FromPath(pty.name, 'r+');

            function onError(error: Error) {
                console.error(error);
                throw error;
            }
            master.on('error', onError);
            slave.on('error', onError);

            let masterStream = '';
            let slaveStream = '';

            master.on('data', (data) => masterStream += data.toString('utf8'));
            slave.on('data', (data) => slaveStream += data.toString('utf8'));

            expect(masterStream).eq('');
            expect(slaveStream).eq('');

            await sendAndAwait('master2slave', {
                writeTo: master,
                readFrom: slave,
            });

            expect(masterStream).eq('');
            expect(slaveStream).eq('master2slave');

            await sendAndAwait('slave2master', {
                writeTo: slave,
                readFrom: master,
            });

            expect(masterStream).eq('slave2master');
            expect(slaveStream).eq('master2slave');
        });

        setTimeout(() => {
            debug();
        }, 1000);

    });

    /**
     * Assumes that we are the only one writing to the streams.
     */
    function sendAndAwait(str: string, options: {
        writeTo: stream.Writable,
        readFrom: stream.Readable,
    }): Promise<void> {
        return new Promise<void | never>((resolve) => {
            options.readFrom.once('data', () => resolve());
            options.writeTo.write(str);
        });
    }
}
