
import {Keyboard} from './keyboard.js';
import {Word} from './word.js';
import {SWEvents} from "./swevents.js";

let myId = 54729316;
let socket = io();
let activeWord = '';
const elWord = document.getElementById('word');
const $word = $('#word');
const $letters = $('#letters');
const $btnConnect = $('connect');
const inputName = document.getElementById('name');
const params = new URLSearchParams(location.search);
// We need a way to customize this
const alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];

const keyboard = new Keyboard($letters, alphabet);
const word = new Word($word)
const swEvents = new SWEvents(socket);

function sendFakeChat(name, comment) {
    console.log(`${name} said ${comment}`)
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
        console.log('reloading...');
        $('#__refresh').click();
        return false;
    })

    $('body').append(`<a href="${location.href}&ts=${Date.now()}" id="__refresh">refresh</a>`)
}

swEvents.onConnect(() => socket.emit('join', params.get('name') ?? 'global'))
swEvents.onManageClear(() => setWord(''));
swEvents.onSetWord(setWord)

function setWord(w) {
    activeWord = w.toLowerCase();
    keyboard.resetLetters();

    if(word.show(w)){
        keyboard.show();
    } else {
        keyboard.hide();
    }
}

function processWinner(msg) {
    processLetters(msg.comment);
    socket.emit('winner', JSON.stringify({name:msg.name, word:activeWord}));
    console.log(`winner: ${msg.name} with ${msg.comment}`);
}

function processLetters(guess) {
    word.compare(guess).forEach((findType, letter) => keyboard.markLetterFound(findType, letter))
}

function handleMessage(message) {
    if (message.comment && message.comment.length === activeWord.length) {
        if (message.comment.toLowerCase() === activeWord) {
            processWinner(message);
        } else {
            processLetters(message.comment.toLowerCase());
        }
    }
}

watchChatById(myId, (msg) => {
    if (msg.comment && msg.comment.length > 0) {
        handleMessage(msg);
    }
})