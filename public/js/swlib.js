const EVENTS = Object.freeze({
    CONNECT: 'connect',
    RELOAD: 'reload',
    SET_WORD: 'setWord',
    MANAGE: 'manage',
    WINNER: 'winner',
    CLEAR: 'clear',
    JOIN: 'join'
})

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
}

export class SWClient {
    sock = null;

    constructor(sock) {
        this.sock = sock;
        socket = this.sock;
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

    emitClear() {
        socket.emit(EVENTS.CLEAR, true);
    }
}

function emit(event, obj) {
    socket.emit(event, JSON.stringify(obj));
}

