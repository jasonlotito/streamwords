import { SWClient } from "./swlib/swclient.js";
import { DB } from "./db.js";
import { Dev } from "./logger.js";
import { reloadPage } from "./reloader.js";

const nfapi = NowFinityApi();
var socket = io();
const winnerList = document.getElementById("winnerList");
const $frmSetWordWord = $("#frmSetWordWord");
const manageResult = $("#manageResult");
const params = new URLSearchParams(location.search);
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
  swEvents.onError((msg) => {
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

export function setPointsForm($frm, $inpPoints) {
  $frm.submit((e) => {
    e.preventDefault();
    const points = $inpPoints.val();
    if (points < 1) {
      showError("Points for a win must be 1 or greater.");
      return;
    }

    db.setPointsPerWin(points);
  });

  $inpPoints.val(db.getPointsPerWin());
}

export function setWord($frmSetWord) {
  Dev.Log("setWord click handler");
  $frmSetWord.submit((e) => {
    e.preventDefault();
    swEvents.clientEmitNewWord($frmSetWordWord.val(), true);
  });
}

export function setRandomWord($form, $wordList, $hide) {
  Dev.Log("setRandomWord");
  $form.submit((e) => {
    e.preventDefault();
    swEvents.clientEmitRandomWord($wordList.val());
  });

  $hide.change(function () {
    if (this.checked) {
      console.log("hide");
      $frmSetWordWord.attr("type", "password");
    } else {
      console.log("show");
      $frmSetWordWord.attr("type", "text");
    }
  });
}

export function setClearBoardButton($btn) {
  $btn.click(() => swEvents.emitClear());
}

export function setCopyObsUrlButton($btn) {
  $btn.click(() => {
    const { protocol, host } = document.location;
    const roomId = db.getRoom();
    const channelId = db.getChannelId();
    const url = `${protocol}//${location.host}/obs?roomId=${roomId}&channelId=${channelId}`;
    navigator.clipboard.writeText(url);
  });
}

export function setLoginButton($btn, $messageHandler, requireLogin = []) {
  if (nfapi.isLoggedIn()) {
    $btn.text("Disconnect from StreamNow/NowFinity");
  }
  $btn.click((e) => {
    e.preventDefault();

    if (nfapi.isLoggedIn()) {
      nfapi.logout();
      $btn.text("Log into StreamNow/NowFinity.");
      requireLogin.forEach((e) => e.hide());
    } else {
      nfapi
        .requestAuth()
        .then((channelId) => {
          db.setChannelId(channelId);
          db.setRoom();
          joinRoom();
          manageResult.text(`Successfully logged in ${channelId}`);
          requireLogin.forEach((e) => e.show());
        })
        .catch(() => {
          let msg =
            "Failed to connect with StreamNow/NowFinity. Please make sure you are logged into StreamNow.pro and connected to the NowFinity Points system. You will also need to grant access to your NowFinity Account.";
          manageResult.text("Failed to login.");
          showError("Failed to connect with StreamNow/NowFinity.");
          $messageHandler.html(
            `Please log into <a target="_blank" href="https://streamnow.pro">StreamNow.pro</a>. <p>${msg}`
          );
        });
    }
  });

  if (!nfapi.isLoggedIn()) {
    requireLogin.forEach((e) => e.hide());
  }
}

swEvents.onReload(() => {
  Dev.Log("reloading admin");
  reloadPage(true);
});

swEvents.onRandomWordSet((w) => {
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

swEvents.onWinner((msg) => {
  Dev.Log(msg);
  Dev.Log(JSON.parse(msg));
  const { name, word, userId } = JSON.parse(msg);
  db.addWinner(name, word);
  updateWinnerList();
  addPointsForWinner(name, userId, word);
});

function addPointsForWinner(name, userId, word) {
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
    .then((response) => {
      manageResult.text(
        `Winner ${response.channeluser.username} was awarded ${response.transaction.amount} points.`
      );
    })
    .catch((error) => {
      manageResult.text(JSON.stringify(error, null, 2));
    });
}

function updateWinnerList() {
  let winners = db.getWinners();
  winnerList.innerHTML = "";
  winners.forEach(({ name, word }) => {
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
