import { ny, type DelegateOptions } from "./open-file-watches";
export async function delegateTurnStartToFollower<T extends { result: unknown }>(options: DelegateOptions<T>): Promise<T | null> { return ny(options); }
