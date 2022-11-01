type Node = [number, string];
type Branch<T> = (Node | T)[];
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Tree extends Branch<Tree> {}

export interface SwapTree {
    tree: Tree;
}
