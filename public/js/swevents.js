const EVENTS = Object.freeze({
    CONNECT: 'connect',
    RELOAD: 'reload',
    SET_WORD: 'setWord',
    MANAGE: 'manage',
    WINNER: 'winner',
    CLEAR: 'clear'
})

let socket;

/**
 *
 * @param {io} socket
 * @constructor
 */
export function SWEvents(sock) {
    socket = sock;
}

SWEvents.prototype.onWinner = function(cb) {
    socket.on(EVENTS.WINNER, cb);
}

SWEvents.prototype.onConnect = function(cb) {
    socket.on(EVENTS.CONNECT, cb);
}

SWEvents.prototype.onReload = function(cb) {
    socket.on(EVENTS.RELOAD, cb);
}

/**
 *
 * @param {(word : string, isNewWord : boolean) => null} cb
 */
SWEvents.prototype.onSetWord = function(cb) {
    socket.on(EVENTS.SET_WORD, (sobj) => {
        console.log(sobj);
        const obj = JSON.parse(sobj);
        cb(obj.word, obj.isNewWord);
    });
}

SWEvents.prototype.onManageClear = function (cb) {
    socket.on(EVENTS.CLEAR, cb);
}

SWEvents.prototype.clientEmitNewWord = function(word, isNewWord = true) {
    emit(EVENTS.SET_WORD, {word, isNewWord})
}

SWEvents.prototype.clientEmitClear = function() {
    socket.emit(EVENTS.CLEAR, true);
}

SWEvents.prototype.serverEmitNewWord = function(word, isNewWord = true) {
    socket.emit('setWord', JSON.stringify({word, isNewWord}));
}

function emit(event, obj) {
    socket.emit(event, JSON.stringify(obj));
}

