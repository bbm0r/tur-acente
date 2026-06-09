// Pure, immutable operations on a nested block tree (Block[] with optional children slots).
// All operate by globally-unique block id, recursing into every slot. Used by the page builder.
import type { Block } from "./blocks";

function mapChildren(children: Record<string, Block[]>, fn: (arr: Block[]) => Block[]): Record<string, Block[]> {
  const out: Record<string, Block[]> = {};
  for (const k of Object.keys(children)) out[k] = fn(children[k]);
  return out;
}

export function findBlock(list: Block[], id: string): Block | null {
  for (const b of list) {
    if (b.id === id) return b;
    if (b.children) {
      for (const k of Object.keys(b.children)) {
        const found = findBlock(b.children[k], id);
        if (found) return found;
      }
    }
  }
  return null;
}

/** Apply `fn` to the single block matching `id`, anywhere in the tree. */
function updateBlock(list: Block[], id: string, fn: (b: Block) => Block): Block[] {
  return list.map((b) => {
    if (b.id === id) return fn(b);
    if (b.children) return { ...b, children: mapChildren(b.children, (arr) => updateBlock(arr, id, fn)) };
    return b;
  });
}

export function setProp(list: Block[], id: string, key: string, value: unknown): Block[] {
  return updateBlock(list, id, (b) => ({ ...b, props: { ...b.props, [key]: value } }));
}

export function setStyle(list: Block[], id: string, key: string, value: unknown): Block[] {
  return updateBlock(list, id, (b) => ({
    ...b,
    props: { ...b.props, _style: { ...((b.props._style as Record<string, unknown>) ?? {}), [key]: value } },
  }));
}

export function removeBlock(list: Block[], id: string): Block[] {
  return list
    .filter((b) => b.id !== id)
    .map((b) => (b.children ? { ...b, children: mapChildren(b.children, (arr) => removeBlock(arr, id)) } : b));
}

/** Append a block to the top level (parentId null) or to a container's slot. */
export function appendBlock(list: Block[], parentId: string | null, slot: string | null, block: Block): Block[] {
  if (!parentId || !slot) return [...list, block];
  return updateBlock(list, parentId, (b) => {
    const children = { ...(b.children ?? {}) };
    children[slot] = [...(children[slot] ?? []), block];
    return { ...b, children };
  });
}

/** Insert `block` immediately after the sibling identified by `afterId`, at whatever depth it lives. */
export function insertAfter(list: Block[], afterId: string, block: Block): Block[] {
  const i = list.findIndex((b) => b.id === afterId);
  if (i !== -1) {
    const copy = list.slice();
    copy.splice(i + 1, 0, block);
    return copy;
  }
  return list.map((b) => (b.children ? { ...b, children: mapChildren(b.children, (arr) => insertAfter(arr, afterId, block)) } : b));
}

/** Swap a block with its previous/next sibling within its own slot. */
export function moveBlock(list: Block[], id: string, dir: -1 | 1): Block[] {
  const i = list.findIndex((b) => b.id === id);
  if (i !== -1) {
    const j = i + dir;
    if (j < 0 || j >= list.length) return list;
    const copy = list.slice();
    [copy[i], copy[j]] = [copy[j], copy[i]];
    return copy;
  }
  return list.map((b) => (b.children ? { ...b, children: mapChildren(b.children, (arr) => moveBlock(arr, id, dir)) } : b));
}

/** Deep-clone a block subtree, assigning fresh ids throughout (so it can be re-inserted). */
export function cloneWithNewIds(b: Block, uid: () => string): Block {
  const clone: Block = { id: uid(), type: b.type, props: { ...b.props } };
  if (b.children) {
    clone.children = {};
    for (const k of Object.keys(b.children)) clone.children[k] = b.children[k].map((c) => cloneWithNewIds(c, uid));
  }
  return clone;
}
