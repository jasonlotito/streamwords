const ProgressBar = require('progress')
const wordlist = require("wordlist-english");
const {OPEN_READWRITE, OPEN_CREATE} = require("sqlite3");
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('word.db', OPEN_READWRITE )
const uncleanedEnglishWords = Array.from([...wordlist["english/10"],...wordlist["english/20"], ...wordlist['english/35']]);
const words = [];

englishWords = uncleanedEnglishWords.filter(w => {
    if(w.length === 7 || w.length === 6 || w.length === 8) {
        words.push(w);
        return true;
    }

    return w.length < 9 && w.length > 3;
});
db.serialize(() => {
    console.log(englishWords.length);
    const insertWordlist = db.prepare('INSERT INTO wordlist VALUES (?)')

    words.forEach(w => {
        insertWordlist.run( w );
    });

    insertWordlist.finalize();

    db.each("SELECT word FROM wordlist", (err, row) => {
        if(err) console.error(err);
        console.log(row)
    })
})
db.close();

process.exit(0);

const bar = new ProgressBar(':bar', {total: words.length})
const discoveredWords = [];
words.forEach(w => {
    const wordsFromLetters = new Map();
    const startingWordArray = Array.from(w)
    startingWordArray.forEach(l => {
        englishWords.forEach(checkingWord => {
            if(checkingWord.length<4) return;
            if( checkingWord.includes(l) ) {
                let isGoodWord = true;
                const checkingWordArray = Array.from(checkingWord);
                const testingWordArray = Array.from(startingWordArray);
                checkingWordArray.forEach(ltr => {
                    if (isGoodWord) {
                        isGoodWord = testingWordArray.includes(ltr);
                        if (isGoodWord) {
                            testingWordArray.splice(testingWordArray.indexOf(ltr), 1);
                        }
                    }
                });

                if(isGoodWord) {
                    wordsFromLetters.set(checkingWord, checkingWord);
                }
            }
        });
    });

    wordsFromLetters.forEach(word => {
        const plural = `${word}s`
        wordsFromLetters.delete(plural);
    })

    if ( wordsFromLetters.size < 7 || wordsFromLetters.size > 20) {
       return;
    }

    discoveredWords.push({word: w, words: wordsFromLetters});
    bar.tick();
});


console.log(discoveredWords, discoveredWords.length);

