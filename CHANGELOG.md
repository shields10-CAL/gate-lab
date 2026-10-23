# Changelog

## 1.0.0 — First official GateLab release (2026-10-23)

- Establishes the existing GateLab v1.9 Docker-ready source as the baseline GateLab 1.0.0 release.
- Adds GitHub Actions publishing to GitHub Container Registry and the image-based Portainer stack.
- Preserves simulator logic and browser-saved project format.


## 1.9.0 — Classroom wiring and IC label clarity

- Start a wire from either an input or output pin; connection direction is normalized internally.
- Prompt for a unique label when placing toggle switches, 4/8-bit sources, lamps, 0/1 indicators and binary displays. Default input names progress A, B, C, and output names Out 1, Out 2, etc.
- Block duplicate signal labels separately for inputs and outputs, including renaming and pasted nodes.
- Initialize IC boundary pin labels from labeled components or external connected sources/sinks; keep IC pin edits and editor source/sink captions synchronized.
- Add an Animated wires / Solid wires toolbar toggle without changing logic values.
- Update the integrated-circuit symbol preview as the symbol label is typed.
- Add regression tests for reverse-direction wiring, label uniqueness and IC label synchronization.
- Preserve the existing browser autosave and JSON document format.


## 1.8.0 — Wire routing, usability, and project naming

- Restored the original, smaller 19px IC symbol title and 12px pin labels.
  Other component captions remain enlarged and bold.
- Animated the left component drawer, its collapse arrow, and canvas resizing.
- Added a project-name dialog to JSON export; name is included in the file
  metadata and filename and restored on import.
- Replaced the main header subtitle with the existing autosave status indicator.
- Added a one-input, non-inverting **Buffer** gate to the basic gate palette.
- Added manually draggable bend points for 90° wires. Click an orthogonal
  wire to create a bend, drag the handle to position it, and double-click the
  handle to remove it. The points are stored in JSON and included in PDF crop.
- Changed the File toolbar button to **Project**, with a gear icon.
- Added Ctrl+A / Cmd+A to select every component on the active canvas.
- Added unit tests for buffer behavior and orthogonal routing.

## v1.7.1 — Startup hotfix

- Corrected `CircularProgress` import: now imported from `@mui/material`, not `@mui/icons-material`. Fixes blank screen on initial load.


## 1.7.0 — Classroom usability and PDF identification

- Replaced app header artwork with the full GateLab wordmark.
- Prevented horizontal palette overflow and added a sidebar collapse tab.
- Increased canvas annotation/circuit label weights and sizes.
- Added LED carry-out designation and default carry bits for new displays.
- Separated carry display visually from the 4- or 8-bit data group.
- Added student name, class period, and export timestamp to PDF exports.
- Disabled accidental native SVG text selection during marquee dragging.
- Updated the IC editor properties card and added actual autosave feedback.
- Switched licensing to MIT; intentionally shortened README to a placeholder.

## 1.6.0 — Performance, maintainability, branding

- Added the supplied GateLab logo to the app toolbar and favicon/touch icons.
- Separated geometry/model, pure simulator, SVG drawing, and IC preview modules.
- Indexed incoming wires and cached a nested IC's evaluation per instance.
- Stop calculating the truth table during normal canvas rendering.
- Stop running Boolean logic for position-only changes and reduce pointer
  rendering while not connecting a wire.
- Cap rendered truth-table previews to 128 rows (CSV remains complete).
- Added automated nested RCA tests and repository documentation.
- Added PolyForm Noncommercial 1.0.0 licensing information.

## 1.5.0

- Binary source recognition, movable toggle switches, carry bit on displays,
  and GateLab naming.
