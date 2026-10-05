function gitErrorType(result: { code?: number | null }): `not-found` | `unknown` { return result.code === 128 ? `not-found` : `unknown`; }
export { gitErrorType };
if (typeof module !== `undefined`) module.exports = { gitErrorType };
