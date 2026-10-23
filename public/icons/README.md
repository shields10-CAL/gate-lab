# Optional custom gate icons

The current palette and canvas use built-in SVG markup in
`src/components/GateShape.jsx`. To replace artwork, add your SVG asset to this
folder and change the matching branch in `GateShape.jsx` to render an SVG
`<image>` or corresponding path elements. Keep the pin definitions and
coordinates in `src/core/model.js` aligned with the new icon. The gate
simulation itself is independent of its artwork.

Only use icons for which you have permission to distribute under the
repository's license or with appropriate separate asset licensing.
