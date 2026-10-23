/** Export a tightly cropped canvas and the student's identifying details.
 * This module is deliberately loaded only when the user chooses PDF export.
 */
import { dims, angle } from '../core/model.js';

export async function exportCanvasPdf({ svg, nodes, wires = [], defs, studentName, section }) {
  if (!nodes.length) throw new Error('Place a circuit on the canvas first.');
  const root = svg?.querySelector('g[transform]');
  if (!root) throw new Error('The circuit canvas is not available.');

  const { jsPDF } = await import('jspdf');
  // Include rotated symbols and long captions in the crop, not just the unrotated
  // component body rectangles. This matters especially for 90° rotated ICs.
  const extents = nodes.map(n => {
    const { w, h } = dims(n, defs);
    const turned = angle(n.rotation) % 2 !== 0;
    const halfWidth = (turned ? h : w) / 2;
    const halfHeight = (turned ? w : h) / 2;
    const captionHalfWidth = Math.min(360, (n.label || '').length * 10);
    return {
      left: n.x - Math.max(halfWidth, turned ? 0 : captionHalfWidth),
      right: n.x + Math.max(halfWidth, turned ? 0 : captionHalfWidth),
      top: n.y - halfHeight - 20,
      bottom: n.y + halfHeight + 30,
    };
  });
  // Manual wire bends can extend past the symbols; include them in the PDF crop.
  for (const wire of wires) for (const point of wire.points || []) {
    extents.push({ left: point.x, right: point.x, top: point.y, bottom: point.y });
  }
  const padding = 58;
  const minX = Math.min(...extents.map(r => r.left)) - padding;
  const minY = Math.min(...extents.map(r => r.top)) - padding;
  const contentWidth = Math.max(240, Math.max(...extents.map(r => r.right)) - Math.min(...extents.map(r => r.left)) + padding * 2);
  const contentHeight = Math.max(160, Math.max(...extents.map(r => r.bottom)) - Math.min(...extents.map(r => r.top)) + padding * 2);
  const exportSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  exportSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  exportSvg.setAttribute('width', String(contentWidth));
  exportSvg.setAttribute('height', String(contentHeight));
  exportSvg.setAttribute('viewBox', `${minX} ${minY} ${contentWidth} ${contentHeight}`);

  // The editor's stylesheets are outside the SVG. Embed just the styles needed
  // for labels so PDF exports look like the onscreen circuit.
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = `svg text{font-family:Arial,sans-serif;user-select:none}
    .canvas-label{font-size:24px;font-weight:700;fill:#243025}
    .component-caption{font-size:18px;font-weight:700;fill:#354639}
    .ic-name{font-size:19px;font-weight:600;fill:#29302a}
    .pin-name{font-size:12px;font-weight:400;fill:#29302a}`;
  exportSvg.append(style);
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  for (const [key, value] of Object.entries({ x: minX, y: minY, width: contentWidth, height: contentHeight, fill: '#ffffff' })) bg.setAttribute(key, String(value));
  exportSvg.append(bg);
  const group = root.cloneNode(true);
  group.removeAttribute('transform');
  group.querySelectorAll('[data-background], [data-selection], [data-wire-handle]').forEach(el => el.remove());
  exportSvg.append(group);
  const blob = new Blob([new XMLSerializer().serializeToString(exportSvg)], { type: 'image/svg+xml;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const img = new Image();
  try {
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('Could not render the SVG circuit'));
      img.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
  // Avoid large (> 8192px) bitmap allocations for unusually large projects.
  const resolution = Math.min(2, 8192 / Math.max(contentWidth, contentHeight));
  const imageCanvas = document.createElement('canvas');
  imageCanvas.width = Math.max(1, Math.ceil(contentWidth * resolution));
  imageCanvas.height = Math.max(1, Math.ceil(contentHeight * resolution));
  const context = imageCanvas.getContext('2d');
  if (!context) throw new Error('Browser canvas is unavailable');
  context.scale(resolution, resolution);
  context.drawImage(img, 0, 0, contentWidth, contentHeight);

  // A dedicated header band keeps student details out of the circuit artwork.
  const width = Math.max(540, contentWidth);
  const headerHeight = 112;
  const height = headerHeight + contentHeight + 16;
  const exportedAt = new Date();
  const timestamp = exportedAt.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  const orientation = width > height ? 'landscape' : 'portrait';
  const pdf = new jsPDF({ orientation, unit: 'pt', format: [width, height], compress: true });
  pdf.setProperties({ title: 'GateLab Circuit', subject: `Exported for ${studentName}`, author: 'GateLab' });
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(48, 66, 49);
  pdf.setFontSize(20);
  pdf.text('GateLab | Circuit Export', 28, 31);
  pdf.setDrawColor(106, 168, 79);
  pdf.setLineWidth(2);
  pdf.line(28, 42, width - 28, 42);
  pdf.setFontSize(12);
  const safeName = studentName.trim() || 'Not provided';
  const safeSection = section.trim() || 'Not provided';
  const clipped = (value, maxWidth) => pdf.splitTextToSize(value, maxWidth)[0];
  pdf.text(`Name: ${clipped(safeName, width - 90)}`, 28, 64);
  pdf.text(`Section / Period: ${clipped(safeSection, width - 120)}`, 28, 82);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(89, 99, 90);
  pdf.setFontSize(10);
  pdf.text(`Exported: ${timestamp}`, 28, 101);
  const offsetX = (width - contentWidth) / 2;
  pdf.addImage(imageCanvas.toDataURL('image/png'), 'PNG', offsetX, headerHeight, contentWidth, contentHeight);
  const filenamePart = safeName.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '').slice(0, 50) || 'circuit';
  pdf.save(`GateLab-${filenamePart}.pdf`);
}
