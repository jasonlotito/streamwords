const EVENTS = Object.freeze({
    CONNECT: 'connect',
    RELOAD: 'reload',
    SET_WORD: 'setWord',
    MANAGE: 'manage',
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
    socket.on(EVENTS.SET_WORD, (obj) => {
        cb(obj.word, obj.isNewWord);
    });
}

SWEvents.prototype.onManageClear = function (cb) {
    socket.on(EVENTS.MANAGE, (w) => {
        if(w.toLowerCase() === 'clear') {
            cb();
        }
    });
}

SWEvents.prototype.sendNewWord = function(word, isNewWord = true) {
    socket.emit(EVENTS.SET_WORD, {word, isNewWord});
}

function emit(event, obj) {
    socket.emit(event, JSON.stringify(obj));
}

