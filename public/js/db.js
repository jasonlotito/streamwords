const KEYS = {
  currentWord: 'com.jasonml.yourdle.currentWord',
  wordHistory: 'com.jasonml.yourdle.wordHistory',
  winners: 'com.jasonml.yourdle.winners',
  channelId: 'com.jasonml.channelId',
  pointsPerWin: 'com.jasonml.yourdle.pointsPerWin',
  room: 'com.jasonml.yourdle.room',
}

const db = (() => {
  let watchList = {};
  let winners = [];

  const db = {
    setPointsPerWin: points => localStorage.setItem(KEYS.pointsPerWin, points),
    getPointsPerWin: () => localStorage.getItem(KEYS.pointsPerWin) ?? 100,
    setChannelId: id => localStorage.setItem(KEYS.channelId, id),
    getChannelId: () => localStorage.getItem(KEYS.channelId),
    setRoom: () => localStorage.setItem(KEYS.room, Date.now() + localStorage.getItem(KEYS.channelId)),
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
      winners.unshift({name, word});

      if (winners.length > 10) {
        winners.pop();
      }

      localStorage.setItem(KEYS.winners, JSON.stringify(winners))
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
          localStorage.setItem(KEYS.wordHistory, JSON.stringify(wordList))
        },
        add: (word) => {
          wordList.push(word);
          db.wordHistory.save();
        },
      }
    })(),
    watch: (() => {
      return (event, cb) => {
        if (!watchList[event]) {
          watchList[event] = new Set();
        }

        watchList[event].add(cb);
      };
    })()
  }

  return db;
})();

export const DB = db;
