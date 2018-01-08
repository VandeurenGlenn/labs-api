import express from 'express';
import { read, write, encrypt, decrypt } from 'crypto-io-utils';
import { Server } from 'http';
import RSA from 'node-rsa';
import uuid4 from 'uuid/v4';
import cors from 'cors';
import helmet from 'helmet';
import _io from './io.js'
const bodyParser = require('body-parser');
import ecdh from 'crypto-ecdh';
import { userInfo } from 'os';
import { join } from 'path';

const connections = new Map();

const userdir = userInfo().homedir;

const api = express();
const server = Server(api);
const io = _io(server);

api.use(helmet())

// api.use(cors({
//   origin: 'http://localhost:9000'
// }))

api.get('/', (request, response) => {
  response.send('hello world\n From REVC PI');
});
const jsonParser = bodyParser.json()

const bearer = (request, response, next) => {
  try {
    const { authorization } = request.headers;
    request.bearer = authorization.split('Bearer ')[1];
  } catch (e) {
    return response.sendStatus(403);
  }
  next();
}

const hasSessionToken = (request, response, next) => {
  bearer(request, response, () => {
    const session = request.headers['x-session'];
    if (!session) {
      return response.send(403, 'sessionToken missing or expired');
    }
    request.session = session;
    next();
  });
}

api.post('/api/handshake', bearer, (request, response) => {
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

api.post('/api/signup', hasSessionToken, (request, response) =>
  (async function() {
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

      data.rooms = [{
        public: global.pempublic,
        private: global.pemprivate
      }];
      // data.apiSecret = [{key: pair.public, secret: pair.secret}];
      const cipher = await encrypt(JSON.stringify(data), password);
      await write(join(userdir, '.revolutionlabs', 'users', uid), cipher);
      connections.delete(request.session);
      response.sendStatus(200);
    } catch (error) {
      console.error(error);
    }
  })()
);

// TODO: get user from connections ...
// sessionToken is created in handshake ... check labs > crypto-server
api.get('/api/signin', hasSessionToken, (request, response) =>
  (async function() {
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
        response.send(200);
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

  })()
);

server.listen(3000, () => console.log('listening on port 3000'));
