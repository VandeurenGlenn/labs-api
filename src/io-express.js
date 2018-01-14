import { Server } from 'http';
import express from 'express';

import _io from 'socket.io';
export default () => {
  const app = express();
  const server = Server(app);
  const io = _io(server);

  io.on('connection', socket => {
    console.log(socket.id);
    // TODO: add private rooms
    socket.on('message', data => {
      io.emit('message', data)
    });


    // socket.on('labshake', data => {
    //   console.log(data);
    // })
  });
  //
  // io.on('disconnected', socket => {
  //   console.log();
  // })

  server.listen(3000, () => console.log('listening on port 3000'));
  return {express: app, io}
}
