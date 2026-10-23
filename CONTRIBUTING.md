# Contributing to GateLab

GateLab welcomes educationally motivated improvements. The project is
open source under the MIT License. See `LICENSE` for the full text.

## Design philosophy

- **Keep the gate palette intentionally limited.** Adding prebuilt XOR, adder,
  or generic arithmetic ICs as primitive components would undermine the
  project's classroom abstraction pathway.
- Prefer deterministic, inspectable combinational behavior over electrical
  realism or timing complexity.
- Keep features usable on common classroom laptops and trackpads.
- Store circuit logic independently of SVG positions and React component state.

## Where changes belong

- `src/core/model.js`: document schema, component ports, terminal coordinates.
- `src/core/simulator.js`: evaluator, nested IC propagation, truth table logic.
- `src/core/wireRouting.js`: pure, 90° path geometry and bend insertion.
- `src/components/GateShape.jsx`: visual appearance and SVG markup.
- `src/components/PinLayout.jsx`: pin-placement preview in IC dialogs.
- `src/utils/exportCanvasPdf.js`: cropped PDF and student information header.
- `src/App.jsx`: mouse/keyboard interactions, persistence, dialogs, UI.
- `tests/*.test.js`: regression tests using only built-in Node test APIs.

## Wire routing data

A wire has stable `from` and `to` electrical endpoints. Optional `points`
contains visual `{x, y}` anchors in canvas/world coordinates, in order.
The simulator **must ignore** these anchors when resolving signals. The
orthogonal mode routes horizontal/vertical legs through them, and the
geometry helper decides where a newly clicked bend should be inserted.
Handle drags create one undo snapshot and update positions without changing
circuit topology. Keep this behavior when modifying the wire editor.

## Signal model

A wire connects one **output pin** (`o0`, `o1`, …) to one **input pin**
(`i0`, `i1`, …). A gate or IC does not care whether the upstream output
comes from a switch, another gate, a multibit input, or an IC carry-out.

IC definitions store an internal document and maps of external input/output
pins to ports inside that document. The simulator supplies values to the
internal source terminals and returns values from the mapped output terminals.
IC recursion and combinational feedback are guarded to prevent infinite loops.

## Performance rules

1. Do not call `makeTruthTable` on ordinary canvas rerenders. It enumerates
   every input combination by design; keep it behind the truth-table dialog.
2. Do not scan all wires inside each gate evaluation. Build lookup indexes
   once (`topology()` in `simulator.js`) and reuse them.
3. Do not evaluate every IC output by separately rerunning its full internal
   subcircuit. Cache the **whole IC evaluation per instance** per pass.
4. Do not re-evaluate Boolean logic when only positions, colors, rotation or
   selection change. `logicSignature()` separates layout changes from logical
   topology. Labels are included to refresh truth-table headings.
5. SVG drawing components should remain presentation-only. Use `React.memo`
   where props can remain stable during dragging.
6. Avoid rendering thousands of truth-table DOM rows simultaneously; previews
   are bounded, CSV exports include all rows.

## Running tests

```bash
npm test
npm run build
```

Add tests for each new gate/port type, especially carry propagation from one
nested custom IC to another, the case that originally caused problems in a
four-bit RCA. Test import/export and pointer events in a real browser before
classroom deployment; pure evaluator tests do not cover those interactions.

## Copyright and contribution expectations

Do not submit third-party icons, images, or source without compatible
permission and attribution. AI-assisted contributions should be checked for
correctness and license compliance, and notable assistance can be disclosed.
