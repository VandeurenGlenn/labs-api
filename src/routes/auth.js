import { Router } from 'express';
import { bearer, hasSessionToken } from './../middleware/auth';
import ecdh from 'crypto-ecdh';
import config from './../../node_modules/labs-config/src/index.js';
import { userInfo } from 'os';
import { join } from 'path';
import RSA from 'node-rsa';
import uuid4 from 'uuid/v4';
import { read, write, encrypt, decrypt } from 'crypto-io-utils';

const userdir = userInfo().homedir;
const router = Router();
const connections = new Map();

router.post('/api/handshake', bearer, (request, response) => {
  const { authorization } = request.headers;
  const pub = authorization.split('Bearer ')[1];
  // Generate pair
  const pair = ecdh('hex');
  // derive with incoming public key
  const secret = pair.derive(pub);
  const sessionToken = uuid4();
  connections.set(sessionToken, secret);
  response.set('x-session', sessionToken);
  response.send(pair.public);
});

const decryptJSON = (cipher, secret) => new Promise((resolve, reject) =>
  decrypt(cipher, secret)
    .then(data => resolve(JSON.parse(data)))
    .catch(error => reject(error))
);

router.post('/api/signup', hasSessionToken, async (request, response) => {
  // response.send(pair.public);
  try {
    const secret = connections.get(request.session);
    const data = await decryptJSON(request.bearer, secret.toString('hex'));
    const {password, uid} = data;
    delete data.password;
    const key = new RSA();
    const pair = key.generateKeyPair();

    data.api = {
      keys: [{
        public: pair.exportKey('pkcs1-public-der'),
        private: pair.exportKey('pkcs1-der')
      }]
    };

    const { keys } = await config;
    data.rooms = [keys];
    // data.apiSecret = [{key: pair.public, secret: pair.secret}];
    const cipher = await encrypt(JSON.stringify(data), password);
    await write(join(userdir, '.revolutionlabs', 'users', uid), cipher);
    connections.delete(request.session);
    response.sendStatus(200);
  } catch (error) {
    console.error(error);
  }
});

// TODO: get user from connections ...
// sessionToken is created in handshake ... check labs > crypto-server
router.get('/api/signin', hasSessionToken, async (request, response) => {
  const secret = connections.get(request.session);
  const data = await decryptJSON(request.bearer, secret.toString('hex'));
  try {
    const cipher = await read(join(userdir, '.revolutionlabs', 'users', data.uid));
    try {
      const result = await decryptJSON(cipher, data.password);
      // connections.set(request.session, result.api.public.secret)
      // remove api secret from request
      delete result.api.keys[0].private;
      // encrypt again using secret
      const encrypted = await encrypt(JSON.stringify(result), secret.toString('hex'));
      // response.set('x-labs-enc', encrypted.toString('base64'))
      response.set('x-labs-enc', encrypted);
      response.sendStatus(200);
    } catch (e) {
      response.send(403, 'forbidden')
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      response.sendStatus(404);
    } else {
      response.send(403, 'forbidden')
    }
  }
});

export default router;
