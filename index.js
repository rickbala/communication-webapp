var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var p = 0;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  //number of peeps plus
  io.emit('updateP', ++p);

  //number of peeps down
  socket.on('disconnect', () => {
    io.emit('updateP', --p);
  });

  //chat message
  socket.on('chat message', (msg, box) => {
    //emits a signal that will update the rigth box with a new message
    io.emit('chat message', msg, box);
  });

  //added a box
  socket.on('added a box', (boxName) => {
    //emits a signal that will update the list of latest boxes
    io.emit('added a box', boxName);
  });

});

http.listen(3000, () => {
  console.log('listening on *:3000');
});
