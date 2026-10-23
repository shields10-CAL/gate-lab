/** Canvas editor interactions shared by the UI and unit tests. */
export const SOURCE_TYPES = new Set(['SWITCH', 'BUTTON', 'BITS4', 'BITS8']);
export const SINK_TYPES = new Set(['LAMP', 'LED', 'DISPLAY4', 'DISPLAY8']);

export function directionOf(type) {
  if (SOURCE_TYPES.has(type)) return 'inputs';
  if (SINK_TYPES.has(type)) return 'outputs';
  return null;
}

/** Both click orders work; the stored wire is ALWAYS output -> input. */
export function connectPins(first, second) {
  if (first.node === second.node && first.pin === second.pin) return { error: 'Click a different pin to complete the wire.' };
  if (first.side === second.side) return { error: 'Connect an output pin to an input pin.' };
  const from = first.side === 'out' ? first : second;
  const to = first.side === 'in' ? first : second;
  if (from.node === to.node) return { error: 'A component cannot wire directly to itself.' };
  return { from: { node: from.node, pin: from.pin }, to: { node: to.node, pin: to.pin } };
}

/** Deduplicate a single outside source fanning out into multiple selected gates. */
export function groupedIncomingPorts(incoming, nodes) {
  const byId = new Map(nodes.map(n => [n.id, n]));
  const result = new Map();
  for (const wire of incoming) {
    const sourceKey = `${wire.from.node}:${wire.from.pin}`;
    const upstream = byId.get(wire.from.node);
    const target = { node: wire.to.node, pin: wire.to.pin };
    if (result.has(sourceKey)) {
      result.get(sourceKey).targets.push(target);
    } else {
      result.set(sourceKey, {
        ...target,
        externalSource: sourceKey,
        targets: [target],
        name: upstream ? (upstream.type.startsWith('BITS') ? `${upstream.label} bit ${Number(wire.from.pin.slice(1))}` : upstream.label) : undefined,
      });
    }
  }
  return [...result.values()];
}

export function duplicateLabel(nodes, type, label, exceptId = null) {
  const direction = directionOf(type);
  const trimmed = String(label ?? '').trim();
  if (!trimmed) return 'Enter a label.';
  if (!direction) return null;
  const clash = nodes.some(n => n.id !== exceptId && directionOf(n.type) === direction && String(n.label || '').trim().toLocaleLowerCase() === trimmed.toLocaleLowerCase());
  return clash ? `Another ${direction === 'inputs' ? 'input' : 'output'} already uses “${trimmed}”. Choose a unique name.` : null;
}

function letters(index) {
  let result = '';
  for (let n = index; n >= 0; n = Math.floor(n / 26) - 1) result = String.fromCharCode(65 + n % 26) + result;
  return result;
}

export function proposedLabel(nodes, type) {
  const direction = directionOf(type);
  if (!direction) return null;
  for (let i = 0; i < 10000; i++) {
    const name = direction === 'inputs' ? letters(i) : `Out ${i + 1}`;
    if (!duplicateLabel(nodes, type, name)) return name;
  }
  return 'Signal';
}

export function uniquePinNames(ports, kind) {
  const seen = new Set();
  for (const p of ports) {
    const name = String(p.name || '').trim();
    if (!name) return `Every ${kind === 'inputs' ? 'input' : 'output'} pin needs a label.`;
    if (seen.has(name.toLocaleLowerCase())) return `Duplicate ${kind === 'inputs' ? 'input' : 'output'} pin: “${name}”.`;
    seen.add(name.toLocaleLowerCase());
  }
  return null;
}

/**
 * A definition's port name and the corresponding source/sink canvas label
 * represent the same thing. Binary sources have several ports on one box:
 * names matching "A bit 0" update the group label A; individual aliases are
 * retained in pinLabels for the component to show beside its own digit.
 */
export function synchronizePinLabels(definition, inputs, outputs) {
  const clonedNodes = definition.doc.nodes.map(node => ({ ...node }));
  const nodes = new Map(clonedNodes.map(node => [node.id, node]));
  const all = [...inputs, ...outputs];
  const originalNames = new Map([...definition.inputs, ...definition.outputs].map(p => [`${p.node}:${p.pin}`, p.name]));
  const changedGroups = new Map();
  for (const p of all) {
    const node = nodes.get(p.node);
    if (!node) continue;
    const bitIndex = /^(?:o|i)(\d+)$/.exec(p.pin)?.[1];
    if (['BITS4', 'BITS8', 'DISPLAY4', 'DISPLAY8'].includes(node.type) && bitIndex !== undefined) {
      const group = new RegExp(`^(.*?)\\s+bit\\s+${bitIndex}$`, 'i').exec(p.name.trim());
      if (group?.[1] && originalNames.get(`${p.node}:${p.pin}`) !== p.name) changedGroups.set(p.node, group[1]);
      node.pinLabels = { ...(node.pinLabels || {}), [p.pin]: p.name };
    } else if (SOURCE_TYPES.has(node.type) || SINK_TYPES.has(node.type)) {
      node.label = p.name;
    }
  }
  for (const [nodeId, groupLabel] of changedGroups) nodes.get(nodeId).label = groupLabel;
  return { ...definition, inputs, outputs, doc: { ...definition.doc, nodes: clonedNodes } };
}

/** Renaming a boundary component inside the IC editor updates exposed pins. */
export function renameDefinitionNode(definition, nodeId, label) {
  const node = definition.doc.nodes.find(n => n.id === nodeId);
  if (!node) return definition;
  const pinName = p => {
    if (p.node !== nodeId) return p;
    if (node.type.startsWith('BITS') || node.type.startsWith('DISPLAY')) {
      const idx = Number(p.pin.slice(1));
      return { ...p, name: `${label} ${p.pin === 'i' + (node.type.endsWith('4') ? 4 : 8) ? 'carry' : `bit ${idx}`}` };
    }
    return { ...p, name: label };
  };
  const inputs = definition.inputs.map(pinName), outputs = definition.outputs.map(pinName);
  return { ...definition, inputs, outputs, doc: { ...definition.doc, nodes: definition.doc.nodes.map(n => n.id === nodeId ? { ...n, label, pinLabels: {} } : n) } };
}
