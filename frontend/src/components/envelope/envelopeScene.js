/**
 * Three.js envelope for the digital invitation.
 *
 * createEnvelopeScene(container, details) builds the scene and returns
 * { setProgress(0..1), setPointer(x, y), dispose() }. Progress 0 is a sealed
 * envelope; scrolling to 1 breaks the seal, opens the flap and lifts the
 * card out to face the guest. Lower progress plays it backwards, so
 * scrolling up closes the envelope again.
 *
 * Kept free of React so the wrapper can load it (and three) on demand.
 */
import * as THREE from 'three';
import { MONOGRAM_PATHS, MONOGRAM_TRANSFORM, MONOGRAM_VIEWBOX } from '../../utils/monogramPath';

const W = 3.2;
const H = 2.1;
const FLAP_DEPTH = H * 0.62;

const COLORS = {
  inside: '#E9DCC8',
  pocket: '#F7F0E5',
  flap: '#FBF6EE',
  fold: '#E2D3BD',
  sunset: '#BF560F',
  monogram: '#C5A78A',
  ink: '#4A3F35',
  paper: '#FFFDF8',
};

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;

function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

let monogramPaths = null;

/** The approved TD artwork, centred at (cx, cy) and `width` px wide. */
function drawMonogram(ctx, cx, cy, width, color) {
  monogramPaths ??= MONOGRAM_PATHS.map((d) => new Path2D(d));
  const { x, y, width: vw, height: vh } = MONOGRAM_VIEWBOX;
  const { tx, ty, sx, sy } = MONOGRAM_TRANSFORM;
  const k = width / vw;
  ctx.save();
  ctx.translate(cx - width / 2, cy - (vh * k) / 2);
  ctx.scale(k, k);
  ctx.translate(-x + tx, -y + ty);
  ctx.scale(sx, sy);
  ctx.fillStyle = color;
  monogramPaths.forEach((p) => ctx.fill(p));
  ctx.restore();
}

/** Fit a line of text inside maxWidth by shrinking the font. */
function fitText(ctx, text, font, size, maxWidth) {
  let s = size;
  ctx.font = font(s);
  while (ctx.measureText(text).width > maxWidth && s > 12) {
    s -= 2;
    ctx.font = font(s);
  }
  return s;
}

