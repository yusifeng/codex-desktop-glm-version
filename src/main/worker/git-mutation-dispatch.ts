export async function dispatchGitMutationRequest(method: string, params: any, deps: any): Promise<any> {
  switch (method) { case `push`: return deps.push(params); case `checkout-branch`: return deps.checkout(params); case `commit`: return deps.commit(params); case `set-config-value`: return deps.setConfig(params); default: return undefined; }
}
if (typeof module !== `undefined`) module.exports = { dispatchGitMutationRequest };
