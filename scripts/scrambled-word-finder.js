const sqlite3 = require('better-sqlite3');
const db = sqlite3('wordlist');
const ProgressBar = require('progress')
const wordlist = require("wordlist-english");
const uncleanedEnglishWords = Array.from([...wordlist["english/10"], ...wordlist["english/20"], ...wordlist['english/35']]);
const words = [];

englishWords = uncleanedEnglishWords.filter(w => {
    if (w.length === 7 || w.length === 6 || w.length === 8) {
        words.push(w);
        return true;
    }

    return w.length < 9 && w.length > 3;
});

db.exec("CREATE TABLE IF NOT EXISTS words (id INTEGER primary key, word TEXT not null )");
db.exec("CREATE TABLE IF NOT EXISTS answers (id INTEGER primary key, word TEXT not null  )")
db.exec("CREATE TABLE IF NOT EXISTS word_answers (words_id INT, answers_id INT, PRIMARY KEY(words_id, answers_id))")

const stmt = db.prepare("INSERT INTO words VALUES (?, ?)")

words.forEach((w, k) => {
    stmt.run(k, w);
});

process.exit(0);

const bar = new ProgressBar(':bar', {total: words.length})
const discoveredWords = [];
words.forEach(w => {
    const wordsFromLetters = new Map();
    const startingWordArray = Array.from(w)
    startingWordArray.forEach(l => {
        englishWords.forEach(checkingWord => {
            if (checkingWord.length < 4) return;
            if (checkingWord.includes(l)) {
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

                if (isGoodWord) {
                    wordsFromLetters.set(checkingWord, checkingWord);
                }
            }
        });
    });

    wordsFromLetters.forEach(word => {
        const plural = `${word}s`
        wordsFromLetters.delete(plural);
    })

    if (wordsFromLetters.size < 7 || wordsFromLetters.size > 20) {
        return;
    }

    discoveredWords.push({word: w, words: wordsFromLetters});
    bar.tick();
});


console.log(discoveredWords, discoveredWords.length);

//*/
