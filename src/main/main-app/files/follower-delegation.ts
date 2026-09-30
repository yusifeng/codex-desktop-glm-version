import { ny } from "./open-file-watches";
export async function delegateTurnStartToFollower<T extends { result: unknown }>(options: Parameters<typeof ny<T>>[0]): Promise<T | null> { return ny(options); }
