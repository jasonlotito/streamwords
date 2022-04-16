const express = require('express');
const app = express();
const http = require('http');
const httpServer = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(httpServer);

let reload = true;
const { log, info, error, debug } = console;

app.use(express.static(`${__dirname}/public`));

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
  console.log(reload, 'reloading');
  reload && socket.emit('reload');
  reload = false;
};

const wordList = new Map();

io.on('connection', (socket) => {
  log('connecting', socket.id);
  hotReloading(socket);
  let room = '';
  let winnerList = new Array(10);
  let haveWinner = false;

  socket.on('join', (msg) => {
    socket.join(msg);
    room = msg;
    console.log(`joining ${msg}`)

    if (wordList.has(room)) {
      console.log('found');
      socket.emit('setWord', wordList.get(room));
    }
  });

  socket.on('message', (msg) => {
    socket.to(room).emit('message', msg);
    console.log(msg);
  });

  socket.on('setWord', (msg) => {
    haveWinner = false;
    socket.to(room).emit('setWord', msg);
    wordList.set(room, msg);
    console.log(`setWord ${room}: ${msg}`);
  });

  socket.on('winner', msg => {
    if(!haveWinner) {
      haveWinner = true;

      socket.to(room).emit('winner', msg);
      let { name, word } = JSON.parse(msg);
      winnerList.push({ name, word })

      if (winnerList.length > 10) {
        winnerList.shift();
      }
    }
  });

  socket.on('close', () => {
    log('closing connection for ', socket)
    delete(room)
    delete(winnerList);
    delete(haveWinner);
  });

  socket.on('manage', (msg) => {
    socket.to(room).emit('manage', msg);
    log(`manage ${room}: ${msg}`);

    switch (msg) {
      case 'clear':
        log(`clear ${room}`)
        wordList.delete(room);
        break;
    }
  })
});

httpServer.listen(3000, () => {
  console.log('listening on *:3000');
});
