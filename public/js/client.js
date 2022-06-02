import {Keyboard} from "./keyboard.js";
import {Word} from "./word.js";
import {SWClient} from "./swlib/swclient.js";
import {Dev} from "./logger.js";
import {MessageParser} from "./ynmessages.js";
import {reloadPage} from "./reloader.js";
import {DB} from "./db.js";

const db = DB;
/*
The data flow order is messed up at the moment.

The order of data flow should be one way, with one master managing the data. This should be the server.
In this case, we should enforce a data flow from:


          Admin ==>  Server ==> Client

                    o======o
            ------->|      |-------
            |       |      |      V
          Admin     |Server|    Client
            ^       |      |      |
            --------|      |<------
                    o======o


*/

let socket = io();
let activeWord = "";
const $word = $("#word");
const $winner = $("#winner");
const $winnerName = $("#winnerName");
const $winnerWord = $("#winnerWord");
const $letters = $("#letters");
const inputName = document.getElementById("name");
const params = new URLSearchParams(location.search);
const IS_SETUP = params.has('IS_SETUP');
// We need a way to customize this
const alphabet = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
];
function defaultColor(key) {
   switch(key) {
       case 'found':
           return colors.hasOwnProperty('clrFoundLetters') ? colors.clrFoundLetters : '#ff4500';
           break;
       case 'used':
           return colors.hasOwnProperty('clrDiscoveredLetters') ? colors.clrFoundLetters : '#6495ed';
           break;
       case 'unused':
           return colors.hasOwnProperty('clrUnusedLetter') ? colors.clrFoundLetters : '#000';
           break;
       case 'defaultColor':
           return colors.hasOwnProperty('clrKeyboardLetter') ? colors.clrFoundLetters : '#fff';
           break;
       case 'backgroundColor':
           return colors.hasOwnProperty('clrKeyboardBackground') ? colors.clrFoundLetters : '#333333';
           break;
       case 'borderColor':
           return colors.hasOwnProperty('clrKeyboardBorderColor') ? colors.clrFoundLetters : '#000';
           break;
       case 'topFoundColor':
           return colors.hasOwnProperty('clrTopWordLetter') ? colors.clrTopWordLetter : '#ff4500';
           break;
       case 'topBackgroundColor':
           return colors.hasOwnProperty('clrTopWordLetterBackground') ? colors.clrTopWordLetterBackground : '#fff';
           break;
       case 'topBackgroundAlpha':
           return colors.hasOwnProperty('alphaTopWordLetterBackground') ? colors.alphaTopWordLetterBackground : '0';
           break;
   }
}
const roomId = params.get("roomId");
const channelId = params.get("channelId");
const colors = db.getColors()
const keyboard = new Keyboard($letters, alphabet, {
    found: defaultColor('found'),
    used: defaultColor('used'),
    unused: defaultColor('unused'),
    defaultColor: defaultColor('defaultColor'),
    backgroundColor: defaultColor('backgroundColor'),
    borderColor: defaultColor('borderColor'),
});

const word = new Word($word, {
    foundColor: defaultColor('topFoundColor'),
    backgroundColor: defaultColor('topBackgroundColor'),
    backgroundAlpha: defaultColor('topBackgroundAlpha'),
});

if(IS_SETUP) {
    console.log('is setup')
    word.show('TESTING')
    word.compare('tzztzzz')
    keyboard.resetLetters()
    keyboard.show();
    keyboard.markLetterFound(Keyboard.FIND_FOUND,'t')
    keyboard.markLetterFound(Keyboard.FIND_USED,'e')

    processLetters('PLAYING');
}

let winnerFound = false;

if (params.has("show")) {
    switch (params.get("show")) {
        case "keyboard":
            word.isVisible(false);
            break;
        case "word":
            keyboard.isVisible(false);
            break;
    }
}

const swEvents = new SWClient(socket);

function sendFakeChat(name, comment) {
    Dev.Log(`${name} said ${comment}`);

    handleMessage({name, comment});
}

document.getElementById("chat").addEventListener("keyup", e => {
    if (e.key === "Enter" || e.code === "13") {
        let el = e.target;
        let val = el.value;
        el.value = "";
        e.preventDefault();
        sendFakeChat(inputName.value, val);
        el.focus();
    }
});

const DEBUG = location.search.toLowerCase().includes("debug=true");
if (DEBUG) {
    document.getElementById("debugArea").classList.add("debug");

    swEvents.onReload(() => {
        reloadPage(true);
    });
}

swEvents.onConnect(() => socket.emit("join", roomId));
swEvents.onManageClear(() => setWord(""));
swEvents.onSetWord(setWord);

function setColorOnElement(colorName, color) {
    const $el = $('#winner');
    switch (colorName) {
        case 'clrWinnerText':
            $el.css('color', color);
            break;
        case 'clrWinnerBorder':
            $el.css('border-color', color);
            break;
        case 'clrWinnerBackground':
            $el.css('background-color', color);
            break;
        case 'clrTopWordLetter':
            word.setFoundColor(color)
            break;
        case 'clrTopWordLetterBackground':
            word.setBackgroundColor(color)
            break;
        case 'alphaTopWordLetterBackground':
            word.setBackgroundAlpha(color)
            break;
        case 'clrKeyboardLetter':
            keyboard.setDefaultLetterColor(color)
            break;
        case 'clrKeyboardBackground':
            keyboard.setBackgroundColor(color)
            break;
        case 'clrKeyboardBorderColor':
            keyboard.setBorderColor(color)
            break;
        case 'clrUnusedLetter':
            keyboard.setUnusedColor(color)
            break;
        case 'clrDiscoveredLetters':
            keyboard.setUsedColor(color)
            break;
        case 'clrFoundLetters':
            keyboard.setFoundColor(color)
            break;
    }
}

swEvents.onSetColor((colorName, color) => {
    db.setColor(colorName, color)
    setColorOnElement(colorName, color);
});

for (let key in colors) {
    if (colors.hasOwnProperty(key)) {
        setColorOnElement(key, colors[key])
    }
}

function setWord(w) {
    Dev.Log(w);
    activeWord = w.toLowerCase();
    keyboard.resetLetters();

    if (word.show(w)) {
        winnerFound = false;
        keyboard.show();
        $winner.removeClass("win");
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
    socket.emit("winner", JSON.stringify({name: msg.name, word: activeWord, userId: msg.userId}));
    Dev.Log(`winner: ${msg.name} with ${msg.comment}`);
    $winner.addClass("win");
    $winnerName.text(msg.name);
    $winnerWord.text(activeWord);
    setWord("");
    setTimeout(() => {
        $winner.removeClass("win");
        $winnerName.text("");
        $winnerWord.text("");
    }, 10000);
}

function processLetters(guess) {
    word.compare(guess).forEach((findType, letter) => keyboard.markLetterFound(findType, letter));
}

function handleMessage(message) {
    // This handles Zero's plugin for naught words, naughty naughty!
    let magicChar = String.fromCharCode(8203);
    message.comment = message.comment.replaceAll(magicChar, "").trim();
    if (message.comment && message.comment.length === activeWord.length) {
        if (message.comment.toLowerCase() === activeWord) {
            processWinner(message);
        } else {
            swEvents.emitCheckWord(message.comment.toLowerCase());
        }
    }
}


swEvents.onCheckWord(word => {
    if (word) {
        processLetters(word);
    }
});

const messageParser = new MessageParser();
watchChatById(channelId, msg => {
    if (msg.comment && msg.comment.length > 0) {
        handleMessage(msg);
    }
});
