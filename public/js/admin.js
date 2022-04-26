
import {SWClient} from "./swlib.js";
import {DB} from "./db.js";
import {Dev} from "./logger.js";
import {reloadPage} from "./reloader.js";

const nfapi = NowFinityApi();
var socket = io();

const messageValue = document.getElementById('messageValue')
const messageType = document.getElementById('messageType')
const btnSendMessage = document.getElementById('btnSendMessage');
const winnerList = document.getElementById('winnerList');
const wordList = document.getElementById('wordList');
const frmSetWordWord = $('#frmSetWordWord');
const manageResult = $('#manageResult');
const adminArea = $('#adminArea');
const frmSetWord = $('#frmSetWord');
// const wordHistory = document.getElementById('wordHistory');
const params = new URLSearchParams(location.search);

const swEvents = new SWClient(socket);
const db = DB;

// enable debug
if (location.search.toLowerCase().includes('debug=true')) {
    const DEBUG = true;
    document.getElementById('debugArea').setAttribute('style', 'display: block')
} else {
    const DEBUG = false;
}

export function setWord($frmSetWord) {
    Dev.Log('setWord click handler')
    $frmSetWord.submit((e) => {
        e.preventDefault();
        swEvents.clientEmitNewWord(frmSetWordWord.val())
        db.addWord(frmSetWordWord.val())
    })
}

export function setClearBoardButton($btn) {
    $btn.click(() => swEvents.emitClear());
}

export function setLoginButton($btn) {
    $btn.click((e) => {
        e.preventDefault();

        nfapi.requestAuth().then(channelId => {
            db.setChannelId(channelId);
            manageResult.text(`Successfully logged in ${channelId}`)
        }).catch(() => {
            manageResult.text('Failed to login.')
        })
    });
}

swEvents.onReload(() => {
    Dev.Log('reloading admin');
    // document.getElementById('__refresh').setAttribute('href', document.location);
    // document.getElementById('__refresh').click();
    reloadPage(true);
})

swEvents.onConnect(() => {
    socket.emit('join', params.get('name'))

    if(db.hasWord()) {
        swEvents.clientEmitNewWord(db.getWord(), false)
    }
});

swEvents.onWinner(msg => {
    Dev.Log(msg);
    Dev.Log(JSON.parse(msg))
    const {name, word} = JSON.parse(msg);
    db.addWinner(name, word);
    updateWinnerList();
    addPointsForWinner()
});

function addPointsForWinner() {
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
    Dev.Log(`emitting message ${messageType.value} and ${messageValue.value}`);
    socket.to(params.get('name')).emit(messageType.value, messageValue.value);
})



// If we have a word set, populate the word input
if (db.hasWord()) {
    frmSetWordWord.val(db.getWord())
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

        Dev.Log(`type: ${message.type}; value: ${message.value}`)
        emit && socket.emit(message.type, message.value);
        event.preventDefault();
    })
});
