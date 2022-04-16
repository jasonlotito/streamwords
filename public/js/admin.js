
import {SWEvents} from "./swevents.js";



const nfapi = NowFinityApi();
var socket = io();

const messageValue = document.getElementById('messageValue')
const messageType = document.getElementById('messageType')
const btnSendMessage = document.getElementById('btnSendMessage');
const winnerList = document.getElementById('winnerList');
const wordList = document.getElementById('wordList');
const inputWord = document.getElementById('setWord-setWord');
const manageResult = $('#manageResult');
const adminArea = $('#adminArea');
// const wordHistory = document.getElementById('wordHistory');
const params = new URLSearchParams(location.search);

const KEYS = {
    currentWord: 'com.jasonml.yourdle.currentWord',
    wordHistory: 'com.jasonml.yourdle.wordHistory',
    winners: 'com.jasonml.yourdle.winners',
    channelId: 'com.jasonml.channelId'
}

const swEvents = new SWEvents(socket);

const db = (() => {
    let watchList = {};
    let winners = [];

    const db = {
        setChannelId: id => localStorage.setItem(KEYS.channelId, id),
        getChannelId: () => localStorage.getItem(KEYS.channelId),
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

// enable debug
if (location.search.toLowerCase().includes('debug=true')) {
    const DEBUG = true;
    document.getElementById('debugArea').setAttribute('style', 'display: block')
} else {
    const DEBUG = false;
}

socket.on('reload', function () {
    console.log('reloading admin');
    document.getElementById('__refresh').setAttribute('href', document.location);
    document.getElementById('__refresh').click();
});
swEvents.onConnect(() => {
    socket.emit('join', params.get('name'))

    if(db.hasWord()) {
        swEvents.sendNewWord(db.getWord())
    }
})

socket.on('winner', msg => {
    const {name, word} = JSON.parse(msg);
    db.addWinner(name, word);
    updateWinnerList();
    addPointsA()
});

function addPointsA() {
    nfapi.put('rest/transaction', {
        userId: 54729316,
        username: "JasonML",
        amount: 100,
        description: "StreamWords Test Reward",
        isManual: false,
        isReward: true, // count to level?
        preBalanceValidation: false, // pre-validate balance before withdraw points to check if the viewer has enogh points
    }).then((response) => {
        manageResult.text(JSON.stringify(response, null, 2));
    }).catch((error) => {
        manageResult.text(JSON.stringify(error, null, 2));
    })
}

function updateWinnerList() {
    let winners = db.getWinners();
    winnerList.innerHTML = '';
    winners.forEach(({name, word}) => {
        let li = document.createElement('li');
        li.innerText = `${name} (${word})`
        winnerList.appendChild(li);
    })
}
updateWinnerList();

btnSendMessage.addEventListener('click', () => {
    console.log(`emitting message ${messageType.value} and ${messageValue.value}`);
    socket.to(params.get('name')).emit(messageType.value, messageValue.value);
})

// If we have a word set, populate the word input
if (db.hasWord()) {
    inputWord.value = db.getWord();
}

// Easy Form Message
const formMessage = document.getElementsByClassName('formMessage')
Array.from(formMessage).forEach(e => {
    e.addEventListener('submit', event => {
        let message = {type: null, value: null};

        Array.from(event.target.elements).forEach(el => {
            if (el.name === 'message' && el.value.trim().length > 0) {
                message.value = el.value.trim();
                message.type = event.target.action.substring(event.target.action.lastIndexOf('/') + 1);
            }
        });

        let emit = false;
        switch (message.type) {
            case 'setWord':
                db.addWord(message.value);
                emit = true
                break;

        }

        switch (message.value) {
            case 'login':
                nfapi.requestAuth().then(channelId => {
                    db.setChannelId(channelId);
                    manageResult.text(`Successfully logged in ${channelId}`)
                }).catch(() => {
                    manageResult.text('Failed to login.')
                })
                break;
        }

        console.log(`type: ${message.type}; value: ${message.value}`)
        emit && socket.emit(message.type, message.value);
        event.preventDefault();
    })
});

// function addWord(word) {
//   let li = document.createElement('li')
//   li.innerText = `${word}`;
//
//   let remove = document.createElement('button')
//   remove.classList.add('deleteHistory')
//   remove.innerText = '⌫'
//
//   li.appendChild(remove);
//   return li;
// }
//
// //// Word History
// db.getHistory().forEach(word => {
//   wordHistory.appendChild(addWord(word));
// })