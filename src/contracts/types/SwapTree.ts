type Node = [number, string];
type Branch<T> = (Node | T)[];
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SwapTree extends Branch<SwapTree> {}
