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

app.get('/webSocket.js', (req, res) => {
  res.sendFile(__dirname + '/public/webSocket.js')
})

let hotReloading = function (socket) {
  reload && socket.emit('reload');
  reload = false;
};

const wordList = new Map();

io.on('connection', (socket) => {
  hotReloading(socket);
  let room = '';

  socket.on('join', (msg) => {
    socket.join(msg);
    room = msg;
    console.log(`joining ${msg}`)

    if(wordList.has(room)) {
      console.log('found');
      socket.emit('setWord', wordList.get(room));
    }
  });

  socket.on('message', (msg) => {
    socket.to(room).emit('message', msg);
    console.log(msg);
  });

  socket.on('setWord', (msg) => {
    socket.to(room).emit('setWord', msg);
    wordList.set(room, msg);
    console.log(`setWord ${room}: ${msg}`);
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
