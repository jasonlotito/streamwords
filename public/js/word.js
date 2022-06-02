export function Word ($word, {foundColor, backgroundColor, backgroundAlpha = 1}) {
    this.el = $word;
    this.word = '';
    this.visible = true;
    this.foundColor = foundColor;
    this.backgroundColor = backgroundColor;
    this.backgroundAlpha = backgroundAlpha;
}

function loopLetters(word, cb) {
    let chr = '';
    for (let x = 0; x < word.length; x++) {
        [chr, x] = getWholeCharAndI(word, x);
        cb(chr);
    }
}

function hexToRgbA(hex, alpha=100){
    var c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length === 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        alpha = alpha/100;
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+`,${alpha})`;
    }
    throw new Error('Bad Hex');
}

Word.prototype.setFoundColor = function (foundColor) {
    this.foundColor = foundColor;
    this.refreshColors();
}

Word.prototype.setBackgroundColor = function(color) {
    this.backgroundColor = color;
    this.refreshColors();
};

Word.prototype.setBackgroundAlpha = function(alpha) {
    this.backgroundAlpha = alpha;
    this.refreshColors();
}

Word.prototype.refreshColors = function() {
    Array.from(this.el.children()).forEach(child => {
        child = $(child)
        child.css('border-bottom', `10px solid ${this.foundColor}`)
        if(child.attr('x-state') === 'found') {
            child.css('color', this.foundColor)
        }
    })

    const bgColor = hexToRgbA(this.backgroundColor, this.backgroundAlpha)
    this.el.css('background-color', bgColor);
}
Word.prototype.isVisible = function (visible) {
    this.visible = visible;
}

Word.prototype.show = function (word) {
    this.el.html('')
    this.word = word;
    if(this.visible) {
        loopLetters(word, (chr) => {
            const $letter = $(`<span>${chr}</span>`)
            $letter.attr('x-state', 'unfound');
            this.el.append($letter)
        })

        this.refreshColors()
    }


    return word.length > 0;
}

Word.prototype.foundLetter = function(pos) {
    $(this.el.children()[pos]).css('color', this.foundColor)
}

Word.prototype.compare = function(word) {
    let map = new Map();

    for (let x = 0; x < word.length; x++) {
        if (checkLetterPosition(this, word[x], x)) {
            this.foundLetter(x);
            map.set(word[x], 1);
        } else if (this.word.includes(word[x]) && (!map.has(word[x]) || map.get(word[x]) < 0)) {
            map.set(word[x], 0);
        } else if (!map.has(word[x])) {
            map.set(word[x], -1);
        }
    }

    return map;
}

function checkLetterPosition(word, letter, pos) {
    if (word.word[pos] && word.word[pos] === letter.toLowerCase()) {
        return true;
    }

    return false;
}

function getWholeCharAndI(str, i) {
    let code = str.charCodeAt(i)

    if (Number.isNaN(code)) {
        return ''  // Position not found
    }
    if (code < 0xD800 || code > 0xDFFF) {
        return [str.charAt(i), i]  // Normal character, keeping 'i' the same
    }

    // High surrogate (could change last hex to 0xDB7F to treat high private
    // surrogates as single characters)
    if (0xD800 <= code && code <= 0xDBFF) {
        if (str.length <= (i + 1)) {
            throw 'High surrogate without following low surrogate'
        }
        let next = str.charCodeAt(i + 1)
        if (0xDC00 > next || next > 0xDFFF) {
            throw 'High surrogate without following low surrogate'
        }
        return [str.charAt(i) + str.charAt(i + 1), i + 1]
    }

    // Low surrogate (0xDC00 <= code && code <= 0xDFFF)
    if (i === 0) {
        throw 'Low surrogate without preceding high surrogate'
    }

    let prev = str.charCodeAt(i - 1)

    // (could change last hex to 0xDB7F to treat high private surrogates
    // as single characters)
    if (0xD800 > prev || prev > 0xDBFF) {
        throw 'Low surrogate without preceding high surrogate'
    }

    // Return the next character instead (and increment)
    return [str.charAt(i + 1), i + 1]
}
