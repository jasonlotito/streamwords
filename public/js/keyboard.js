
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
    this.refreshColors();
}

Keyboard.prototype.setBorderColor = function(color) {
    this.borderColor = color;
    this.refreshColors();
}

Keyboard.prototype.setDefaultLetterColor = function(color) {
    this.defaultColor = color;
    this.refreshColors();
}

Keyboard.prototype.setFoundColor = function(color) {
    this.foundColor = color;
    this.refreshColors();
}

Keyboard.prototype.setUsedColor = function(color) {
    this.usedColor = color;
    this.refreshColors();
}

Keyboard.prototype.setUnusedColor = function(color) {
    this.unusedColor = color;
    this.refreshColors();
}

Keyboard.prototype.resetLetters = function() {
    if (this.visible) {
        this.el.html('')
        this.alphabet.forEach(letter => {
            const $letter = $(`<span style="border-color: ${this.borderColor}; color: ${this.defaultColor}; background-color: ${this.backgroundColor}">${letter}</span>`);
            $letter.attr('x-state', 'default')
            this.el.append($letter)
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

Keyboard.prototype.refreshColors = function() {
    const lettersChildren = Array.from(this.el.children());
    lettersChildren.forEach(letter => {
        letter = $(letter)
        switch(letter.attr('x-state')) {
            case 'found':
                letter.css('color', this.foundColor)
                break;
            case 'used':
                letter.css('color', this.usedColor)
                break;
            case 'unused':
                letter.css('color', this.unusedColor)
                break;
            default:
                letter.css('color', this.defaultColor)
                break;
        }
        letter.css('border-color', this.borderColor)
        letter.css('background-color', this.backgroundColor)
    });
}

Keyboard.prototype.markLetterFound = function (findType, letter) {
    const idx = this.alphabet.indexOf(letter);

    if (idx === -1) {
        return;
    }

    const lettersChildren = Array.from(this.el.children());
    const $letter = $(lettersChildren[idx]);
    switch (findType) {
        case 1:
            $letter.css('color', this.foundColor);
            $letter.attr('x-state', 'found')
            break;
        case 0:
            $letter.css('color', this.usedColor);
            $letter.attr('x-state', 'used')
            break;
        default:
            $letter.css('color', this.unusedColor);
            $letter.attr('x-state', 'unused')
            break;
    }
}
