import test from 'node:test';
import assert from 'node:assert/strict';
import { createNode, pinDefs } from '../src/core/model.js';
import { evaluate } from '../src/core/simulator.js';
import { orthogonalPolyline, orthogonalPath, insertBendIndex } from '../src/core/wireRouting.js';

test('buffer gate is a 1-in/1-out non-inverting logic gate', () => {
  const buffer = createNode('BUF', 120, 0);
  const input = createNode('SWITCH', 0, 0);
  const document = { nodes: [input, buffer], wires: [{ id: 'w', from: { node: input.id, pin: 'o0' }, to: { node: buffer.id, pin: 'i0' } }] };
  assert.deepEqual(pinDefs(buffer, {}).map(p => p.key), ['i0', 'o0']);
  assert.equal(evaluate(document, {}, { [input.id]: false }).activity[buffer.id].o0, false);
  assert.equal(evaluate(document, {}, { [input.id]: true }).activity[buffer.id].o0, true);
});

test('custom orthogonal wire routing never creates diagonal segments', () => {
  const points = orthogonalPolyline({ x: 0, y: 0 }, { x: 200, y: 130 }, [{ x: 80, y: 200 }, { x: 160, y: -20 }]);
  assert(points.length > 3);
  for (let i = 1; i < points.length; i++) {
    assert(points[i].x === points[i - 1].x || points[i].y === points[i - 1].y, `Unexpected diagonal at ${i}`);
  }
  assert.match(orthogonalPath({ x: 0, y: 0 }, { x: 200, y: 130 }, [{ x: 80, y: 200 }]), /^M 0 0 /);
});

test('a clicked location inserts its bend on the nearest segment', () => {
  assert.equal(insertBendIndex({ x: 0, y: 0 }, { x: 300, y: 200 }, [], { x: 150, y: 100 }), 0);
  assert.equal(insertBendIndex({ x: 0, y: 0 }, { x: 300, y: 0 }, [{ x: 40, y: 90 }], { x: 270, y: 0 }), 1);
});
