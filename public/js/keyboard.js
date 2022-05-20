
export function Keyboard(el, alphabet, {found, used, unused, defaultColor, backgroundColor, borderColor}) {
    this.el = el;
    this.alphabet = alphabet;
    this.visible = true;
    this.foundColor = found;
    this.usedColor = used;
    this.unusedColor = unused;
    this.defaultColor = defaultColor;
    this.backgroundColor = backgroundColor;
    this.borderColor = borderColor;
}

Keyboard.prototype.setBackgroundColor = function(color) {
    this.backgroundColor = color;
}

Keyboard.prototype.setBorderColor = function(color) {
    this.borderColor = color;
}

Keyboard.prototype.setDefaultLetterColor = function(color) {
    this.defaultColor = color;
}

Keyboard.prototype.setFoundColor = function(color) {
    this.foundColor = color;
}

Keyboard.prototype.setUsedColor = function(color) {
    this.usedColor = color;
}

Keyboard.prototype.setUnusedColor = function(color) {
    this.unusedColor = color;
}

Keyboard.prototype.resetLetters = function() {
    if (this.visible) {
        this.el.html('')
        this.alphabet.forEach(letter => {
            this.el.append(`<span style="border-color: ${this.borderColor}; color: ${this.defaultColor}; background-color: ${this.backgroundColor}">${letter}</span>`)
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
    const idx = this.alphabet.indexOf(letter);

    if (idx === -1) {
        return;
    }

    const lettersChildren = this.el.children();
    switch (findType) {
        case 1:
            $(lettersChildren[idx]).css('color',this.foundColor);
            break;
        case 0:
            $(lettersChildren[idx]).css('color',this.usedColor);
            break;
        default:
            $(lettersChildren[idx]).css('color', this.unusedColor);
            break;
    }
}
