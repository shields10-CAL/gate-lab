import React from 'react';
import { GREEN, dims, angle, pinDefs, portLocal, bitLayout } from '../core/model.js';

/** SVG-only drawing. Logic and electrical state are calculated elsewhere. */
function GateShape({ n, defs, activity = {}, selected = false }) {
  let { w, h } = dims(n, defs), t = n.type; return <g transform={`translate(${n.x} ${n.y}) rotate(${angle(n.rotation) * 90})`}>
    {selected && <rect data-selection="1" x={-w / 2 - 10} y={-h / 2 - 10} width={w + 20} height={h + 20} rx="7" fill="none" stroke={GREEN} strokeWidth="2" strokeDasharray="5 4" />}
    {t === 'LABEL' || t === 'REGION' ? <><rect x={-w / 2} y={-h / 2} width={w} height={h} rx={t === 'LABEL' ? 8 : 4} fill={t === 'REGION' ? (n.color || GREEN) : 'transparent'} fillOpacity={t === 'REGION' ? .055 : 0} stroke={n.color || GREEN} strokeWidth="2.5" strokeDasharray="9 7" opacity={t === 'LABEL' && !selected ? 0 : 1} /><text data-label={n.id} textAnchor="middle" y={t === 'LABEL' ? 6 : -h / 2 + 26} className="canvas-label" fontWeight="700" style={{ pointerEvents: 'all', cursor: 'text' }}>{n.label}</text>{t === 'REGION' && selected && !n.locked && <rect data-resize={n.id} x={w / 2 - 13} y={h / 2 - 13} width="14" height="14" fill={n.color || GREEN} stroke="white" strokeWidth="2" style={{ cursor: 'nwse-resize' }} />}</> :
      t === 'IC' ? <><rect x={-w / 2 + 5} y={-h / 2 + 2} width={w - 10} height={h - 4} fill="#fff" stroke="#252b2a" strokeWidth="2.5" rx="3" /><text data-icbody={n.id} textAnchor="middle" dominantBaseline="middle" className="ic-name">{defs[n.icId]?.shortLabel || n.label}</text>{pinDefs(n, defs).map(p => { let q = portLocal(n, p, defs); return <text key={p.key} x={q.x + (p.edge === 'left' ? 13 : p.edge === 'right' ? -13 : 0)} y={q.y + (p.edge === 'top' ? 19 : p.edge === 'bottom' ? -12 : -7)} textAnchor={p.edge === 'top' || p.edge === 'bottom' ? 'middle' : p.side === 'in' ? 'start' : 'end'} className="pin-name">{p.name}</text> })}</> :
        t === 'BITS4' || t === 'BITS8' || t === 'DISPLAY4' || t === 'DISPLAY8' ? (() => {
          const layout = bitLayout(n, defs);
          const { regular, hasCarry, count, cw, positions } = layout;
          const regularLeft = Math.min(...positions.slice(0, regular)) - 5;
          const regularRight = Math.max(...positions.slice(0, regular)) + cw + 2;
          const carryX = hasCarry ? positions[regular] - 5 : 0;
          return <>
            {hasCarry ? <>
              <rect x={regularLeft} y="-44" width={regularRight - regularLeft} height="88" rx="7" fill="#fff" stroke="#29352b" strokeWidth="2.5" />
              <rect x={carryX} y="-44" width={cw + 7} height="88" rx="7" fill="#f1f7ed" stroke={GREEN} strokeWidth="2.5" />
              <text x={carryX + (cw + 7) / 2} y="-61" textAnchor="middle" fontSize="13" fontWeight="700" fill="#375533">CARRY</text>
            </> : <rect x={-w / 2 + 9} y="-44" width={w - 18} height="88" rx="6" fill="#fff" stroke="#29352b" strokeWidth="2" />}
            {Array.from({ length: count }, (_, i) => {
              const active = t.startsWith('BITS') ? !!((n.bits || 0) & (1 << i)) : !!activity['i' + i];
              return <g key={i}>
                <rect data-bit={t.startsWith('BITS') ? i : undefined} x={positions[i]} y="-18" width={cw - 3} height="37" rx="3" fill={active ? GREEN : '#e8eee6'} stroke="#94a58f" style={{ cursor: t.startsWith('BITS') ? 'pointer' : 'default' }} />
                <text x={positions[i] + (cw - 3) / 2} y="6" textAnchor="middle" fontSize="17" fontWeight="700" fill={active ? '#fff' : '#344135'} pointerEvents="none">{active ? '1' : '0'}</text>
                {n.pinLabels?.[(t.startsWith('BITS') ? 'o' : 'i') + i] && n.pinLabels[(t.startsWith('BITS') ? 'o' : 'i') + i] !== `${n.label} bit ${i}` && <text x={positions[i] + (cw - 3) / 2} y="33" textAnchor="middle" fontSize="10" textLength={n.pinLabels[(t.startsWith('BITS') ? 'o' : 'i') + i].length * 6 > cw - 7 ? Math.max(8, cw - 7) : undefined} lengthAdjust="spacingAndGlyphs" fill="#365033" pointerEvents="none">{n.pinLabels[(t.startsWith('BITS') ? 'o' : 'i') + i]}</text>}
              </g>;
            })}
            <text textAnchor="middle" y="-28" fontSize="10">{n.lsbFirst ? 'LSB ← MSB' : 'MSB ← LSB'}</text>
            <text textAnchor="middle" y="66" fontSize="13" fontWeight="700">{t.startsWith('BITS') ? (n.bits || 0) : Array.from({ length: count }, (_, k) => activity['i' + k] ? (1 << k) : 0).reduce((a, b) => a + b, 0)} decimal</text>
          </>;
        })() :
          t === 'LED' ? <>{n.carryOut && <text textAnchor="middle" y="-33" fontSize="14" fontWeight="700" fill={GREEN}>CARRY OUT</text>}<rect x="-21" y="-23" width="42" height="46" rx="4" fill={activity.i0 ? GREEN : '#eef2eb'} stroke="#2d352f" strokeWidth="2" /><text textAnchor="middle" dominantBaseline="middle" fontSize="25" fontWeight="700" fill={activity.i0 ? 'white' : '#333'}>{activity.i0 ? '1' : '0'}</text></> :
            t === 'SWITCH' || t === 'BUTTON' ? <><rect x="-32" y="-24" width="64" height="48" rx="4" fill="#fff" stroke="#272c2b" strokeWidth="2" /><rect x="-24" y="-12" width="48" height="24" rx="12" fill={activity.o0 ? GREEN : '#cbd3d0'} /><circle cx={activity.o0 ? 11 : -11} cy="0" r="10" fill="#fff" stroke="#333" strokeWidth="1.4" /></> :
              t === 'HIGH' || t === 'LOW' ? <><rect x="-25" y="-25" width="50" height="50" fill="white" stroke="#222" strokeWidth="2" /><text textAnchor="middle" dominantBaseline="middle" fontSize="27" fontWeight="700">{t === 'HIGH' ? '1' : '0'}</text></> :
                t === 'LAMP' ? <><text textAnchor="middle" y="-40" fontWeight="700" fontSize="13" fill={activity.i0 ? GREEN : '#68756d'}>{activity.i0 ? 'ON' : 'OFF'}</text><path d="M -15 -10 C -32 -40 32 -40 15 -10 L 9 5 L -9 5 Z" fill={activity.i0 ? '#b7df9d' : '#fff'} stroke="#262c2b" strokeWidth="2.5" /><path d="M -9 5 L 9 5 L 8 17 L -8 17 Z" fill="#4e5555" /><path d="M -8 -10 L 0 0 L 8 -10" stroke="#333" fill="none" strokeWidth="1.7" />{activity.i0 && <circle r="31" fill={GREEN} opacity=".12" />}</> :
                  t === 'NOT' || t === 'BUF' ? <><path d="M -26 -29 L 24 0 L -26 29 Z" fill="#fff" stroke="#262c2b" strokeWidth="2.6" />{t === 'NOT' && <circle cx="31" cy="0" r="6" fill="white" stroke="#262c2b" strokeWidth="2.4" />}</> :
                    t === 'AND' || t === 'NAND' ? <><path d="M -30 -30 L 0 -30 A 30 30 0 0 1 0 30 L -30 30 Z" fill="white" stroke="#262c2b" strokeWidth="2.6" />{t === 'NAND' && <circle cx="32" cy="0" r="6" fill="white" stroke="#262c2b" strokeWidth="2.4" />}</> :
                      <><path d="M -30 -30 Q -12 0 -30 30 Q 24 30 32 0 Q 24 -30 -30 -30 Z" fill="white" stroke="#262c2b" strokeWidth="2.6" />{t === 'NOR' && <circle cx="37" cy="0" r="6" fill="white" stroke="#262c2b" strokeWidth="2.4" />}</>}
    {t !== 'LABEL' && t !== 'REGION' && t !== 'IC' && <text data-label={n.id} x="0" y={h / 2 + 17} className="component-caption" style={{ pointerEvents: 'all', cursor: 'text' }} textAnchor="middle" transform={`rotate(${-angle(n.rotation) * 90} 0 ${h / 2 + 17})`}>{n.label}</text>}
  </g>
}


// Skip SVG redraws for unchanged gates during dragging and panning.
export default React.memo(GateShape);
