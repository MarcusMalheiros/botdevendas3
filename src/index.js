import makeWASocket, { useSingleFileAuthState, DisconnectReason } from 'baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import * as fs from 'fs';
import * as path from 'path';

const authDir = './auth';
const authFilePath = path.join(authDir, 'cred.json');

const { state, saveState } = useSingleFileAuthState(authFilePath);

async function startSock() {
  const sock = makeWASocket.default({
    auth: state,
    printQRInTerminal: true,
    logger: require('pino')({ level: 'silent' })
  });

  sock.ev.on('creds.update', saveState);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Conexão fechada. Reconectando?', shouldReconnect);
      if (shouldReconnect) {
        startSock();
      }
    } else if (connection === 'open') {
      console.log('Conectado com sucesso ao WhatsApp!');
    }
  });
}

startSock();