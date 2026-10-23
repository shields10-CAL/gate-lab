import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluate, makeTruthTable, logicSignature} from '../src/core/simulator.js';

const gate = (id, type, bits = 0) => ({id, type, x: 0, y: 0, bits});
const wire = (from, fp, to, tp) => ({id: `${from}_${fp}_${to}_${tp}`, from: {node: from, pin: fp}, to: {node: to, pin: tp}});

// XOR built exclusively using NAND gates (not an included classroom gate).
function xorDef() {
  return {
    name: 'XOR', shortLabel: 'XOR',
    inputs: [{node: 'a', pin: 'o0', name: 'A'}, {node: 'b', pin: 'o0', name: 'B'}],
    outputs: [{node: 'light', pin: 'i0', name: 'Out'}],
    doc: {
      nodes: [gate('a','SWITCH'),gate('b','SWITCH'),gate('n1','NAND'),gate('n2','NAND'),gate('n3','NAND'),gate('n4','NAND'),gate('light','LED')],
      wires: [wire('a','o0','n1','i0'),wire('b','o0','n1','i1'),
        wire('a','o0','n2','i0'),wire('n1','o0','n2','i1'),
        wire('b','o0','n3','i0'),wire('n1','o0','n3','i1'),
        wire('n2','o0','n4','i0'),wire('n3','o0','n4','i1'),
        wire('n4','o0','light','i0')],
    },
  };
}

// Nested full adder includes two XOR ICs and an AND/OR carry network.
function fullAdderDef() {
  return {
    name: 'Full Adder', shortLabel: 'FA',
    inputs: [
      {node:'a',pin:'o0',name:'A'},
      {node:'b',pin:'o0',name:'B'},
      {node:'cin',pin:'o0',name:'Cin'},
    ],
    outputs: [
      {node:'sum',pin:'i0',name:'Sum'},
      {node:'carry',pin:'i0',name:'Cout'},
    ],
    doc: {
      nodes: [gate('a','SWITCH'),gate('b','SWITCH'),gate('cin','SWITCH'),
        {...gate('x0','IC'),icId:'xor'}, {...gate('x1','IC'),icId:'xor'},
        gate('ab','AND'),gate('cx','AND'),gate('or','OR'),gate('sum','LED'),gate('carry','LED')],
      wires: [
        wire('a','o0','x0','i0'),wire('b','o0','x0','i1'),
        wire('x0','o0','x1','i0'),wire('cin','o0','x1','i1'),
        wire('x1','o0','sum','i0'),
        wire('a','o0','ab','i0'),wire('b','o0','ab','i1'),
        wire('x0','o0','cx','i0'),wire('cin','o0','cx','i1'),
        wire('ab','o0','or','i0'),wire('cx','o0','or','i1'),wire('or','o0','carry','i0'),
      ],
    },
  };
}

function makeFourBitAdder(a = 0, b = 0, carryIn = 0) {
  const nodes = [gate('a','BITS4',a),gate('b','BITS4',b),gate('carryIn','SWITCH'),
    ...Array.from({length:4},(_,i)=>({...gate('fa'+i,'IC'),icId:'fa'})),
    {...gate('out','DISPLAY4'),showCarry:true}, gate('carryOut','LED')];
  const wires = [];
  for(let i=0;i<4;i++) {
    wires.push(wire('a','o'+i,'fa'+i,'i0'));
    wires.push(wire('b','o'+i,'fa'+i,'i1'));
    wires.push(wire(i?'fa'+(i-1):'carryIn',i?'o1':'o0','fa'+i,'i2'));
    wires.push(wire('fa'+i,'o0','out','i'+i));
  }
  wires.push(wire('fa3','o1','out','i4'),wire('fa3','o1','carryOut','i0'));
  return {nodes,wires};
}

const defs = {xor: xorDef(), fa: fullAdderDef()};
const decimal = sig => Array.from({length:5},(_,i)=>sig['i'+i] ? 1<<i : 0).reduce((a,b)=>a+b,0);

test('XOR assembled from NAND components has the correct truth table', () => {
  const doc = {nodes: [gate('a','SWITCH'),gate('b','SWITCH'),{...gate('x','IC'),icId:'xor'},gate('light','LED')],
    wires: [wire('a','o0','x','i0'),wire('b','o0','x','i1'),wire('x','o0','light','i0')]};
  for(const a of [0,1]) for(const b of [0,1]) {
    assert.equal(Number(evaluate(doc,defs,{a,b}).activity.light.i0),a^b);
  }
});

test('Nested IC carry signals are accepted as real upstream inputs', () => {
  for(const [a,b,cin] of [[0,0,0],[15,1,0],[7,8,1],[15,15,1],[5,10,0]]) {
    const actual = evaluate(makeFourBitAdder(a,b,cin),defs,{carryIn:!!cin}).activity;
    assert.equal(decimal(actual.out), a+b+cin,`${a} + ${b} + ${cin}`);
    assert.equal(Number(actual.carryOut.i0), (a+b+cin)>>4);
  }
});

test('Truth table enumerates each binary input bit, and outputs correct decimal values', () => {
  const doc=makeFourBitAdder(0,0,0);
  const before=JSON.stringify(doc);
  const table=makeTruthTable(doc,defs,{});
  assert.equal(table.error,undefined);
  assert.equal(table.inputs,9);
  assert.equal(table.rows.length,512);
  // input order A bits 0..3, B bits 0..3, then CarryIn
  assert.equal(table.rows[0].at(-2),0);
  assert.equal(table.rows.at(-1).at(-2),31);
  assert.equal(JSON.stringify(doc),before,'truth table must not alter saved project');
});

test('Changing only canvas geometry does not invalidate the logic signature', () => {
  const original=makeFourBitAdder(15,1,0);
  const moved={...original,nodes:original.nodes.map(n=>({...n,x:n.x+80,y:n.y-40,rotation:1}))};
  assert.equal(logicSignature(original),logicSignature(moved));
});
