const scaleSize = (size, scale) => ((size * scale) / 100);

const scaleWidth = (scale) => scaleSize(63, scale);
const scaleHeight = (scale) => scaleSize(88, scale);

const isDigit = (c) => c >= "0" && c <= "9";

const isDigits = (s) => [...s].every(isDigit);

const countWhile = (source, f) => {
    let i = 0;
    for (; f(source[i]); i++);
    return i;
}

const indexOfNaN = (input) => countWhile(input, isDigit);
