import express from 'express'
import http from 'http';
import { Server } from 'socket.io';
import {fileURLToPath} from 'url'
import {dirname} from 'path'
import {SWServer} from "./public/js/swlib.js";

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  const swServer = new SWServer(socket)
  log('connecting', socket.id);
  hotReloading(socket);
  let room = '';
  let winnerList = new Array(10);
  let haveWinner = false;

  swServer.onJoin((msg) => {
    room = msg;
    console.log(`joining ${msg}`)

    if (wordList.has(room)) {
      console.log(`Found ${room} word: ${wordList.get(room)}`);
      setTimeout(() => {
        swServer.serverEmitNewWord(wordList.get(room))
      }, 1000);
    }
  })

  socket.on('message', (msg) => {
    socket.to(room).emit('message', msg);
    console.log(msg);
  });

  socket.on('clear', () => {
    socket.to(room).emit('clear', true);
  });

  swServer.onSetWord((word, isNewWord) => {
    wordList.set(room, word);
    swServer.serverEmitNewWord(word, isNewWord);
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
    log('closing connection for ', socket);
    room = null;
    winnerList = null;
    haveWinner = null;
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
