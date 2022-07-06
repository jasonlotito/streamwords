//app = new Swapp("foo", s, i, d, CLIENT_ADMIN);
// Wouldn't it be easier if we could write the admin code and the client code next to each other?
// Let's ignore this for now
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

Swapp.CLIENT_SERVER = 1;
Swapp.CLIENT_ADMIN = 2;
Swapp.CLIENT_OVERLAY = 3;

const app = new Swapp("example", socket, io, db)
// ADMIN
// This is the admin handler
const wordGuessEvent = app.addEvent('wordGuess', ({username, userId, word}) => {
    // server side handling
    // admin handler for this event handleWordGuess(username, userId, word);
    return ({username, userId, word}) => {};
});

// CLIENT
// include swapp.js in our client, and swapp renders out a library we use
// We don't want to pass in type here, we want to set things up, and then run with a certain type
const el = document.querySelector('button');
el.addEventListener('click', e => {
    const username = "JasonML", userId = 42000, word = "foobar";
    wordGuessEvent({username, userId, word})
}, {
    once: true
} );


app.onEvent('event', handler);
app.onEvent('event', handler);
app.onEvent('event', handler);
app.onEvent('event', handler);
if(window) {
   app.run(Swapp.CLIENT_ADMIN);
} else {
   app.run(Swapp.CLIENT_SERVER);
}
