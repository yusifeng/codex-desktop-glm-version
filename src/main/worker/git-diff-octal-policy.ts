function isOctalDigit(value: string) { return value >= `0` && value <= `7`; }
function isThreeDigitOctal(value: string) { return value.length === 3 && [...value].every(isOctalDigit); }
export { isOctalDigit, isThreeDigitOctal };
if (typeof module !== `undefined`) module.exports = { isOctalDigit, isThreeDigitOctal };
