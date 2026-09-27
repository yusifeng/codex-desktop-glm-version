import"@rchunk/app-shared";import"@rchunk/app-initial";
export interface PersonalSecretsSelection{accountId:string;userId:string;config:{id:string;name?:string};preflightPersonalSecrets?(input:{accountId:string;userId:string;configId:string}):Promise<{ok:boolean;data?:PersonalSecretsPreflight}>;}
export interface PersonalSecretsIssue{namespace:"sensitive"|"not_sensitive";env_var:string;code:string;id?:string;error?:string;}
export interface PersonalSecretsPreflight{issues:PersonalSecretsIssue[];}
async function preflightPersonalSecrets(selection:PersonalSecretsSelection):Promise<PersonalSecretsPreflight|null>{try{const response=await selection.preflightPersonalSecrets?.({accountId:selection.accountId,userId:selection.userId,configId:selection.config.id});return response?.ok?response.data??null:null;}catch{return null;}}const initializePersonalSecretsService=():void=>{};export{preflightPersonalSecrets as n,initializePersonalSecretsService as t};
