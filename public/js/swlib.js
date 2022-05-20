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

let socket;

const CLIENT_SERVER = 1
const CLIENT_ADMIN = 2
const CLIENT_OVERLAY = 3

function newServerClient(appName, socket, io, db) {
  return new Swapp(appName, socket, io, db, CLIENT_SERVER)
}
function newAdminClient(appName, socket, io, db) {
  return new Swapp(appName, socket, io, db, CLIENT_ADMIN)
}
function newOverlayClient(appName, socket, io, db) {
  return new Swapp(appName, socket, io, db, CLIENT_OVERLAY)
}
/*
Okay, so what we need to do now is ensure we know where we are. Are we the admin, the server, or the client.

Why? Because something like getState will work different for different environments.
 */

// let's pretend to use this code for a moment, honestly, I should just  build tests for this


//app = new Swapp("foo", s, i, d, CLIENT_ADMIN);
// Wouldn't it be easier if we could write the admin code and the client code next to each other?
// Let's ignore this for
class Swapp {
  constructor(appName, socket, io, db, clientType) {
    this.appName = appName;
    this.socket = socket;
    this.io = io;
    this.state = {};
    this.db = db;
    this.eventHandlers = [];
    this.clientType = clientType > 0 && clientType < 4 ? clientType : CLIENT_OVERLAY;
    this.isAdmin = this.clientType === CLIENT_ADMIN;
    this.isOverlay = this.clientType === CLIENT_OVERLAY;
    this.isServer = this.clientType === CLIENT_SERVER;

    if (this.isServer) {
      // This handles state changes from admin to overlays
      this.socket.on(`stateChange:${this.appName}`, state => {
        this.io.emit(`stateChange:${this.appName}`, state)
      });

      // This handles events from overlays to admins
      this.socket.on(`event:${this.appName}`, event => {
        this.io.emit(`event:${this.appName}`, event);
      });
    }
  }

  // Emits the event
  emitEvent(event, data) {
    if (this.isOverlay) {
     this.socket.emit(`event:${this.appName}`, JSON.stringify({event, data}));
    }

    if (this.isAdmin) {
      throw new Error("Admins cannot emit events, only state changes.");
    }
  }

  onEvent(event, handler) {
    // Only the admin should handle events
    if (this.isOverlay || this.isServer) {
      throw new Error("Only the admin should handle the events!!");
    }

    if (typeof handler !== "function") {
      throw new Error("handler must be a function")
    }

    this.eventHandlers[event] = handler

    // Okay, this means the admin can now watch both events
    this.socket.on(`event:${this.appName}`, event => {
      try {
        const {event, data} = JSON.parse(event);
        if (this.eventHandlers[event]) {
          this.eventHandlers[event](data)
        }
      } catch (e) {
        console.error(e);
      }
    });
  }

  getState() {
    try {
      const state = this.db.getState(this.appName);
      return JSON.parse(state);
    } catch (e) {
      console.error(e);
    }

    return {}
  }

  // Emits the State Update
  updateState(newState) {
    // okay, if we are admin, this is what we do
    if (this.isAdmin) {
      this.state = newState;
      const stringState = JSON.stringify(this.state)
      this.db.setState(this.appName, stringState);
      this.socket.emit(`stateChange:${this.appName}`, stringState);
    }


    // No the overlay cannot update state
    if (this.isOverlay) {
      throw new Error("Overlay cannot update state.")
    }
  }

  // Handles the State Update
  onStateChange(stateHandler) {
   this.socket.on(`stateChange:${this.appName}`, msg => {
     try {
       const jsonParsed = JSON.parse(msg);
       if (jsonParsed.app === this.appName) {
         stateHandler(JSON.parse(jsonParsed.state));
       }
     } catch(e) {
      console.error(e)
     }
   })
  }
}

/*
Things we can now assume, that we are the only people on this server.

So, we shouldn't need to worry about managing rooms any more.

We should also set it up so the clients can pass messages around
 */
/**
 *
 * @param {io} socket
 * @constructor
 */
class SWServer {
  sock = null;
  io = null;
  constructor(sock, io) {
    this.sock = sock;
    this.io = io;
    socket = this.sock;
    this.setupColorHandler();
  }

  setRoom(room) {
    this.room = room;
  }

  serverEmitNewWord(word, isNewWord = true) {
    console.log(`new word: ${this.room} word: ${word} isNewWord: ${isNewWord}`);
    this.emit(EVENTS.SET_WORD, JSON.stringify({ word, isNewWord }));
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

  onNFLogin(cb) {
    this.sock.on(EVENTS.NF_LOGIN, (msg) => {
      const { nfChannelId, nfChannelSignature } = JSON.parse(msg);
      cb(nfChannelId, nfChannelSignature);
    });
  }

  setupColorHandler() {
    this.sock.on(EVENTS.SET_COLOR, (msg) => {
      this.io.emit(EVENTS.SET_COLOR, msg);
    });
  }

  emitNFLogin(nfChannelId, nfChannelSignature) {
    this.io.emit(
      EVENTS.NF_LOGIN,
      JSON.stringify({
        nfChannelId,
        nfChannelSignature,
      })
    );
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
    this.sock.on(EVENTS.MESSAGE, cb);
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
    this.sock.on(EVENTS.CHECK_WORD, (w) => cb(JSON.parse(w)));
  }

  emitCheckWord(word) {
    this.emit(EVENTS.CHECK_WORD, word);
  }
}

class SWClient {
  sock = null;

  constructor(sock, nfapi) {
    this.sock = sock;
    this.nfapi = nfapi;
    socket = this.sock;
  }

  joinRoom(room) {
    this.sock.emit(EVENTS.JOIN, room);
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
    emit(EVENTS.SET_WORD, { word, isNewWord });
  }

  clientEmitRandomWord(wordList) {
    emit(EVENTS.RANDOM_WORD, wordList);
  }

  clientEmitSetPointForWin(points) {
    emit(EVENTS.POINTS, points);
  }

  emitClear() {
    socket.emit(EVENTS.CLEAR, true);
  }

  emitCheckWord(word) {
    socket.emit(EVENTS.CHECK_WORD, word);
  }

  onCheckWord(cb) {
    this.sock.on(EVENTS.CHECK_WORD, cb);
  }
}

function emit(event, obj) {
  socket.emit(event, JSON.stringify(obj));
}

module.exports = {
  EVENTS,
  SWClient,
  SWServer,
  newAdminClient,
  newServerClient,
  newOverlayClient
};
