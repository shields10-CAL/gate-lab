/**
 * Combinational logic engine. Nothing in this file depends on React or DOM geometry.
 * ICs are evaluated recursively and cached ONCE per instance per evaluation pass.
 * Graph lookups use indexes rather than repeatedly scanning all wires.
 *
 * Pin conventions: i0..in = input ports, o0..on = output ports.
 * Internal IC boundaries point at source outputs or sink inputs in a definition.
 */
import { pinDefs } from './model.js';

const topologyCache = new WeakMap();
function topology(doc, defs) {
  // WeakMap is keyed on the immutable document snapshot; callers may reuse it
  // for hundreds of truth-table combinations without rebuilding the indexes.
  const cached = topologyCache.get(doc);
  if (cached?.defs === defs) return cached;
  const nodes = new Map(doc.nodes.map(node => [node.id, node]));
  const incoming = new Map();
  const pins = new Map();
  for (const node of doc.nodes) pins.set(node.id, pinDefs(node, defs));
  for (const wire of doc.wires) {
    if (!nodes.has(wire.from.node) || !nodes.has(wire.to.node)) continue;
    incoming.set(`${wire.to.node}:${wire.to.pin}`, `${wire.from.node}:${wire.from.pin}`);
  }
  const plan = { nodes, incoming, pins, defs };
  topologyCache.set(doc, plan);
  return plan;
}

/** Return the visible on/off state of every pin, including sink inputs. */
export function evaluate(doc, defs, switches = {}, stack = [], externalPins = {}, forcedInputs = {}) {
  const plan = topology(doc, defs);
  const result = {};
  const memo = new Map();
  const evaluating = new Set();
  const instanceResults = new Map();

  function get(nid, key) {
    const k = `${nid}:${key}`;
    if (memo.has(k)) return memo.get(k);
    // A combinational feedback loop is undefined; stop recursion rather than freezing.
    if (evaluating.has(k)) return false;
    const node = plan.nodes.get(nid);
    if (!node) return false;
    evaluating.add(k);
    let value = false;
    const pin = plan.pins.get(nid)?.find(p => p.key === key);

    if (pin?.side === 'in') {
      if (Object.prototype.hasOwnProperty.call(forcedInputs, k)) {
        value = !!forcedInputs[k];
      } else {
        const src = plan.incoming.get(k);
        if (src) {
          const split = src.lastIndexOf(':');
          value = get(src.slice(0, split), src.slice(split + 1));
        }
      }
    } else if (Object.prototype.hasOwnProperty.call(externalPins, k)) {
      // A definition's output-source pin is set by the value supplied to the IC.
      value = !!externalPins[k];
    } else if (node.type === 'SWITCH' || node.type === 'BUTTON') {
      value = !!switches[nid];
    } else if (node.type === 'BITS4' || node.type === 'BITS8') {
      value = !!((node.bits || 0) & (1 << Number(key.slice(1))));
    } else if (node.type === 'HIGH') {
      value = true;
    } else if (node.type === 'IC') {
      const definition = defs[node.icId];
      if (definition && !stack.includes(node.icId)) {
        if (!instanceResults.has(nid)) {
          const values = {};
          definition.inputs.forEach((source, index) => {
            values[`${source.node}:${source.pin}`] = get(nid, `i${index}`);
          });
          instanceResults.set(nid, evaluate(
            definition.doc, defs, {}, [...stack, node.icId], values,
          ).activity);
        }
        const port = definition.outputs[Number(key.slice(1))];
        value = port ? !!instanceResults.get(nid)[port.node]?.[port.pin] : false;
      }
    } else {
      const inputs = (plan.pins.get(nid) || []).filter(p => p.side === 'in')
        .map(p => get(nid, p.key));
      switch (node.type) {
        case 'AND': value = inputs.every(Boolean); break;
        case 'NAND': value = !inputs.every(Boolean); break;
        case 'OR': value = inputs.some(Boolean); break;
        case 'NOR': value = !inputs.some(Boolean); break;
        case 'NOT': value = !inputs[0]; break;
        case 'BUF': value = !!inputs[0]; break;
        default: value = false;
      }
    }
    evaluating.delete(k);
    memo.set(k, value);
    return value;
  }

  for (const node of doc.nodes) {
    result[node.id] = {};
    for (const port of plan.pins.get(node.id) || []) {
      result[node.id][port.key] = get(node.id, port.key);
    }
  }
  return { activity: result, inputs: result };
}

