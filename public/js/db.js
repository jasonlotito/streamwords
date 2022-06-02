const KEYS = {
  currentWord: "com.jasonml.yourdle.currentWord",
  wordHistory: "com.jasonml.yourdle.wordHistory",
  winners: "com.jasonml.yourdle.winners",
  channelId: "com.jasonml.channelId",
  pointsPerWin: "com.jasonml.yourdle.pointsPerWin",
  room: "com.jasonml.yourdle.room",
  hideWord: "com.jasonml.yourdle.hideWord",
  colors: "com.jasonml.yourdle.colors",
  alphas: "com.jasonml.yourdle.aplhas",
};

/*
#TODO Turn this into a way of managing state.
  We update the state from the admin, and submit it to the server. The server emits the update state to the client.
  The client should only ever have to fetch the state on loading. This simplifies the entire flow of data, and we don't
  have to worry about managing multiple sources of truth (the admin, the server, and the client).
  When the server detects a new connection, it emits the state to the client. The admin can emit changes to the state,
  the client cannot.
*/

const db = (() => {
  let watchList = {};
  let winners = [];

  const db = {
    setAlpha: (key, alpha) => {
      const alphas = db.getAlphas()
      alphas[key] = alpha;
      localStorage.setItem(KEYS.alphas, JSON.stringify(alphas));
    },
    getAlphas: () => JSON.parse(localStorage.getItem(KEYS.alphas)) ?? {},
    setState: (prefix, state) => localStorage.setItem(`com.jasonml.${prefix}.state`, state),
    getState: (prefix) => localStorage.getItem(`com.jasonml.${prefix}.state`),
    getColors: () => JSON.parse(localStorage.getItem(KEYS.colors)) ?? {},
    setColor: (key, color) => {
      const colors = db.getColors();
      colors[key] = color;
      localStorage.setItem(KEYS.colors, JSON.stringify(colors));
    },
    setHideWord: (hide) =>
      localStorage.setItem(KEYS.hideWord, JSON.stringify(!!hide)),
    hideWord: () => JSON.parse(localStorage.getItem(KEYS.hideWord)) ?? false,
    setPointsPerWin: (points) =>
      localStorage.setItem(KEYS.pointsPerWin, points),
    getPointsPerWin: () => localStorage.getItem(KEYS.pointsPerWin) ?? 100,
    setChannelId: (id) => localStorage.setItem(KEYS.channelId, id),
    getChannelId: () => localStorage.getItem(KEYS.channelId),
    setRoom: () =>
      localStorage.setItem(
        KEYS.room,
        Date.now() + localStorage.getItem(KEYS.channelId)
      ),
    getRoom: () => localStorage.getItem(KEYS.room),
    addWord: (word) => {
      // db.wordHistory.add(db.currentWord.get());
      db.currentWord.set(word);
    },
    getWord: () => db.currentWord.get(),
    hasWord: () => !!db.getWord(),
    getHistory: () => db.wordHistory.get(),
    currentWord: {
      get: () => localStorage.getItem(KEYS.currentWord),
      set: (word) => localStorage.setItem(KEYS.currentWord, word),
    },
    getWinners: () => {
      if (!localStorage.getItem(KEYS.winners)) {
        localStorage.setItem(KEYS.winners, JSON.stringify(winners));
      } else {
        winners = JSON.parse(localStorage.getItem(KEYS.winners));
      }

      return winners;
    },
    addWinner: (name, word) => {
      winners.unshift({ name, word });

      if (winners.length > 10) {
        winners.pop();
      }

      localStorage.setItem(KEYS.winners, JSON.stringify(winners));
    },
    wordHistory: (() => {
      let wordList = [];

      if (!localStorage.getItem(KEYS.wordHistory)) {
        localStorage.setItem(KEYS.wordHistory, JSON.stringify(wordList));
      } else {
        wordList = JSON.parse(localStorage.getItem(KEYS.wordHistory));
      }

      return {
        get: () => {
          return wordList;
        },
        save: () => {
          localStorage.setItem(KEYS.wordHistory, JSON.stringify(wordList));
        },
        add: (word) => {
          wordList.push(word);
          db.wordHistory.save();
        },
      };
    })(),
    watch: (() => {
      return (event, cb) => {
        if (!watchList[event]) {
          watchList[event] = new Set();
        }

        watchList[event].add(cb);
      };
    })(),
  };

  return db;
})();

export const DB = db;
