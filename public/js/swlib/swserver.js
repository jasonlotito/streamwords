export class SWServer {
  sock = null;

  constructor(sock) {
    this.sock = sock;
    socket = this.sock;
  }

  setRoom(room) {
    this.room = room;
  }

  serverEmitNewWord(word, isNewWord = true) {
    console.log(`new word: ${this.room} word: ${word} isNewWord: ${isNewWord}`);
    this.sock
      .to(this.room)
      .emit("setWord", JSON.stringify({ word, isNewWord }));
  }

  onJoin(cb) {
    this.sock.on(EVENTS.JOIN, (room) => {
      this.joinRoom(room);
      cb(room);
    });
  }

  onPoints(cb) {
    this.sock.on(EVENTS.POINTS, cb);
  }

  onSetWord(cb) {
    this.sock.on(EVENTS.SET_WORD, (setWordObj) => {
      console.log(setWordObj);
      const obj = JSON.parse(setWordObj);
      cb(obj.word, obj.isNewWord);
    });
  }

  joinRoom(room) {
    this.setRoom(room);
    this.sock.join(room);
  }

  onMessage(cb) {
    this.sock.on(EVENTS.MESSAGE, (msg) => cb);
  }

  emitMessage(msg) {
    this.emit(EVENTS.MESSAGE, msg);
  }

  onClear(cb) {
    this.sock.on(EVENTS.CLEAR, cb);
  }

  on(event, cb) {
    this.sock.on(event, cb);
  }

  emit(event, msg) {
    this.sock.to(this.room).emit(event, msg);
  }

  emitError(msg) {
    // We only want to return to the admin screen
    this.sock.emit(EVENTS.ERROR, msg);
  }

  onRandomWord(cb) {
    this.sock.on(EVENTS.RANDOM_WORD, (w) => cb(JSON.parse(w)));
  }

  onCheckWord(cb) {
    this.sock.on(EVENTS.CHECK_WORD, cb);
  }

  emitCheckWord(word) {
    this.emit(EVENTS.CHECK_WORD, word);
  }
}
