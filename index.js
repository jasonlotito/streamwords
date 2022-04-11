const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
let reload = true;
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html')
});

app.get('/admin', (req, res) => {
  res.sendFile(__dirname + '/public/admin.html')
});

let hotReloading = function (socket) {
  reload && socket.emit('reload');
  reload = false;
};
io.on('connection', (socket) => {
  hotReloading(socket);
  let room = '';

  socket.on('join', (msg) => {
    socket.join(msg);
    room = msg;
    console.log(`joining ${msg}`)
  })

  socket.on('message', (msg) => {
    socket.to(room).emit('message', msg);
    console.log(msg);
  });

  socket.on('setWord', (msg) => {
    socket.to(room).emit('setWord', msg);
    console.log(`setWord ${msg}`);
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
