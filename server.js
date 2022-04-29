import express from 'express'
import http from 'http';
import { Server } from 'socket.io';
import {fileURLToPath} from 'url'
import {dirname} from 'path'
import {SWServer, EVENTS} from "./public/js/swlib.js";
import wordlist from "wordlist-english";
import Filter from 'bad-words';

var americanWords = wordlist['english/american'];
var australianWords = wordlist['english/australian'];
var britishWords = wordlist['english/british'];
var canadianWords = wordlist['english/canadian'];
var englishWords = wordlist['english'];
const filter = new Filter();
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
  let mustBeRealWord = true;
  let pointsPerWin = 100;

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

  swServer.onMessage(msg => {
    swServer.emitMessage(msg);
  });

  swServer.onClear(msg => {
    swServer.emit(EVENTS.CLEAR, msg);
  })

  englishWords.push('younow')
  const irw = r => r !== -1;
  const is_english_word = w => irw(englishWords.indexOf(w));
  const is_american_word = w => irw(americanWords.indexOf(w));
  const is_canadian_word = w => irw(canadianWords.indexOf(w));
  const is_british_word = w => irw(britishWords.indexOf(w));
  const is_real_word = w => (is_english_word(w) || is_canadian_word(w) || is_american_word(w) || is_british_word(w));
  const is_word = w => is_real_word(w.toLowerCase());

  swServer.onSetWord((word, isNewWord) => {
    if (mustBeRealWord && !is_word(word)) {
      console.log(`Bad word ${word}`)
      let msg = filter.isProfane(word) ? `'${word}' is considered profane and is not allowed.` : `'${word}' is not found in our dictionary.`;
      swServer.emitError(msg);
      return;
    }
    wordList.set(room, word);
    swServer.serverEmitNewWord(word, isNewWord);
  });

  swServer.onRandomWord( (dict) => {
    const list = dict.toLowerCase();
    let word = '';
    do {
      word = wordlist[list][Math.floor(Math.random()*wordlist[list].length)];
    } while( word.length < 4 || word.length > 6 && !filter.isProfane(word));

    wordList.set(room, word);
    swServer.serverEmitNewWord(word, true);
    socket.emit(EVENTS.RANDOM_WORD, word);
  });


  swServer.on(EVENTS.WINNER, msg => {
    if(!haveWinner) {
      haveWinner = true;
      swServer.emit(EVENTS.WINNER, msg);

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
