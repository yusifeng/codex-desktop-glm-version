import { FG as savedEntitiesApiState, IG as savedEntityStatusState, PG as initializeSavedEntities } from "@rchunk/app-initial";
initializeSavedEntities();
export { savedEntitiesApiState as savedEntitiesApi$, savedEntityStatusState as savedEntityStatus$ };
