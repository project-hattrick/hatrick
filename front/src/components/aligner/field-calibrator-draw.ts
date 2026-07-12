/** Canvas rendering for the field calibrator — pure draw pass, kept out of the component (size cap). */

import {
  CANVAS_H,
  CANVAS_W,
  COMMENT_COLOR,
  CORNER_HANDLES,
  GOAL_COLOR,
  GOAL_HANDLES,
  lineHandles,
  pointFor,
  type CenterPt,
  type CommentPin,
  type Corners,
  type Fit,
  type GoalFrame,
  type GoalSide,
  type Mode,
  type PlayLines,
  type Pt,
  type View,
} from './field-calibrator-data';

export interface DrawArgs {
  img: HTMLImageElement;
  fit: Fit;
  view: View;
  corners: Corners;
  goals: Record<GoalSide, GoalFrame>;
  strokes: Pt[][];
  mode: Mode;
  activeGoal: GoalSide;
  playLines: PlayLines;
  center: CenterPt;
  comments: CommentPin[];
  selectedComment: number | null;
}

/** Repaints the whole scene: court image, trapezoid, goal frames, out-lines, pins, handles. */
export function drawScene(ctx: CanvasRenderingContext2D, a: DrawArgs): void {
  const { fit: f, view, corners, goals, mode, activeGoal, playLines, center, comments } = a;
  const z = view.zoom;
  const sw = (v: number) => v / z; // constant SCREEN size for handles/lines regardless of zoom
  const toCanvas = (r: Pt): Pt => ({ x: f.x + r.x * f.w, y: f.y + r.y * f.h });

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#0b1020';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.setTransform(z, 0, 0, z, view.x, view.y);
  ctx.drawImage(a.img, f.x, f.y, f.w, f.h);

  // Trapezoid fill + outline.
  const cp = (k: keyof Corners) => toCanvas(corners[k]);
  const tl = cp('tl');
  const tr = cp('tr');
  const br = cp('br');
  const bl = cp('bl');
  ctx.beginPath();
  ctx.moveTo(tl.x, tl.y);
  ctx.lineTo(tr.x, tr.y);
  ctx.lineTo(br.x, br.y);
  ctx.lineTo(bl.x, bl.y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(56,189,248,0.12)';
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = sw(2);
  ctx.stroke();

  // Goal frames: mouth line + two posts + crossbar, with draggable corner handles.
  (['blue', 'red'] as GoalSide[]).forEach((side) => {
    const fr = goals[side];
    const isActive = mode === 'goal' && side === activeGoal;
    const color = GOAL_COLOR[side];
    const nb = toCanvas(fr.nearBase);
    const fb = toCanvas(fr.farBase);
    const nt = toCanvas(fr.nearTop);
    const ft = toCanvas(fr.farTop);

    // Net fill (translucent) so the frame reads as a goal.
    ctx.beginPath();
    ctx.moveTo(nb.x, nb.y);
    ctx.lineTo(nt.x, nt.y);
    ctx.lineTo(ft.x, ft.y);
    ctx.lineTo(fb.x, fb.y);
    ctx.closePath();
    ctx.fillStyle = isActive ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.07)';
    ctx.fill();

    // Mouth (goal line) dashed; posts + crossbar solid.
    ctx.strokeStyle = color;
    ctx.lineJoin = 'round';
    ctx.lineWidth = sw(isActive ? 2 : 1.5);
    ctx.setLineDash([sw(6), sw(5)]);
    ctx.beginPath();
    ctx.moveTo(nb.x, nb.y);
    ctx.lineTo(fb.x, fb.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = sw(isActive ? 4 : 3);
    ctx.beginPath();
    ctx.moveTo(nb.x, nb.y);
    ctx.lineTo(nt.x, nt.y); // near post
    ctx.moveTo(fb.x, fb.y);
    ctx.lineTo(ft.x, ft.y); // far post
    ctx.moveTo(nt.x, nt.y);
    ctx.lineTo(ft.x, ft.y); // crossbar
    ctx.stroke();

    GOAL_HANDLES.forEach((key) => {
      const c = toCanvas(fr[key]);
      const isTop = key === 'nearTop' || key === 'farTop';
      ctx.beginPath();
      ctx.arc(c.x, c.y, sw(isActive ? 7 : 5), 0, Math.PI * 2);
      ctx.fillStyle = isTop ? '#ffffff' : color;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = sw(2);
      ctx.stroke();
    });
  });

  // Freehand pen strokes.
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = sw(2.5);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const s of a.strokes) {
    if (s.length < 2) continue;
    ctx.beginPath();
    s.forEach((pt, i) => {
      const c = toCanvas(pt);
      if (i === 0) ctx.moveTo(c.x, c.y);
      else ctx.lineTo(c.x, c.y);
    });
    ctx.stroke();
  }

  // Out-of-play lines quad (yellow) + center spot — always visible, handles lit in Lines mode.
  const quad = [
    pointFor(corners, playLines.latLeft, playLines.depthTop),
    pointFor(corners, playLines.latRight, playLines.depthTop),
    pointFor(corners, playLines.latRight, playLines.depthBottom),
    pointFor(corners, playLines.latLeft, playLines.depthBottom),
  ].map(toCanvas);
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = sw(mode === 'lines' ? 3 : 2);
  ctx.beginPath();
  quad.forEach((q, i) => (i === 0 ? ctx.moveTo(q.x, q.y) : ctx.lineTo(q.x, q.y)));
  ctx.closePath();
  ctx.stroke();
  const cc = toCanvas(pointFor(corners, center.lat, center.depth));
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = sw(2);
  ctx.beginPath();
  ctx.arc(cc.x, cc.y, sw(9), 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cc.x - sw(14), cc.y);
  ctx.lineTo(cc.x + sw(14), cc.y);
  ctx.moveTo(cc.x, cc.y - sw(14));
  ctx.lineTo(cc.x, cc.y + sw(14));
  ctx.stroke();
  ctx.globalAlpha = mode === 'lines' ? 1 : 0.35;
  for (const h of lineHandles(corners, playLines, center)) {
    const c = toCanvas(h.pt);
    ctx.beginPath();
    ctx.arc(c.x, c.y, sw(7), 0, Math.PI * 2);
    ctx.fillStyle = h.edge === 'center' ? '#ffffff' : '#fde047';
    ctx.fill();
    ctx.strokeStyle = '#0b1020';
    ctx.lineWidth = sw(2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Comment pins: numbered markers; the selected one shows its note in a bubble.
  comments.forEach((cm, i) => {
    const c = toCanvas(cm);
    const selected = cm.id === a.selectedComment;
    ctx.beginPath();
    ctx.arc(c.x, c.y, sw(selected ? 11 : 9), 0, Math.PI * 2);
    ctx.fillStyle = COMMENT_COLOR;
    ctx.fill();
    ctx.strokeStyle = selected ? '#ffffff' : '#0b1020';
    ctx.lineWidth = sw(2);
    ctx.stroke();
    ctx.fillStyle = '#0b1020';
    ctx.font = `700 ${sw(11)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), c.x, c.y + sw(0.5));
    if (selected && cm.text) {
      const label = cm.text.length > 46 ? `${cm.text.slice(0, 45)}…` : cm.text;
      ctx.font = `500 ${sw(12)}px system-ui, sans-serif`;
      const w = ctx.measureText(label).width + sw(16);
      const h = sw(24);
      const bx = c.x + sw(14);
      const by = c.y - h / 2;
      ctx.fillStyle = 'rgba(15,23,42,0.92)';
      ctx.strokeStyle = COMMENT_COLOR;
      ctx.lineWidth = sw(1.5);
      ctx.beginPath();
      ctx.roundRect(bx, by, w, h, sw(6));
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'left';
      ctx.fillText(label, bx + sw(8), c.y + sw(0.5));
    }
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  });

  // Corner handles (only meaningful in handles mode; dimmed otherwise).
  ctx.globalAlpha = mode === 'handles' ? 1 : 0.4;
  for (const h of CORNER_HANDLES) {
    const c = toCanvas(corners[h.key]);
    ctx.beginPath();
    ctx.arc(c.x, c.y, sw(7), 0, Math.PI * 2);
    ctx.fillStyle = h.color;
    ctx.fill();
    ctx.strokeStyle = '#0b1020';
    ctx.lineWidth = sw(2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
