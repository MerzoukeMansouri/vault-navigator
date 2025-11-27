/**
 * Generic tree manipulation utilities
 * Provides type-safe operations for tree structures
 */

export interface TreeNode<T = Record<string, unknown>> {
  path: string;
  children?: TreeNode<T>[];
  [key: string]: unknown;
}

export class TreeUtils {
  /**
   * Updates a node in a tree structure
   * @param nodes - The array of tree nodes
   * @param targetPath - The path of the node to update
   * @param updater - Function that receives the node and returns the updated node
   * @returns A new array with the updated node
   */
  static updateNode<T extends TreeNode>(
    nodes: T[],
    targetPath: string,
    updater: (node: T) => T
  ): T[] {
    return nodes.map((node) => {
      if (node.path === targetPath) {
        return updater(node);
      }
      if (node.children) {
        return {
          ...node,
          children: this.updateNode(node.children as T[], targetPath, updater),
        } as T;
      }
      return node;
    });
  }

  /**
   * Finds a node in a tree structure
   * @param nodes - The array of tree nodes
   * @param predicate - Function that returns true for the target node
   * @returns The found node or null
   */
  static findNode<T extends TreeNode>(
    nodes: T[],
    predicate: (node: T) => boolean
  ): T | null {
    for (const node of nodes) {
      if (predicate(node)) {
        return node;
      }
      if (node.children) {
        const found = this.findNode(node.children as T[], predicate);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  /**
   * Finds a node by path
   * @param nodes - The array of tree nodes
   * @param path - The path to search for
   * @returns The found node or null
   */
  static findNodeByPath<T extends TreeNode>(nodes: T[], path: string): T | null {
    return this.findNode(nodes, (node) => node.path === path);
  }

  /**
   * Collects all nodes matching a predicate
   * @param nodes - The array of tree nodes
   * @param predicate - Function that returns true for nodes to collect
   * @returns Array of matching nodes
   */
  static collectNodes<T extends TreeNode>(
    nodes: T[],
    predicate: (node: T) => boolean
  ): T[] {
    const collected: T[] = [];

    for (const node of nodes) {
      if (predicate(node)) {
        collected.push(node);
      }
      if (node.children) {
        collected.push(...this.collectNodes(node.children as T[], predicate));
      }
    }

    return collected;
  }

  /**
   * Maps over all nodes in a tree
   * @param nodes - The array of tree nodes
   * @param mapper - Function to transform each node
   * @returns A new tree with transformed nodes
   */
  static mapNodes<T extends TreeNode>(
    nodes: T[],
    mapper: (node: T) => T
  ): T[] {
    return nodes.map((node) => {
      const mappedNode = mapper(node);
      if (mappedNode.children) {
        return {
          ...mappedNode,
          children: this.mapNodes(mappedNode.children as T[], mapper),
        } as T;
      }
      return mappedNode;
    });
  }

  /**
   * Filters nodes in a tree
   * @param nodes - The array of tree nodes
   * @param predicate - Function that returns true for nodes to keep
   * @returns A new tree with filtered nodes
   */
  static filterNodes<T extends TreeNode>(
    nodes: T[],
    predicate: (node: T) => boolean
  ): T[] {
    return nodes.filter(predicate).map((node) => {
      if (node.children) {
        return {
          ...node,
          children: this.filterNodes(node.children as T[], predicate),
        } as T;
      }
      return node;
    });
  }

  /**
   * Flattens a tree structure into an array
   * @param nodes - The array of tree nodes
   * @returns A flat array of all nodes
   */
  static flattenTree<T extends TreeNode>(nodes: T[]): T[] {
    const flattened: T[] = [];

    for (const node of nodes) {
      flattened.push(node);
      if (node.children) {
        flattened.push(...this.flattenTree(node.children as T[]));
      }
    }

    return flattened;
  }

  /**
   * Gets the depth of a tree
   * @param nodes - The array of tree nodes
   * @returns The maximum depth of the tree
   */
  static getTreeDepth<T extends TreeNode>(nodes: T[]): number {
    if (nodes.length === 0) {
      return 0;
    }

    let maxDepth = 1;

    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        const childDepth = this.getTreeDepth(node.children as T[]);
        maxDepth = Math.max(maxDepth, 1 + childDepth);
      }
    }

    return maxDepth;
  }

  /**
   * Counts total nodes in a tree
   * @param nodes - The array of tree nodes
   * @returns The total number of nodes
   */
  static countNodes<T extends TreeNode>(nodes: T[]): number {
    return this.flattenTree(nodes).length;
  }
}
