const electron = require("electron");
const BrowserWindow = electron.BrowserWindow;
const electronApp = electron.app;
const shell = electron.shell;
const protocol = electron.protocol;
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { fileURLToPath } = require("url");
const { dirname } = require("path");
const { SWServer, EVENTS } = require("./public/js/swlib");
const wordlist = require("wordlist-english");
const Filter = require("bad-words");

var americanWords = wordlist["english/american"];
var australianWords = wordlist["english/australian"];
var britishWords = wordlist["english/british"];
var canadianWords = wordlist["english/canadian"];
var englishWords = wordlist["english"];

const filter = new Filter();
const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

let reload = true;
const { log, info, error, debug } = console;

app.use(express.static(`${__dirname}/public`));

app.get("/obs", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.get("/favicon.ico", (req, res) => {
  return;
});

app.get("/admin", (req, res) => {
  res.sendFile(__dirname + "/public/admin.html");
});

app.get("/webSocket.js", (req, res) => {
  res.sendFile(__dirname + "/public/webSocket.js");
});

let hotReloading = function (socket) {
  console.log(reload, "reloading");
  reload && socket.emit("reload");
  reload = false;
};

const wordList = new Map();

io.on("connection", (socket) => {
  const swServer = new SWServer(socket, io);
  log("connecting", socket.id);
  hotReloading(socket);
  let room = "";
  let winnerList = new Array(10);
  let mustBeRealWord = true;

  swServer.onJoin((msg) => {
    room = msg;
    console.log(`joining ${msg}`);
    swServer.joinRoom(room);
    if (wordList.has(room)) {
      console.log(`Found ${room} word: ${wordList.get(room)}`);
      setTimeout(() => {
        swServer.serverEmitNewWord(wordList.get(room));
      }, 1000);
    }
  });

  swServer.onNFLogin((channelId, channelSignature) => {
    console.log("NFLogin", channelId, channelSignature);
    swServer.emitNFLogin(channelId, channelSignature);
  });

  swServer.onMessage((msg) => {
    swServer.emitMessage(msg);
  });

  swServer.onClear((msg) => {
    swServer.emit(EVENTS.CLEAR, msg);
  });

  englishWords.push("younow");
  australianWords.push("crikey");

  const irw = (r) => r !== -1;
  const wordLists = [
    (w) => irw(englishWords.indexOf(w)),
    (w) => irw(americanWords.indexOf(w)),
    (w) => irw(canadianWords.indexOf(w)),
    (w) => irw(britishWords.indexOf(w)),
    (w) => irw(australianWords.indexOf(w)),
  ];
  const is_real_word = (w) => wordLists.find((is_a_word) => is_a_word(w));
  const is_word = (w) => is_real_word(w.toLowerCase());

  swServer.onSetWord((word, isNewWord) => {
    if (mustBeRealWord && !is_word(word)) {
      console.log(`Bad word ${word}`);
      let msg = filter.isProfane(word)
        ? `'${word}' is considered profane and is not allowed.`
        : `'${word}' is not found in our dictionary.`;
      swServer.emitError(msg);
      return;
    }
    wordList.set(room, word);
    swServer.serverEmitNewWord(word, isNewWord);
  });

  swServer.onCheckWord((word) => {
    let returnWord = is_word(word) ? word : null;
    swServer.emitCheckWord(returnWord);
  });

  function getRandomWord(dict, complexity = "10") {
    let word = "";
    let listName = `${dict}/${complexity}`;
    do {
      word =
        wordlist[listName][
          Math.floor(Math.random() * wordlist[listName].length)
        ];
    } while (word.length < 4 || (word.length > 6 && !filter.isProfane(word)));

    return word;
  }

  swServer.onRandomWord((dict) => {
    const list = dict.toLowerCase();
    let word = "";
    word = getRandomWord(list, 10);
    wordList.set(room, word);
    swServer.serverEmitNewWord(word, true);

    socket.emit(EVENTS.RANDOM_WORD, word);
  });

  swServer.on(EVENTS.WINNER, (msg) => {
    let { name, word, userId } = JSON.parse(msg);

    if (!name || !word || !userId) {
      return;
    }

    if (wordList.has(room)) {
      console.log(`winner ${name} won with ${word} should only win once`);
      wordList.delete(room);

      swServer.emit(EVENTS.WINNER, msg);
      // socket.emit(EVENTS.WINNER, msg);
      winnerList.push({ name, word });

      if (winnerList.length > 10) {
        winnerList.shift();
      }
    }
  });

  socket.on("close", () => {
    log("closing connection for ", socket);
    room = null;
    winnerList = null;
  });

  socket.on("manage", (msg) => {
    socket.to(room).emit("manage", msg);
    log(`manage ${room}: ${msg}`);

    switch (msg) {
      case "clear":
        log(`clear ${room}`);
        wordList.delete(room);
        break;
    }
  });
});

httpServer.listen(3000, () => {
  const createWindow = () => {
    const win = new BrowserWindow({
      width: 800,
      height: 600,
    });
    win.loadFile("./public/admin.html");

    win.webContents.on("new-window", (e, url) => {
      e.preventDefault();
      shell.openExternal(url);
    });
  };

  electronApp.whenReady().then(() => {
    createWindow();

    protocol.registerFileProtocol("streamwords", (req, cb) => {
      const url = request.url.substr(14);
      console.log(url);
    });
  });
});
