import test from 'node:test';
import assert from 'node:assert/strict';
import { connectPins, groupedIncomingPorts, duplicateLabel, proposedLabel, uniquePinNames, synchronizePinLabels, renameDefinitionNode } from '../src/core/editorInteractions.js';

test('wires begun at an AND input are stored output-to-input', () => {
  const gate = { node: 'and', pin: 'i0', side: 'in' };
  const toggle = { node: 'toggle', pin: 'o0', side: 'out' };
  const expected = { from: { node: 'toggle', pin: 'o0' }, to: { node: 'and', pin: 'i0' } };
  assert.deepEqual(connectPins(gate, toggle), expected);
  assert.deepEqual(connectPins(toggle, gate), expected);
  assert.match(connectPins(gate, { node: 'other', pin: 'i1', side: 'in' }).error, /output/);
  assert.match(connectPins(gate, gate).error, /different/);
});

test('unique labels are selected separately for inputs and outputs', () => {
  const nodes = [{ id: 'a', type: 'SWITCH', label: 'A' }, { id: 'b', type: 'BITS4', label: 'B' }, { id: 'c', type: 'LED', label: 'Out 1' }];
  assert.equal(proposedLabel(nodes, 'SWITCH'), 'C');
  assert.equal(proposedLabel(nodes, 'DISPLAY4'), 'Out 2');
  assert.match(duplicateLabel(nodes, 'BITS8', ' a '), /already uses/);
  assert.equal(duplicateLabel(nodes, 'BITS8', 'Out 1'), null);
  assert.equal(duplicateLabel(nodes, 'SWITCH', 'A', 'a'), null);
});

test('IC pin names cannot duplicate within either direction', () => {
  assert.match(uniquePinNames([{ name: 'Sum' }, { name: 'sum' }], 'outputs'), /Duplicate/);
  assert.equal(uniquePinNames([{ name: 'A' }, { name: 'B' }], 'inputs'), null);
});

test('renaming an IC pin changes the matching canvas source/sink label', () => {
  const definition = { inputs: [{ node: 'sw', pin: 'o0', name: 'A' }], outputs: [{ node: 'led', pin: 'i0', name: 'Out 1' }], doc: { nodes: [{ id: 'sw', type: 'SWITCH', label: 'A' }, { id: 'led', type: 'LED', label: 'Out 1' }], wires: [] } };
  const result = synchronizePinLabels(definition, [{ ...definition.inputs[0], name: 'Input X' }], [{ ...definition.outputs[0], name: 'SUM' }]);
  assert.equal(result.doc.nodes[0].label, 'Input X');
  assert.equal(result.doc.nodes[1].label, 'SUM');
  const renamed = renameDefinitionNode(result, 'sw', 'Z');
  assert.equal(renamed.inputs[0].name, 'Z');
});

test('binary pin rename retains per-bit labels and updates group when recognizable', () => {
  const d = { inputs: [{ node: 'bits', pin: 'o0', name: 'A bit 0' }, { node: 'bits', pin: 'o1', name: 'A bit 1' }], outputs: [], doc: { nodes: [{ id: 'bits', type: 'BITS4', label: 'A' }], wires: [] } };
  const result = synchronizePinLabels(d, [{ ...d.inputs[0], name: 'B bit 0' }, d.inputs[1]], []);
  assert.equal(result.doc.nodes[0].label, 'B');
  assert.equal(result.doc.nodes[0].pinLabels.o0, 'B bit 0');
});

test('an external switch feeding two gates creates one IC input with two targets', () => {
  const wires = [
    { from: { node: 'switch', pin: 'o0' }, to: { node: 'and', pin: 'i0' } },
    { from: { node: 'switch', pin: 'o0' }, to: { node: 'not', pin: 'i0' } },
  ];
  const ports = groupedIncomingPorts(wires, [{ id: 'switch', type: 'SWITCH', label: 'A' }]);
  assert.equal(ports.length, 1);
  assert.equal(ports[0].name, 'A');
  assert.deepEqual(ports[0].targets, [{ node: 'and', pin: 'i0' }, { node: 'not', pin: 'i0' }]);
});
