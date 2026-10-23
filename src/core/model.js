/** Shared circuit geometry, pin conventions, and document schema. */
export const GREEN = '#6aa84f', DRAWER = 242;
export const typeLabel = { SWITCH: 'Toggle Switch', BUF: 'Buffer Gate', LAMP: 'Light Bulb', AND: 'AND Gate', NAND: 'NAND Gate', OR: 'OR Gate', NOR: 'NOR Gate', NOT: 'NOT Gate', LABEL: 'Text Label', REGION: 'Circuit Region', BITS4: '4-bit Input', BITS8: '8-bit Input', LED: '0 / 1 Output', DISPLAY4: '4-bit Display', DISPLAY8: '8-bit Display' };
export const initialDoc = () => ({ nodes: [], wires: [] });
export const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const clone = x => structuredClone(x);
export const defaultName = t => t === 'LABEL' ? 'Text' : typeLabel[t] || t;
export const createNode = (type, x, y, icId) => ({ id: uid(), type, x, y, rotation: 0, label: defaultName(type), bits: 0, lsbFirst: false, showCarry: type === 'DISPLAY4' || type === 'DISPLAY8', carryOut: false, w: type === 'REGION' ? 260 : undefined, h: type === 'REGION' ? 160 : undefined, locked: false, color: '#6aa84f', ...(icId ? { icId } : {}) });
export const angle = r => ((r % 4) + 4) % 4;
export function pinDefs(n, defs) { let t = n.type; if (t === 'LABEL' || t === 'REGION') return []; if (t === 'BITS4' || t === 'BITS8') return Array.from({ length: t === 'BITS4' ? 4 : 8 }, (_, i) => ({ key: 'o' + i, side: 'out', name: String(i), index: i })); if (t === 'DISPLAY4' || t === 'DISPLAY8') return Array.from({ length: (t === 'DISPLAY4' ? 4 : 8) + (n.showCarry ? 1 : 0) }, (_, i) => ({ key: 'i' + i, side: 'in', name: i === (t === 'DISPLAY4' ? 4 : 8) ? 'Carry' : String(i), index: i })); if (t === 'IC') { let d = defs[n.icId]; return d ? [...d.inputs.map((p, i) => ({ key: `i${i}`, side: 'in', name: p.name, index: i, edge: p.edge, fraction: p.fraction })), ...d.outputs.map((p, i) => ({ key: `o${i}`, side: 'out', name: p.name, index: i, edge: p.edge, fraction: p.fraction }))] : []; } if (t === 'LAMP' || t === 'LED') return [{ key: 'i0', side: 'in', name: 'In', index: 0 }]; if (t === 'SWITCH') return [{ key: 'o0', side: 'out', name: 'Out', index: 0 }]; let inputs = t === 'NOT' || t === 'BUF' ? 1 : 2; return [...Array.from({ length: inputs }, (_, i) => ({ key: `i${i}`, side: 'in', name: String.fromCharCode(65 + i), index: i })), { key: 'o0', side: 'out', name: 'Out', index: 0 }]; }
export function dims(n, defs) { if (n.type === 'LABEL') return { w: Math.max(140, (n.label || 'Text').length * 16 + 40), h: 62 }; if (n.type === 'REGION') return { w: n.w || 260, h: n.h || 160 }; if (['BITS4', 'DISPLAY4'].includes(n.type)) return { w: 170 + (n.type === 'DISPLAY4' && n.showCarry ? 64 : 0), h: 146 }; if (['BITS8', 'DISPLAY8'].includes(n.type)) return { w: 260 + (n.type === 'DISPLAY8' && n.showCarry ? 64 : 0), h: 146 }; if (n.type === 'IC') { let d = defs[n.icId]; return { w: 160, h: Math.max(110, 30 * (Math.max(d?.inputs.length || 0, d?.outputs.length || 0) + 1)) }; } return { w: 92, h: 76 }; }
/** Positioning shared by digits, their electrical connectors, and the optional carry group. */
export function bitLayout(n, defs) {
  const regular = n.type.endsWith('4') ? 4 : 8;
  const hasCarry = n.type.startsWith('DISPLAY') && !!n.showCarry;
  const count = regular + (hasCarry ? 1 : 0);
  const { w } = dims(n, defs);
  const gap = hasCarry ? 16 : 0;
  const cw = (w - 28 - gap) / count;
  const positions = Array.from({ length: count }, (_, i) => {
    const visual = n.lsbFirst ? i : count - 1 - i;
    const gapBefore = hasCarry && visual > (n.lsbFirst ? regular - 1 : 0) ? gap : 0;
    return -w / 2 + 14 + visual * cw + gapBefore;
  });
  return { regular, hasCarry, count, cw, gap, positions };
}
export function portLocal(n, p, defs) {
  const { w, h } = dims(n, defs);
  const pins = pinDefs(n, defs).filter(q => q.side === p.side);
  const index = pins.findIndex(q => q.key === p.key);
  const count = pins.length;
  if (n.type === 'IC' && p.edge) {
    const v = Math.max(.08, Math.min(.92, p.fraction ?? .5));
    return p.edge === 'top' ? { x: (v - .5) * w, y: -h / 2 }
      : p.edge === 'bottom' ? { x: (v - .5) * w, y: h / 2 }
      : p.edge === 'right' ? { x: w / 2, y: (v - .5) * h }
      : { x: -w / 2, y: (v - .5) * h };
  }
  if (['BITS4', 'BITS8', 'DISPLAY4', 'DISPLAY8'].includes(n.type)) {
    const layout = bitLayout(n, defs);
    return { x: layout.positions[p.index] + (layout.cw - 3) / 2, y: p.side === 'out' ? 44 : -44 };
  }
  return { x: p.side === 'in' ? -w / 2 : w / 2, y: (index + 1) * h / (count + 1) - h / 2 };
}
export function transform(nx, ny, r) { let a = angle(r); return a === 0 ? { x: nx, y: ny } : a === 1 ? { x: -ny, y: nx } : a === 2 ? { x: -nx, y: -ny } : { x: ny, y: -nx }; }
export function portPos(n, p, defs) { let q = portLocal(n, p, defs), r = transform(q.x, q.y, n.rotation); return { x: n.x + r.x, y: n.y + r.y }; }
export function getPort(node, key, defs) { return pinDefs(node, defs).find(p => p.key === key); }
export function bounds(nodes, defs) { if (!nodes.length) return { x: 0, y: 0, w: 0, h: 0 }; let a = nodes.map(n => { let { w, h } = dims(n, defs); return { x: n.x - w / 2, y: n.y - h / 2, w, h } }); let minx = Math.min(...a.map(v => v.x)), miny = Math.min(...a.map(v => v.y)); return { x: minx, y: miny, w: Math.max(...a.map(v => v.x + v.w)) - minx, h: Math.max(...a.map(v => v.y + v.h)) - miny }; }

