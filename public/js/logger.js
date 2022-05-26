const LEVELS = Object.freeze({
    ALL: 0,
    DEBUG: 1,
    INFO: 2,
    WARN: 3,
    ERROR: 4
});

function Log(...args) {
    console.log(...args);
}

function Debug(...args) {
    console.debug(...args);
}

function Info(...args) {
    console.info(...args);
}

function Warn(...args) {
    console.warn(...args);
}

function Error(...args) {
    console.error(...args);
}

export const Dev = {
    LEVELS,
    Log,
    Debug,
    Info,
    Warn,
    Error
}