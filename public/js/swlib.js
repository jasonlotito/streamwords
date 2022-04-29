export const EVENTS = Object.freeze({
    CONNECT: 'connect',
    RELOAD: 'reload',
    SET_WORD: 'setWord',
    MANAGE: 'manage',
    WINNER: 'winner',
    CLEAR: 'clear',
    JOIN: 'join',
    MESSAGE: 'message',
    ERROR: 'error',
    RANDOM_WORD: 'randomWord'
});

let socket;

/**
 *
 * @param {io} socket
 * @constructor
 */
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
        console.log(`new word: ${this.room} word: ${word} isNewWord: ${isNewWord}`)
        this.sock.to(this.room).emit('setWord', JSON.stringify({word, isNewWord}));
    }

    onJoin(cb) {
        this.sock.on(EVENTS.JOIN, (room) => {
           this.joinRoom(room);
           cb(room);
        });
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
        this.sock.to(this.room).emit(EVENTS.MESSAGE, msg);
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
        this.sock.emit(EVENTS.ERROR, msg);
    }

    onRandomWord(cb) {
        this.sock.on(EVENTS.RANDOM_WORD, w => cb(JSON.parse(w)));
    }
}

export class SWClient {
    sock = null;

    constructor(sock) {
        this.sock = sock;
        socket = this.sock;
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
        socket.on(EVENTS.CLEAR, cb);
    }


    clientEmitNewWord(word, isNewWord = true) {
        emit(EVENTS.SET_WORD, {word, isNewWord})
    }

    clientEmitRandomWord(wordList) {
        emit(EVENTS.RANDOM_WORD, wordList);
    }

    emitClear() {
        socket.emit(EVENTS.CLEAR, true);
    }
}

function emit(event, obj) {
    socket.emit(event, JSON.stringify(obj));
}

