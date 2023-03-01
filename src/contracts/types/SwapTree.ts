type Node = [number, string];
type Branch<T> = {
    value: Node;
    children?: T[];
};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Tree extends Branch<Tree> {}

export interface SwapTree {
    tree: Tree;
}
