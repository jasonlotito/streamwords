import {SWClient} from "./swlib/swclient.js";
import {DB} from "./db.js";
import {Dev} from "./logger.js";
import {reloadPage} from "./reloader.js";
// import {OBSWebSocket} from "./vendor/obs-websocket.min";

// const obs = new OBSWebSocket();
/*
#TODO URL param to hide preview
#TODO Setting width for settings config
#TODO Only shows specific settings (such as Streamwords and Global Settings)
#TODO URL Param for source (Such as YouNow)
 */
const nfapi = NowFinityApi();
var socket = io();
const winnerList = document.getElementById("winnerList");
const $frmSetWordWord = $("#frmSetWordWord");
const manageResult = $("#manageResult");
const swEvents = new SWClient(socket, nfapi);
const db = DB;

let $errorContainer = null;

// enable debug
if (location.search.toLowerCase().includes("debug=true")) {
    const DEBUG = true;
    document.getElementById("debugArea").setAttribute("style", "display: block");
} else {
    const DEBUG = false;
}

export function setErrorContainer($eError) {
    $errorContainer = $eError;
    swEvents.onError(msg => {
        $frmSetWordWord.val("");
        db.addWord("");
        $frmSetWordWord.focus();
        showError(msg);
    });
}

function showError(msg) {
    $errorContainer.show();
    $errorContainer.text(msg);
    setTimeout(() => $errorContainer.hide(200), 10000);
}

export function setPointsForm($inpPoints) {
    $inpPoints.change( e => {
        e.preventDefault();
        const points = $inpPoints.val();
        if (points < 0) {
            showError("Points for a win must be 0 or greater.");
            return;
        }

        db.setPointsPerWin(points);
    });

    $inpPoints.val(db.getPointsPerWin());
}

export function setWord($frmSetWord) {
    Dev.Log("setWord click handler");
    $frmSetWord.submit(e => {
        e.preventDefault();
        swEvents.clientEmitNewWord($frmSetWordWord.val(), true);
    });
}

export function setRandomWord($form, $wordList, $hide) {
    Dev.Log("setRandomWord");
    $form.submit(e => {
        e.preventDefault();
        swEvents.clientEmitRandomWord($wordList.val());
    });

    $hide.change(function () {
        if (this.checked) {
            console.log("hide");
            $frmSetWordWord.attr("type", "password");
            db.setHideWord(true);
        } else {
            console.log("show");
            $frmSetWordWord.attr("type", "text");
            db.setHideWord(false);
        }
    });

    if (db.hideWord()) {
        $hide.click();
    }
}

export function setClearBoardButton(btns) {
    btns.forEach($btn => {
        $btn.click(() => {
            if(confirm("Clear the board?")) {
                swEvents.emitClear()
            }
        });
    })
}

function getObsUrl() {
    const {protocol, host} = document.location;
    const roomId = db.getRoom();
    const channelId = db.getChannelId();
    return `${protocol}//${host}/obs?roomId=${roomId}&channelId=${channelId}`;
}

export function setCopyObsUrlButton($btn) {
    const iframe = document.querySelector('#iframePreview')
    iframe.setAttribute('src', getObsUrl() + "&IS_SETUP=true")

    $btn.click(() => {
        const url = getObsUrl();
        if (window.isSecureContext && window.navigator.clipboard) {
            window.navigator.clipboard.writeText(url);
            $btn.text("Copied!");
            setTimeout(()=>$btn.text("Copy OBS Browser URL"), 10000);
        } else {
            const el = document.querySelector('#streamwordsObsUrl');
            el.value = url;
            el.classList.remove('hide')
        }
    });
}

export function setAlphaControl(alphaElements) {
    alphaElements.forEach($control => {
        const valueContainerId = `#${$control.attr('id')}Value`
        const $alphaValueContainer = $(valueContainerId);
        $control.change(e => {
            $alphaValueContainer.val($control.val());
            emitAlphaChange($control.val())
        });

        $alphaValueContainer.change(e => {
            emitAlphaChange($alphaValueContainer.val())
        });

        const alphas = db.getAlphas()
        if (alphas.hasOwnProperty($control.attr('id'))) {
            const alpha = alphas[$control.attr('id')];
            $control.val(alpha);
            $alphaValueContainer.val(alpha);
        }
    })
}

function emitAlphaChange(alphaValue) {
    db.setAlpha('alphaTopWordLetterBackground', alphaValue)
    swEvents.clientEmitColor('alphaTopWordLetterBackground', alphaValue)
}

