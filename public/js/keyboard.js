
export function Keyboard(el, alphabet) {
    this.el = el;
    this.alphabet = alphabet;
    this.visible = true;
}

Keyboard.prototype.resetLetters = function() {
    if (this.visible) {
        this.el.html('')
        this.alphabet.forEach(letter => {
            this.el.append(`<span>${letter}</span>`)
        });
    }
}

Keyboard.prototype.hide = function() {
    this.el.addClass('hide');
}

Keyboard.prototype.isVisible = function(visible) {
    this.visible = visible;
}

Keyboard.prototype.show = function() {
    if (this.visible) {
        this.el.removeClass('hide');
    }
}

Keyboard.prototype.markLetterFound = function (findType, letter) {
    let idx = this.alphabet.indexOf(letter);

    if (idx === -1) {
        return;
    }

    var lettersChildren = this.el.children();
    switch (findType) {
        case 1:
            $(lettersChildren[idx]).addClass('found');
            break;
        case 0:
            $(lettersChildren[idx]).addClass('used');
            break;
        default:
            $(lettersChildren[idx]).addClass('unused');
            break;
    }
}