/** A stable signature ignoring position, rotation, region color and labels. */
export function logicSignature(doc) {
  return doc.nodes.map(n => [n.id, n.type, n.icId || '', n.label || '', n.bits || 0, !!n.showCarry].join(':')).join('|')
    + '|' + doc.wires.map(w => `${w.from.node}:${w.from.pin}>${w.to.node}:${w.to.pin}`).join('|');
}

/** Build every row only when the user opens the Truth Table dialog. */
export function makeTruthTable(doc, defs, baseSwitches = {}, selection = null) {
  const picked = selection?.length ? new Set(selection) : null;
  const selectedNodes = doc.nodes.filter(n => !picked || picked.has(n.id));
  const inputNodes = selectedNodes.filter(n => ['SWITCH', 'BITS4', 'BITS8'].includes(n.type));
  const outputNodes = selectedNodes.filter(n => ['LAMP', 'LED', 'DISPLAY4', 'DISPLAY8'].includes(n.type));
  const freeInputs = selectedNodes.filter(n => n.type === 'IC').flatMap(n =>
    pinDefs(n, defs).filter(p => p.side === 'in' &&
      !doc.wires.some(w => w.to.node === n.id && w.to.pin === p.key))
      .map(p => ({ n, p })));
  const freeOutputs = selectedNodes.filter(n => n.type === 'IC').flatMap(n =>
    pinDefs(n, defs).filter(p => p.side === 'out' &&
      !doc.wires.some(w => w.from.node === n.id && w.from.pin === p.key))
      .map(p => ({ n, p })));

  const inputs = [
    ...inputNodes.flatMap(n => n.type.startsWith('BITS')
      ? pinDefs(n, defs).map(p => ({ name: `${n.label || 'Input'} bit ${p.index}`, id: n.id, bit: p.index }))
      : [{ name: n.label || 'Input', id: n.id }]),
    ...freeInputs.map(({ n, p }) => ({ name: p.name || n.label, id: n.id, pin: p.key })),
  ];
  const outputs = [
    ...outputNodes.map(n => ({ name: n.label || 'Output', id: n.id, type: n.type, showCarry: n.showCarry })),
    ...freeOutputs.map(({ n, p }) => ({ name: p.name || n.label, id: n.id, pin: p.key, type: 'IC' })),
  ];

  if (inputs.length > 12) return { error: `${inputs.length} independent inputs would require ${(2 ** inputs.length).toLocaleString()} rows. Select fewer inputs (maximum 12).` };
  if (!inputs.length) return { error: 'Add switches or binary inputs, or select an IC with unconnected input pins.' };
  if (!outputs.length) return { error: 'Add an output indicator, display, or unconnected IC output.' };
  const count = new Map();
  const unique = name => { const clean = name?.trim() || 'Pin'; const i = (count.get(clean) || 0) + 1; count.set(clean, i); return i === 1 ? clean : `${clean} (${i})`; };
  const headers = [...inputs, ...outputs].map(item => unique(item.name));
  const rows = [];
  // Reuse the pre-indexed document, never clone nodes and wires for each row.
  // Simulate binary bit sources through a very small override per input row.
  const truthDoc = {
    nodes: doc.nodes.map(n => n.type.startsWith('BITS') ? { ...n } : n),
    wires: doc.wires,
  };
  for (let index = 0; index < 2 ** inputs.length; index++) {
    const states = { ...baseSwitches };
    const forcedInputs = {};
    const binaryBits = new Map();
    const left = inputs.map((item, i) => {
      const bit = !!(index & (1 << (inputs.length - 1 - i)));
      if (item.pin) forcedInputs[`${item.id}:${item.pin}`] = bit;
      else if (item.bit !== undefined) binaryBits.set(item.id, (binaryBits.get(item.id) || 0) | (Number(bit) << item.bit));
      else states[item.id] = bit;
      return Number(bit);
    });
    // Mutable bit values in a private truth-table working snapshot; no React updates.
    for (const node of truthDoc.nodes) if (binaryBits.has(node.id)) node.bits = binaryBits.get(node.id);
    const activity = evaluate(truthDoc, defs, states, [], {}, forcedInputs).activity;
    const right = outputs.map(o => {
      const sig = activity[o.id] || {};
      if (o.pin) return Number(!!sig[o.pin]);
      if (o.type === 'DISPLAY4' || o.type === 'DISPLAY8') {
        const width = (o.type === 'DISPLAY4' ? 4 : 8) + (o.showCarry ? 1 : 0);
        let value = 0;
        for (let i = 0; i < width; i++) if (sig[`i${i}`]) value |= 1 << i;
        return value;
      }
      return Number(!!sig.i0);
    });
    rows.push([...left, ...right]);
  }
  return { headers, rows, inputs: inputs.length };
}