// Set the color control element
// Listen for color changes
// Store color changes in the DB
// Emit changes to the server
// Have the server send changes to the client
// Have client change the appropriate elements color
/* <input type="color" name="clrTopWordLetter" id="clrTopWordLetter" value="#ff4500" /> */
export function setColorControl(colorElements) {
    colorElements.forEach($control => {
        const name = $control.attr("name");
        const colors = db.getColors()

        if (colors[name]) {
            console.log("Using existing color")
            $control.val(colors[name])
        }

        $control.change(e => {
            const color = $control.val();
            console.log(e);
            db.setColor(name, $control.val())
            swEvents.clientEmitColor(name, color);
        });
    });
}

export function setLoginButton($btn, $messageHandler, $login, $streamWordsSettings) {
    if (nfapi.isLoggedIn()) {
        $btn.text("Disconnect from StreamNow/NowFinity");
        $streamWordsSettings.attr('open', true);
    }
    $btn.click(e => {
        e.preventDefault();

        if (nfapi.isLoggedIn()) {
            if (window.confirm("Are you sure you want to disconnect")) {
                nfapi.logout();
                $btn.text("Log into StreamNow/NowFinity.");
            }
        } else {
            nfapi
                .requestAuth()
                .then((channelId) => {
                    const nfChannelId = localStorage.getItem("nf_channelId");
                    const nfChannelSignature = localStorage.getItem("nf_channelSignature");
                    handleLogin(nfChannelId, nfChannelSignature)
                    $login.attr('open', false)
                    $streamWordsSettings.attr('open', true);
                })
                .catch(() => {
                    let msg =
                        "Failed to connect with StreamNow/NowFinity. Please make sure you are logged into StreamNow.pro and connected to the NowFinity Points system. You will also need to grant access to your NowFinity Account.";
                    $manageResult.text("Failed to login.");
                    //showError("Failed to connect with StreamNow/NowFinity.");
                    $messageHandler.html(
                        `Please log into <a target="_blank" href="https://streamnow.pro">StreamNow.pro</a>. <p>${msg}`
                    );
                });
        }

    });

    if (!nfapi.isLoggedIn()) {
        // TODO Make this work for the new layout and UI
        // TODO Make it so when the page is loaded, all this information can be provided via the URL
        $login.attr('open', true);
    }
}
function handleLogin (nfChannelId, nfChannelSignature) {
    localStorage.setItem("nf_channelId", nfChannelId);
    localStorage.setItem("nf_channelSignature", nfChannelSignature);
    db.setChannelId(nfChannelId);
    db.setRoom();
    joinRoom();
}

swEvents.onNFLogin(handleLogin);

swEvents.onReload(() => {
    Dev.Log("reloading admin");
    reloadPage(true);
});

swEvents.onRandomWordSet(w => {
    db.addWord(w);
    $frmSetWordWord.val(w);
});

swEvents.onConnect(() => {
    if (nfapi.isLoggedIn()) {
        joinRoom();
    }
});

function joinRoom() {
    swEvents.joinRoom(db.getRoom());
    if (db.hasWord()) {
        swEvents.clientEmitNewWord(db.getWord(), false);
    }
}

swEvents.onWinner(msg => {
    Dev.Log(msg);
    Dev.Log(JSON.parse(msg));
    const {name, word, userId} = JSON.parse(msg);
    db.addWinner(name, word);
    updateWinnerList();
    addPointsForWinner(name, userId, word);
});

function addPointsForWinner(name, userId, word) {
    if (db.getPointsPerWin() < 1) {
       return;
    }

    nfapi
        .put("rest/transaction", {
            userId: userId,
            username: name,
            amount: db.getPointsPerWin(),
            description: `StreamWords Reward: ${word}`,
            isManual: false,
            isReward: true, // count to level?
            preBalanceValidation: false, // pre-validate balance before withdraw points to check if the viewer has enogh points
        })
        .then(response => {
            manageResult.text(`Winner ${response.channeluser.username} was awarded ${response.transaction.amount} points.`);
        })
        .catch(error => {
            manageResult.text(JSON.stringify(error, null, 2));
        });
}

function updateWinnerList() {
    let winners = db.getWinners();
    winnerList.innerHTML = "";
    winners.forEach(({name, word}) => {
        let li = document.createElement("li");
        li.innerText = `${name} (${word})`;
        winnerList.appendChild(li);
    });
}

updateWinnerList();

// If we have a word set, populate the word input
if (db.hasWord()) {
    $frmSetWordWord.val(db.getWord());
}

Dev.Info("Admin loaded.");
