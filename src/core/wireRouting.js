/**
 * Orthogonal wire routing with optional user-managed bend anchors.
 * Bend anchors are purely geometric; they never change the circuit topology.
 * Each leg between anchors is a horizontal → vertical → horizontal path.
 * This guarantees 90° corners when users drag a waypoint anywhere on the grid.
 */
function validPoint(p) { return p && Number.isFinite(p.x) && Number.isFinite(p.y); }

/** A sequence of points for drawing a single orthogonal leg. */
function leg(start, end) {
  const middleX = (start.x + end.x) / 2;
  return [
    start,
    { x: middleX, y: start.y },
    { x: middleX, y: end.y },
    end,
  ];
}

export function orthogonalPolyline(start, end, points = []) {
  if (!validPoint(start) || !validPoint(end)) return [];
  const anchors = [start, ...points.filter(validPoint), end];
  const polyline = [start];
  for (let i = 0; i < anchors.length - 1; i++) {
    polyline.push(...leg(anchors[i], anchors[i + 1]).slice(1));
  }
  return polyline.filter((point, i) => i === 0 || point.x !== polyline[i - 1].x || point.y !== polyline[i - 1].y);
}

export function orthogonalPath(start, end, points = []) {
  const route = orthogonalPolyline(start, end, points);
  if (!route.length) return '';
  return `M ${route[0].x} ${route[0].y} ` + route.slice(1).map(pt => `L ${pt.x} ${pt.y}`).join(' ');
}

function distanceToSegment(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return Math.hypot(point.x - a.x, point.y - a.y);
  const fraction = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared));
  return Math.hypot(point.x - (a.x + fraction * dx), point.y - (a.y + fraction * dy));
}

/** Find the waypoint insertion slot nearest where the user clicked a wire. */
export function insertBendIndex(start, end, points, clicked) {
  const anchors = [start, ...points, end];
  let slot = 0;
  let best = Infinity;
  for (let i = 0; i < anchors.length - 1; i++) {
    const section = leg(anchors[i], anchors[i + 1]);
    for (let j = 1; j < section.length; j++) {
      const distance = distanceToSegment(clicked, section[j - 1], section[j]);
      if (distance < best) { best = distance; slot = i; }
    }
  }
  return slot;
}
