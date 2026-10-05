const ZERO_OID = /^0+$/;
function isQueryableOid(oid: string | null | undefined) { return oid ? !ZERO_OID.test(oid) : false; }
export { isQueryableOid };
if (typeof module !== `undefined`) module.exports = { isQueryableOid };
