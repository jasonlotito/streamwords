const EVENTS = Object.freeze({
  CONNECT: "connect",
  RELOAD: "reload",
  SET_WORD: "setWord",
  MANAGE: "manage",
  WINNER: "winner",
  CLEAR: "clear",
  JOIN: "join",
  MESSAGE: "message",
  ERROR: "error",
  RANDOM_WORD: "randomWord",
  POINTS: "points",
  CHECK_WORD: "checkWord",
  NF_LOGIN: "nfLogin",
  SET_COLOR: "setColor",
});

export class SWClient {
  sock = null;

  constructor(sock, nfapi) {
    this.sock = sock;
    this.nfapi = nfapi;
  }

  joinRoom(room) {
    this.sock.emit(EVENTS.JOIN, room);
  }

  onNFLogin(cb) {
    this.sock.on(EVENTS.NF_LOGIN, (msg) => {
      const { nfChannelId, nfChannelSignature } = JSON.parse(msg);
      cb(nfChannelId, nfChannelSignature);
    });
  }

  onRandomWordSet(cb) {
    this.sock.on(EVENTS.RANDOM_WORD, cb);
  }

  onWinner(cb) {
    this.sock.on(EVENTS.WINNER, cb);
  }

  onConnect(cb) {
    this.sock.on(EVENTS.CONNECT, cb);
  }

  onReload(cb) {
    this.sock.on(EVENTS.RELOAD, cb);
  }

  onError(cb) {
    this.sock.on(EVENTS.ERROR, cb);
  }

  onSetWord(cb) {
    this.sock.on(EVENTS.SET_WORD, (setWordObj) => {
      console.log(setWordObj);
      const obj = JSON.parse(setWordObj);
      cb(obj.word, obj.isNewWord);
    });
  }

  onManageClear(cb) {
    this.sock.on(EVENTS.CLEAR, cb);
  }

  clientEmitNewWord(word, isNewWord = true) {
    this.emit(EVENTS.SET_WORD, { word, isNewWord });
  }

  clientEmitColor(nameOfColor, color) {
    this.emit(EVENTS.SET_COLOR, { nameOfColor, color });
  }

  clientEmitRandomWord(wordList) {
    this.emit(EVENTS.RANDOM_WORD, wordList);
  }

  clientEmitSetPointForWin(points) {
    this.emit(EVENTS.POINTS, points);
  }

  emitClear() {
    this.emit(EVENTS.CLEAR, true);
  }

  emitCheckWord(word) {
    this.emit(EVENTS.CHECK_WORD, word);
  }

  onCheckWord(cb) {
    this.sock.on(EVENTS.CHECK_WORD, cb);
  }

  emit(event, obj) {
    this.sock.emit(event, JSON.stringify(obj));
  }
}
