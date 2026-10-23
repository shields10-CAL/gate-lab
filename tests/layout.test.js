import test from 'node:test';
import assert from 'node:assert/strict';
import { createNode, pinDefs, portLocal, bitLayout } from '../src/core/model.js';

const noDefs = {};

test('New 4-bit and 8-bit displays show a carry input by default', () => {
  for (const [type, length] of [['DISPLAY4', 5], ['DISPLAY8', 9]]) {
    const node = createNode(type, 0, 0);
    assert.equal(node.showCarry, true);
    assert.equal(pinDefs(node, noDefs).length, length);
    assert.equal(pinDefs(node, noDefs)[length - 1].name, 'Carry');
    node.showCarry = false;
    assert.equal(pinDefs(node, noDefs).length, length - 1);
  }
});

test('Carry cell is physically separated; port positions match cell centers', () => {
  for (const type of ['DISPLAY4', 'DISPLAY8']) {
    const node = createNode(type, 0, 0);
    for (const lsbFirst of [false, true]) {
      node.lsbFirst = lsbFirst;
      const layout = bitLayout(node, noDefs);
      for (const p of pinDefs(node, noDefs)) {
        assert.equal(portLocal(node, p, noDefs).x, layout.positions[p.index] + (layout.cw - 3) / 2);
      }
      const regular = layout.positions.slice(0, layout.regular);
      const carry = layout.positions[layout.regular];
      if (lsbFirst) assert.ok(carry - Math.max(...regular) >= layout.cw + layout.gap - .001);
      else assert.ok(Math.min(...regular) - carry >= layout.cw + layout.gap - .001);
    }
  }
});

test('Carry-out designation does not change 0/1 output sink pin', () => {
  const node = createNode('LED', 0, 0);
  const basic = pinDefs(node, noDefs);
  node.carryOut = true;
  assert.deepEqual(pinDefs(node, noDefs), basic);
  assert.equal(basic[0].side, 'in');
  assert.equal(basic[0].key, 'i0');
});
