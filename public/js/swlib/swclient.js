export class SWClient {
    sock = null;

    constructor(sock) {
        this.sock = sock;
    }

    joinRoom(room) {
        this.emit(EVENTS.JOIN, room)
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
        this.emit(EVENTS.SET_WORD, JSON.stringify({word, isNewWord}))
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

    emit(event, message) {
        this.sock.emit(event, message);
    }
}