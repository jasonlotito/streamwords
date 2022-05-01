import {Keyboard} from './keyboard.js';
import {Word} from './word.js';
import {SWClient} from "./swlib.js";
import {Dev} from "./logger.js"
import {MessageParser} from "./ynmessages.js";
import {reloadPage} from "./reloader.js";

//let myId = 54729316;
let socket = io();
let activeWord = '';
const $word = $('#word');
const $winner = $('#winner');
const $winnerName = $('#winnerName');
const $winnerWord = $('#winnerWord');
const $letters = $('#letters');
const inputName = document.getElementById('name');
const params = new URLSearchParams(location.search);
// We need a way to customize this
const alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
const myId = params.get('id');
const keyboard = new Keyboard($letters, alphabet);
const word = new Word($word);
let winnerFound = false;

if(params.has('show')) {
    switch (params.get('show')) {
        case 'keyboard':
            word.isVisible(false);
            break;
        case 'word':
            keyboard.isVisible(false);
            break;
    }
}

const swEvents = new SWClient(socket);
Dev.Log("Hello");
function sendFakeChat(name, comment) {
    Dev.Log(`${name} said ${comment}`)

    handleMessage({name, comment})
}

document.getElementById('chat').addEventListener('keyup', (e) => {
    if (e.key === 'Enter' || e.code === '13') {
        let el = e.target;
        let val = el.value;
        el.value = '';
        e.preventDefault();
        sendFakeChat(inputName.value, val);
        el.focus()
    }
});

const DEBUG = location.search.toLowerCase().includes('debug=true');
if (DEBUG) {
    document.getElementById('debugArea').classList.add('debug')

    swEvents.onReload(() => {
        reloadPage(true)
    })
}

swEvents.onConnect(() => socket.emit('join', myId))
swEvents.onManageClear(() => setWord(''));
swEvents.onSetWord(setWord)

function setWord(w) {
    Dev.Log(w);
    activeWord = w.toLowerCase();
    keyboard.resetLetters();


    if(word.show(w)){
        winnerFound = false;
        keyboard.show();
        $winner.removeClass('win');
    } else {
        keyboard.hide();
    }
}

function processWinner(msg) {
    if (winnerFound) {
        return;
    }
    processLetters(msg.comment);
    winnerFound = true;
    socket.emit('winner', JSON.stringify({name:msg.name, word:activeWord, userId: msg.userId}));
    Dev.Log(`winner: ${msg.name} with ${msg.comment}`);
    $winner.addClass('win');
    $winnerName.text(msg.name);
    $winnerWord.text(activeWord);
    setWord('');
    setTimeout(() => {
        $winner.removeClass('win');
        $winnerName.text('');
        $winnerWord.text('');
    }, 10000);
}

function processLetters(guess) {
    word.compare(guess).forEach((findType, letter) => keyboard.markLetterFound(findType, letter))
}

function handleMessage(message) {
    if (message.comment && message.comment.length === activeWord.length) {
        if (message.comment.toLowerCase() === activeWord) {
            processWinner(message);
        } else {
            swEvents.emitCheckWord(message.comment.toLowerCase());
        }
    }
}

swEvents.onCheckWord(word => {
    if(word) {
        processLetters(word);
    }
})

const messageParser = new MessageParser();
watchChatById(myId, (msg) => {
    if (msg.comment && msg.comment.length > 0) {
        handleMessage(msg);
    }
})
