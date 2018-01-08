import _io from 'socket.io';

export default server => {
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

  return io;
}