function drawCard(ctx, w, h, d) {
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = COLORS.monogram;
  ctx.lineWidth = 4;
  ctx.strokeRect(26, 26, w - 52, h - 52);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(40, 40, w - 80, h - 80);

  // Diamond lattice edging (the approved strip) along the top and bottom.
  const cell = 18;
  for (const y of [52, h - 52 - cell]) {
    for (let x = 60; x < w - 60 - cell; x += cell) {
      ctx.fillStyle = COLORS.sunset;
      ctx.fillRect(x, y, cell, cell);
      ctx.fillStyle = COLORS.paper;
      ctx.beginPath();
      ctx.moveTo(x + cell / 2, y + 2);
      ctx.lineTo(x + cell - 2, y + cell / 2);
      ctx.lineTo(x + cell / 2, y + cell - 2);
      ctx.lineTo(x + 2, y + cell / 2);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  // The approved TD monogram.
  drawMonogram(ctx, w / 2, 178, 150, COLORS.monogram);

  ctx.fillStyle = COLORS.ink;
  const serif = (s) => `${s}px "Cormorant Garamond", Georgia, serif`;
  fitText(ctx, d.greeting, serif, 40, w - 160);
  ctx.fillText(d.greeting, w / 2, 315);

  ctx.fillStyle = COLORS.sunset;
  const script = (s) => `${s}px "Great Vibes", cursive`;
  fitText(ctx, d.couple, script, 86, w - 180);
  ctx.fillText(d.couple, w / 2, 410);

  ctx.fillStyle = COLORS.ink;
  ctx.font = serif(30);
  ctx.fillText('request the pleasure of your company', w / 2, 462);
  fitText(ctx, d.when, serif, 32, w - 160);
  ctx.fillText(d.when, w / 2, 520);
  if (d.where) {
    fitText(ctx, d.where, serif, 28, w - 160);
    ctx.fillText(d.where, w / 2, 560);
  }
}

function drawLiner(ctx, w, h) {
  const cell = 48;
  for (let y = 0; y < h; y += cell) {
    for (let x = 0; x < w; x += cell) {
      ctx.fillStyle = COLORS.sunset;
      ctx.fillRect(x, y, cell, cell);
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(x + cell / 2, y + 5);
      ctx.lineTo(x + cell - 5, y + cell / 2);
      ctx.lineTo(x + cell / 2, y + cell - 5);
      ctx.lineTo(x + 5, y + cell / 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = COLORS.sunset;
      ctx.beginPath();
      ctx.moveTo(x + cell / 2, y + 15);
      ctx.lineTo(x + cell - 15, y + cell / 2);
      ctx.lineTo(x + cell / 2, y + cell - 15);
      ctx.lineTo(x + 15, y + cell / 2);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawSeal(ctx, w, h) {
  ctx.fillStyle = COLORS.sunset;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w / 2 - 22, 0, Math.PI * 2);
  ctx.stroke();
  drawMonogram(ctx, w / 2, h / 2, 250, '#FFF8EF');
}

function uvFromPositions(geometry, minX, maxX, minY, maxY) {
  const pos = geometry.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) - minX) / (maxX - minX);
    uv[i * 2 + 1] = (pos.getY(i) - minY) / (maxY - minY);
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geometry;
}

export function createEnvelopeScene(container, details) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  renderer.domElement.style.display = 'block';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  camera.position.set(0, 0, 6.2);

  const disposables = [];
  const keep = (...items) => {
    disposables.push(...items);
    return items[0];
  };

  const root = new THREE.Group();
  root.position.y = 0.3; // leave room for the hint and the bottom bar
  scene.add(root);
  const envelope = new THREE.Group();
  root.add(envelope);

  // Soft shadow under the envelope.
  const shadowTex = keep(canvasTexture(256, 64, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(74,63,53,0.16)');
    g.addColorStop(1, 'rgba(74,63,53,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }));
  const shadow = new THREE.Mesh(
    keep(new THREE.PlaneGeometry(W * 1.05, 0.32)),
    keep(new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })),
  );
  shadow.position.set(0, -H / 2 - 0.1, -0.05);
  envelope.add(shadow);

  // Inside back of the envelope.
  const back = new THREE.Mesh(
    keep(new THREE.PlaneGeometry(W, H)),
    keep(new THREE.MeshBasicMaterial({ color: COLORS.inside })),
  );
  envelope.add(back);

  // The card.
  const cardTex = keep(canvasTexture(1024, 660, (ctx, w, h) => drawCard(ctx, w, h, details)));
  const card = new THREE.Mesh(
    keep(new THREE.PlaneGeometry(2.92, 1.88)),
    keep(new THREE.MeshBasicMaterial({ map: cardTex })),
  );
  envelope.add(card);

  // Front pocket (left, right and bottom flaps folded in).
  const pocketShape = new THREE.Shape();
  pocketShape.moveTo(-W / 2, -H / 2);
  pocketShape.lineTo(W / 2, -H / 2);
  pocketShape.lineTo(W / 2, H / 2);
  pocketShape.lineTo(0, -0.12);
  pocketShape.lineTo(-W / 2, H / 2);
  pocketShape.closePath();
  const pocket = new THREE.Mesh(
    keep(new THREE.ShapeGeometry(pocketShape)),
    keep(new THREE.MeshBasicMaterial({ color: COLORS.pocket })),
  );
  pocket.position.z = 0.05;
  envelope.add(pocket);

  // Fold lines on the pocket.
  const folds = new THREE.LineSegments(
    keep(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-W / 2, -H / 2, 0), new THREE.Vector3(-0.35, -0.2, 0),
      new THREE.Vector3(W / 2, -H / 2, 0), new THREE.Vector3(0.35, -0.2, 0),
    ])),
    keep(new THREE.LineBasicMaterial({ color: COLORS.fold })),
  );
  folds.position.z = 0.051;
  envelope.add(folds);

  // Top flap, hinged along the top edge. Front: paper. Inside: patterned liner.
  const flap = new THREE.Group();
  flap.position.set(0, H / 2, 0.06);
  envelope.add(flap);
  const flapShape = new THREE.Shape();
  flapShape.moveTo(-W / 2, 0);
  flapShape.lineTo(W / 2, 0);
  flapShape.lineTo(0, -FLAP_DEPTH);
  flapShape.closePath();
  const flapGeo = keep(new THREE.ShapeGeometry(flapShape));
  uvFromPositions(flapGeo, -W / 2, W / 2, -FLAP_DEPTH, 0);
  const flapFront = new THREE.Mesh(flapGeo, keep(new THREE.MeshBasicMaterial({ color: COLORS.flap, side: THREE.FrontSide })));
  const linerTex = keep(canvasTexture(512, 256, drawLiner));
  const flapLiner = new THREE.Mesh(flapGeo, keep(new THREE.MeshBasicMaterial({ map: linerTex, side: THREE.BackSide })));
  flap.add(flapFront, flapLiner);

  // Wax seal on the flap's tip; it lifts away as the envelope opens.
  const sealTex = keep(canvasTexture(512, 512, (ctx, w, h) => drawSeal(ctx, w, h)));
  const seal = new THREE.Mesh(
    keep(new THREE.CircleGeometry(0.3, 64)),
    keep(new THREE.MeshBasicMaterial({ map: sealTex, transparent: true })),
  );
  // On the flap's tip, which sits at H/2 - FLAP_DEPTH from the centre.
  const SEAL_Y = H / 2 - FLAP_DEPTH + 0.08;
  seal.position.set(0, SEAL_Y, 0.08);
  envelope.add(seal);

  let progress = 0;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let frame = 0;
  let running = true;

  function layout() {
    const p = progress;
    const open = smooth(0.05, 0.42, p); // flap
    const rise = smooth(0.38, 0.7, p); // card slides up out of the pocket
    const present = smooth(0.7, 0.96, p); // card comes forward to the guest

    // Seal: fades and lifts first.
    const sealGone = smooth(0.02, 0.16, p);
    seal.material.opacity = 1 - sealGone;
    seal.position.z = 0.08 + sealGone * 0.4;
    seal.scale.setScalar(1 + sealGone * 0.25);
    seal.visible = sealGone < 0.99;

    flap.rotation.x = -Math.PI * open;
    // Once past upright, the flap sits behind the card.
    flap.position.z = open > 0.5 ? -0.01 : 0.06;

    card.position.set(0, lerp(-0.08, 1.95, rise) - present * 1.45, lerp(0.02, 0.02, rise) + present * 1.35);
    card.rotation.x = -0.08 * present;
    card.renderOrder = present > 0 ? 2 : 0;

    // Keep everything framed: the envelope drifts down and away as the card leaves.
    envelope.position.y = -0.55 * rise - 0.35 * present;
    envelope.position.z = -0.9 * present;
    envelope.scale.setScalar(1 - 0.08 * present);
  }

  function resize() {
    const { clientWidth: w, clientHeight: h } = container;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = `${w}px`;
    renderer.domElement.style.height = `${h}px`;
    camera.aspect = w / h;
    // Narrow (phone) screens: step back so the whole envelope fits.
    const fitDistance = (W * 1.15) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    camera.position.z = Math.max(6.2, fitDistance);
    camera.updateProjectionMatrix();
  }

  function tick() {
    if (!running) return;
    pointer.x += (pointer.tx - pointer.x) * 0.08;
    pointer.y += (pointer.ty - pointer.y) * 0.08;
    root.rotation.y = pointer.x * 0.22;
    root.rotation.x = -pointer.y * 0.14;
    layout();
    renderer.render(scene, camera);
    frame = requestAnimationFrame(tick);
  }

  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  layout();
  frame = requestAnimationFrame(tick);

  return {
    setProgress(p) {
      progress = clamp(p);
    },
    setPointer(x, y) {
      pointer.tx = clamp(x, -1, 1);
      pointer.ty = clamp(y, -1, 1);
    },
    pause() {
      running = false;
      cancelAnimationFrame(frame);
    },
    resume() {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(tick);
    },
    dispose() {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      disposables.forEach((d) => d.dispose?.());
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
