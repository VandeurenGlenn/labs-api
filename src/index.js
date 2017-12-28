import express from 'express';
import { read, write } from 'crypto-io-utils';
import { Server } from 'http';
import _io from 'socket.io';
import RSA from 'node-rsa'

const api = express();
const server = Server(api);
const io = _io(server);

io.on('connection', socket => {
  socket.on('message', data => {
    io.emit('message', data)
  })
})

api.get('/', (request, response) => {
  response.send('hello world\n From REVC PI');
});

api.get('/api/signup', (request, response) => {
  async function signup() {
    const key = new RSA({b: 512});
    const priv = key.exportKey('private');
    response.send(key.exportKey('public'));
  }
  return signup();
});

api.get('/api/login', (request, response) => {
  response.send('hello world\n From REVC PI');
});

server.listen(3000, () => console.log('listening on port 3000'));
