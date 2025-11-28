import { describe, test, expect } from "vitest";
import { TreeUtils, TreeNode } from "../tree-utils";

interface TestNode extends TreeNode {
  name: string;
  value?: number;
}

describe("TreeUtils", () => {
  const createSampleTree = (): TestNode[] => [
    {
      path: "/root",
      name: "root",
      value: 1,
      children: [
        {
          path: "/root/child1",
          name: "child1",
          value: 2,
          children: [
            {
              path: "/root/child1/grandchild1",
              name: "grandchild1",
              value: 3,
            },
            {
              path: "/root/child1/grandchild2",
              name: "grandchild2",
              value: 4,
            },
          ],
        },
        {
          path: "/root/child2",
          name: "child2",
          value: 5,
        },
      ],
    },
    {
      path: "/root2",
      name: "root2",
      value: 6,
    },
  ];

  describe("updateNode", () => {
    test("updates root level node", () => {
      const tree = createSampleTree();
      const updated = TreeUtils.updateNode(tree, "/root", (node) => ({
        ...node,
        value: 100,
      }));

      expect(updated[0].value).toBe(100);
      expect(updated[0].path).toBe("/root");
    });

    test("updates nested node", () => {
      const tree = createSampleTree();
      const updated = TreeUtils.updateNode(tree, "/root/child1", (node) => ({
        ...node,
        value: 200,
      }));

      const child1 = updated[0].children?.[0] as TestNode;
      expect(child1.value).toBe(200);
    });

    test("updates deeply nested node", () => {
      const tree = createSampleTree();
      const updated = TreeUtils.updateNode(
        tree,
        "/root/child1/grandchild1",
        (node) => ({
          ...node,
          value: 300,
        })
      );

      const grandchild = updated[0].children?.[0].children?.[0] as TestNode;
      expect(grandchild.value).toBe(300);
    });

    test("does not modify original tree", () => {
      const tree = createSampleTree();
      const originalValue = tree[0].value;

      TreeUtils.updateNode(tree, "/root", (node) => ({
        ...node,
        value: 999,
      }));

      expect(tree[0].value).toBe(originalValue);
    });

    test("returns unchanged tree when path not found", () => {
      const tree = createSampleTree();
      const updated = TreeUtils.updateNode(
        tree,
        "/nonexistent",
        (node) => node
      );

      expect(updated).toEqual(tree);
    });

    test("can add properties to node", () => {
      const tree = createSampleTree();
      const updated = TreeUtils.updateNode(tree, "/root", (node) => ({
        ...node,
        newProp: "test",
      }));

      expect((updated[0] as TestNode & { newProp?: string }).newProp).toBe("test");
    });
  });

  describe("findNode", () => {
    test("finds root level node", () => {
      const tree = createSampleTree();
      const found = TreeUtils.findNode(tree, (node) => node.name === "root2");

      expect(found?.path).toBe("/root2");
    });

    test("finds nested node", () => {
      const tree = createSampleTree();
      const found = TreeUtils.findNode(tree, (node) => node.name === "child1");

      expect(found?.path).toBe("/root/child1");
    });

    test("finds deeply nested node", () => {
      const tree = createSampleTree();
      const found = TreeUtils.findNode(
        tree,
        (node) => node.name === "grandchild2"
      );

      expect(found?.path).toBe("/root/child1/grandchild2");
    });

    test("returns null when node not found", () => {
      const tree = createSampleTree();
      const found = TreeUtils.findNode(
        tree,
        (node) => node.name === "nonexistent"
      );

      expect(found).toBeNull();
    });

    test("finds node by custom predicate", () => {
      const tree = createSampleTree();
      const found = TreeUtils.findNode(tree, (node) => node.value === 4);

      expect(found?.name).toBe("grandchild2");
    });

    test("returns first matching node", () => {
      const tree: TestNode[] = [
        { path: "/a", name: "duplicate" },
        { path: "/b", name: "duplicate" },
      ];
      const found = TreeUtils.findNode(tree, (node) => node.name === "duplicate");

      expect(found?.path).toBe("/a");
    });
  });

  describe("findNodeByPath", () => {
    test("finds node by exact path", () => {
      const tree = createSampleTree();
      const found = TreeUtils.findNodeByPath(tree, "/root/child1");

      expect(found?.name).toBe("child1");
    });

    test("finds deeply nested node by path", () => {
      const tree = createSampleTree();
      const found = TreeUtils.findNodeByPath(
        tree,
        "/root/child1/grandchild1"
      );

      expect(found?.name).toBe("grandchild1");
    });

    test("returns null for non-existent path", () => {
      const tree = createSampleTree();
      const found = TreeUtils.findNodeByPath(tree, "/nonexistent");

      expect(found).toBeNull();
    });
  });

  describe("collectNodes", () => {
    test("collects all matching nodes", () => {
      const tree = createSampleTree();
      const collected = TreeUtils.collectNodes(tree, (node) =>
        node.name.startsWith("child")
      );

      expect(collected).toHaveLength(2);
      expect(collected.map((n) => n.name)).toEqual(["child1", "child2"]);
    });

    test("collects nodes at different levels", () => {
      const tree = createSampleTree();
      const collected = TreeUtils.collectNodes(tree, (node) =>
        node.name.includes("child")
      );

      expect(collected).toHaveLength(4); // child1, child2, grandchild1, grandchild2
    });

    test("returns empty array when no matches", () => {
      const tree = createSampleTree();
      const collected = TreeUtils.collectNodes(
        tree,
        (node) => node.name === "nonexistent"
      );

      expect(collected).toEqual([]);
    });

    test("collects by value predicate", () => {
      const tree = createSampleTree();
      const collected = TreeUtils.collectNodes(
        tree,
        (node) => (node.value ?? 0) > 3
      );

      expect(collected.map((n) => n.value)).toEqual([4, 5, 6]);
    });
  });

  describe("mapNodes", () => {
    test("maps all nodes in tree", () => {
      const tree = createSampleTree();
      const mapped = TreeUtils.mapNodes(tree, (node) => ({
        ...node,
        value: (node.value ?? 0) * 2,
      }));

      expect(mapped[0].value).toBe(2);
      expect((mapped[0].children?.[0] as TestNode).value).toBe(4);
    });

    test("preserves tree structure", () => {
      const tree = createSampleTree();
      const mapped = TreeUtils.mapNodes(tree, (node) => ({
        ...node,
        mapped: true,
      }));

      expect(mapped[0].children).toBeDefined();
      expect(mapped[0].children?.[0].children).toBeDefined();
    });

    test("does not modify original tree", () => {
      const tree = createSampleTree();
      const originalValue = tree[0].value;

      TreeUtils.mapNodes(tree, (node) => ({
        ...node,
        value: 999,
      }));

      expect(tree[0].value).toBe(originalValue);
    });

    test("can transform node properties", () => {
      const tree = createSampleTree();
      const mapped = TreeUtils.mapNodes(tree, (node) => ({
        ...node,
        name: node.name.toUpperCase(),
      }));

      expect(mapped[0].name).toBe("ROOT");
      expect((mapped[0].children?.[0] as TestNode).name).toBe("CHILD1");
    });
  });

  describe("filterNodes", () => {
    test("filters nodes at root level", () => {
      const tree = createSampleTree();
      const filtered = TreeUtils.filterNodes(tree, (node) =>
        node.name.includes("root2")
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe("root2");
    });

    test("filters nested nodes", () => {
      const tree = createSampleTree();
      // Filter nodes with value > 2
      const filtered = TreeUtils.filterNodes(tree, (node) => (node.value ?? 0) > 2);

      // root (value: 1) filtered out, root2 (value: 6) kept
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe("root2");
    });

    test("preserves children when parent matches", () => {
      const tree = createSampleTree();
      const filtered = TreeUtils.filterNodes(tree, (node) =>
        node.name.includes("root")
      );

      expect(filtered).toHaveLength(2); // root and root2
      expect(filtered[0].children).toBeDefined();
    });

    test("returns empty array when nothing matches", () => {
      const tree = createSampleTree();
      const filtered = TreeUtils.filterNodes(
        tree,
        (node) => node.name === "nonexistent"
      );

      expect(filtered).toEqual([]);
    });
  });

  describe("flattenTree", () => {
    test("flattens nested tree structure", () => {
      const tree = createSampleTree();
      const flattened = TreeUtils.flattenTree(tree);

      expect(flattened).toHaveLength(6);
    });

    test("preserves all nodes", () => {
      const tree = createSampleTree();
      const flattened = TreeUtils.flattenTree(tree);
      const names = flattened.map((n) => n.name);

      expect(names).toEqual([
        "root",
        "child1",
        "grandchild1",
        "grandchild2",
        "child2",
        "root2",
      ]);
    });

    test("handles empty tree", () => {
      const flattened = TreeUtils.flattenTree([]);
      expect(flattened).toEqual([]);
    });

    test("handles single level tree", () => {
      const tree: TestNode[] = [
        { path: "/a", name: "a" },
        { path: "/b", name: "b" },
      ];
      const flattened = TreeUtils.flattenTree(tree);

      expect(flattened).toHaveLength(2);
    });
  });

  describe("getTreeDepth", () => {
    test("returns 0 for empty tree", () => {
      const depth = TreeUtils.getTreeDepth([]);
      expect(depth).toBe(0);
    });

    test("returns 1 for single level tree", () => {
      const tree: TestNode[] = [
        { path: "/a", name: "a" },
        { path: "/b", name: "b" },
      ];
      const depth = TreeUtils.getTreeDepth(tree);

      expect(depth).toBe(1);
    });

    test("returns 3 for three-level tree", () => {
      const tree = createSampleTree();
      const depth = TreeUtils.getTreeDepth(tree);

      expect(depth).toBe(3); // root -> child1 -> grandchild
    });

    test("handles tree with varying depths", () => {
      const tree: TestNode[] = [
        {
          path: "/a",
          name: "a",
          children: [
            {
              path: "/a/b",
              name: "b",
              children: [
                {
                  path: "/a/b/c",
                  name: "c",
                  children: [{ path: "/a/b/c/d", name: "d" }],
                },
              ],
            },
          ],
        },
        { path: "/shallow", name: "shallow" },
      ];

      const depth = TreeUtils.getTreeDepth(tree);
      expect(depth).toBe(4);
    });
  });

  describe("countNodes", () => {
    test("counts all nodes in tree", () => {
      const tree = createSampleTree();
      const count = TreeUtils.countNodes(tree);

      expect(count).toBe(6);
    });

    test("returns 0 for empty tree", () => {
      const count = TreeUtils.countNodes([]);
      expect(count).toBe(0);
    });

    test("counts single level nodes", () => {
      const tree: TestNode[] = [
        { path: "/a", name: "a" },
        { path: "/b", name: "b" },
        { path: "/c", name: "c" },
      ];
      const count = TreeUtils.countNodes(tree);

      expect(count).toBe(3);
    });

    test("counts deeply nested nodes", () => {
      const tree: TestNode[] = [
        {
          path: "/a",
          name: "a",
          children: [
            {
              path: "/a/b",
              name: "b",
              children: [{ path: "/a/b/c", name: "c" }],
            },
          ],
        },
      ];
      const count = TreeUtils.countNodes(tree);

      expect(count).toBe(3);
    });
  });

  describe("edge cases", () => {
    test("handles nodes without children property", () => {
      const tree: TestNode[] = [{ path: "/a", name: "a" }];
      const updated = TreeUtils.updateNode(tree, "/a", (node) => ({
        ...node,
        value: 100,
      }));

      expect(updated[0].value).toBe(100);
    });

    test("handles empty children array", () => {
      const tree: TestNode[] = [{ path: "/a", name: "a", children: [] }];
      const depth = TreeUtils.getTreeDepth(tree);

      expect(depth).toBe(1);
    });

    test("preserves additional node properties", () => {
      const tree: TestNode[] = [
        { path: "/a", name: "a", customProp: "test" } as TestNode & { customProp: string },
      ];
      const mapped = TreeUtils.mapNodes(tree, (node) => ({
        ...node,
        value: 1,
      }));

      expect((mapped[0] as TestNode & { customProp?: string }).customProp).toBe("test");
    });
  });
});
