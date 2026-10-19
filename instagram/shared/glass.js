// Liquid Glass renderer shared by every Mountain Rangers design.
// Usage: const G = Glass(1080, 1440); then G.backdrop / G.glassText / G.glassPanels.
window.Glass = function (W, H) {
  const S = window.devicePixelRatio || 1;

  const load = src => new Promise((ok, err) => { const i = new Image(); i.onload = () => ok(i); i.onerror = err; i.src = src; });
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  // Page-sized canvas with the image placed like CSS object-fit: cover.
  function cover(img) {
    const c = mk(W, H), x = c.getContext('2d');
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    const s = Math.max(W / iw, H / ih);
    x.drawImage(img, (W - iw * s) / 2, (H - ih * s) / 2, iw * s, ih * s);
    return c;
  }

  // Edge-extended, blurred copy of a page-sized image that glass samples from.
  function backdrop(photo, blur, extra = '') {
    const P = 160;
    const pad = mk((W + 2 * P) * S, (H + 2 * P) * S), p = pad.getContext('2d');
    const X = P * S, Y = P * S, w = W * S, h = H * S, e = P * S;
    const sw = photo.naturalWidth || photo.width, sh = photo.naturalHeight || photo.height;
    p.drawImage(photo, X, Y, w, h);
    p.drawImage(photo, 0, 0, sw, 1, X, 0, w, e);
    p.drawImage(photo, 0, sh - 1, sw, 1, X, Y + h, w, e);
    p.drawImage(photo, 0, 0, 1, sh, 0, Y, e, h);
    p.drawImage(photo, sw - 1, 0, 1, sh, X + w, Y, e, h);
    p.drawImage(photo, 0, 0, 1, 1, 0, 0, e, e);
    p.drawImage(photo, sw - 1, 0, 1, 1, X + w, 0, e, e);
    p.drawImage(photo, 0, sh - 1, 1, 1, 0, Y + h, e, e);
    p.drawImage(photo, sw - 1, sh - 1, 1, 1, X + w, Y + h, e, e);
    const out = mk(pad.width, pad.height), o = out.getContext('2d');
    o.filter = `blur(${blur * S}px) ${extra}`;
    o.drawImage(pad, 0, 0);
    return { data: o.getImageData(0, 0, out.width, out.height).data, w: out.width, off: P * S };
  }

  // Apple-style continuous ("squircle") corners, PaintCode approximation.
  function squircle(ctx, x, y, w, h, r) {
    r = Math.min(r, Math.min(w, h) / 2 / 1.528665);
    const a = 1.528665 * r, b = 1.088493 * r, c = 0.868407 * r, d = 0.631494 * r, e = 0.074911 * r, f = 0.372824 * r, g = 0.169059 * r;
    const X = x + w, Y = y + h;
    ctx.moveTo(x + a, y);
    ctx.lineTo(X - a, y);
    ctx.bezierCurveTo(X - b, y, X - c, y, X - d, y + e);
    ctx.bezierCurveTo(X - f, y + g, X - g, y + f, X - e, y + d);
    ctx.bezierCurveTo(X, y + c, X, y + b, X, y + a);
    ctx.lineTo(X, Y - a);
    ctx.bezierCurveTo(X, Y - b, X, Y - c, X - e, Y - d);
    ctx.bezierCurveTo(X - g, Y - f, X - f, Y - g, X - d, Y - e);
    ctx.bezierCurveTo(X - c, Y, X - b, Y, X - a, Y);
    ctx.lineTo(x + a, Y);
    ctx.bezierCurveTo(x + b, Y, x + c, Y, x + d, Y - e);
    ctx.bezierCurveTo(x + f, Y - g, x + g, Y - f, x + e, Y - d);
    ctx.bezierCurveTo(x, Y - c, x, Y - b, x, Y - a);
    ctx.lineTo(x, y + a);
    ctx.bezierCurveTo(x, y + b, x, y + c, x + e, y + d);
    ctx.bezierCurveTo(x + g, y + f, x + f, y + g, x + d, y + e);
    ctx.bezierCurveTo(x + c, y, x + b, y, x + a, y);
    ctx.closePath();
  }

  // Liquid Glass: refract a blurred backdrop through the shape's bevel,
  // add chromatic fringing, tint, and a specular rim lit from the top-left.
  function liquidGlass(target, drawShape, src, o) {
    const cw = W * S, ch = H * S;
    const mask = mk(cw, ch), m = mask.getContext('2d');
    m.scale(S, S); m.fillStyle = '#fff'; drawShape(m);
    const height = (sigma) => {
      const c = mk(cw, ch), x = c.getContext('2d');
      x.filter = `blur(${sigma * S}px)`; x.drawImage(mask, 0, 0);
      return x.getImageData(0, 0, cw, ch).data;
    };
    const A = m.getImageData(0, 0, cw, ch).data;
    const Hw = height(o.bezel), Hr = height(o.rim);

    // shadow first, so the glass sits on it
    const t = target.getContext('2d');
    t.save();
    t.shadowColor = o.shadow[0]; t.shadowBlur = o.shadow[1] * S; t.shadowOffsetY = o.shadow[2] * S;
    t.globalAlpha = o.shadow[3];
    // draw the shape off-canvas so only its shadow lands (no white halo under anti-aliased edges)
    t.shadowOffsetX = 4 * cw;
    t.drawImage(mask, -4 * cw, 0);
    t.restore();

    const out = t.createImageData(cw, ch), D = out.data;
    const kW = o.bezel * S * 2.5 / 255, kR = o.rim * S * 2.5 / 255;
    const L = [-0.55, -0.83];                 // light from upper-left
    const sw = src.w, so = src.off, sd = src.data;
    const sample = (x, y, ch) => {
      let xi = Math.round(x) + so, yi = Math.round(y) + so;
      return sd[(yi * sw + xi) * 4 + ch];
    };
    for (let y = 1; y < ch - 1; y++) {
      for (let x = 1; x < cw - 1; x++) {
        const i = (y * cw + x) * 4, a = A[i + 3];
        if (!a) continue;
        // wide bevel → refraction
        const gx = (Hw[i + 7] - Hw[i - 1]) * 0.5 * kW, gy = (Hw[i + cw * 4 + 3] - Hw[i - cw * 4 + 3]) * 0.5 * kW;
        // thin bevel → specular rim
        const rx = (Hr[i + 7] - Hr[i - 1]) * 0.5 * kR, ry = (Hr[i + cw * 4 + 3] - Hr[i - cw * 4 + 3]) * 0.5 * kR;
        const k = o.refract * S;
        const r = sample(x - gx * k * 1.00, y - gy * k * 1.00, 0);
        const g = sample(x - gx * k * 0.93, y - gy * k * 0.93, 1);
        const b = sample(x - gx * k * 0.86, y - gy * k * 0.86, 2);
        // outward normal is -gradient; rim lit where it faces the light, softer kick on the far side
        const rm = Math.min(1, Math.hypot(rx, ry));
        const nl = rm > 1e-4 ? (-rx * L[0] - ry * L[1]) / Math.hypot(rx, ry) : 0;
        const spec = rm * (o.rimBase + o.rimKey * Math.max(0, nl) + o.rimBack * Math.max(0, -nl));
        const wm = Math.min(1, Math.hypot(gx, gy));
        const glow = wm * o.edgeGlow;
        const tA = o.tint[3];
        let R = (r * o.gain) * (1 - tA) + o.tint[0] * tA;
        let G = (g * o.gain) * (1 - tA) + o.tint[1] * tA;
        let B = (b * o.gain) * (1 - tA) + o.tint[2] * tA;
        const add = 255 * (spec + glow);
        D[i] = Math.min(255, R + add);
        D[i + 1] = Math.min(255, G + add);
        D[i + 2] = Math.min(255, B + add);
        D[i + 3] = a;
      }
    }
    const tmp = mk(cw, ch); tmp.getContext('2d').putImageData(out, 0, 0);
    t.drawImage(tmp, 0, 0);
  }

  // Frosted glass letters, stretched vertically like the iOS lock-screen clock.
  const TEXT = {
    bezel: 7, rim: 0.9, refract: 10, gain: 1.0, tint: [255, 255, 255, 0.62],
    rimBase: 0.0, rimKey: 0.85, rimBack: 0.14, edgeGlow: 0.12,
    shadow: ['rgba(0,0,0,1)', 46, 14, 0.30],
  };
  function glassText(target, lines, box, src, o = {}) {
    const { top, bottom, maxW, gap = 24, cx = W / 2, weight = 700, family = 'Inter Display' } = box;
    liquidGlass(target, (ctx) => {
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      let fs = 260;
      ctx.font = `${weight} ${fs}px "${family}"`;
      const widest = Math.max(...lines.map(s => ctx.measureText(s).width));
      fs = fs * maxW / widest;
      ctx.font = `${weight} ${fs}px "${family}"`;
      const cap = ctx.measureText('H').actualBoundingBoxAscent;
      const lineH = (bottom - top - gap * (lines.length - 1)) / lines.length;
      const sy = lineH / cap;
      lines.forEach((s, n) => {
        const base = top + lineH * (n + 1) + gap * n;
        ctx.save(); ctx.translate(cx, base); ctx.scale(1, sy);
        ctx.fillText(s, 0, 0);
        ctx.restore();
      });
    }, src, { ...TEXT, ...o });
  }

  // Every `.glass` element under `root` becomes a glass panel behind its content.
  // data-shape: capsule | circle | (default) squircle with data-radius.
  const PANEL = {
    bezel: 16, rim: 1.2, refract: 40, gain: 0.84, tint: [255, 255, 255, 0.10],
    rimBase: 0.10, rimKey: 0.75, rimBack: 0.45, edgeGlow: 0.06,
    shadow: ['rgba(0,0,0,1)', 60, 22, 0.22],
  };
  const CAPSULE = { bezel: 9, refract: 22, gain: 0.66, tint: [255, 255, 255, 0.06] };
  function glassPanels(target, root, src, o = {}) {
    const base = root.getBoundingClientRect();
    for (const el of root.querySelectorAll('.glass')) {
      const r = el.getBoundingClientRect();
      const x = r.left - base.left, y = r.top - base.top;
      const shape = el.dataset.shape || 'squircle';
      const extra = el.dataset.glass ? JSON.parse(el.dataset.glass) : {};
      liquidGlass(target, (ctx) => {
        ctx.beginPath();
        if (shape === 'capsule') ctx.roundRect(x, y, r.width, r.height, r.height / 2);
        else if (shape === 'circle') ctx.arc(x + r.width / 2, y + r.height / 2, r.width / 2, 0, Math.PI * 2);
        else squircle(ctx, x, y, r.width, r.height, +el.dataset.radius);
        ctx.fill();
      }, src, { ...PANEL, ...(shape === 'squircle' ? {} : CAPSULE), ...o, ...extra });
    }
  }

  function sizeCanvases(...ids) {
    for (const id of ids) {
      const c = document.getElementById(id); c.width = W * S; c.height = H * S;
    }
  }

  async function ready() {
    await document.fonts.load('700 200px "Inter Display"');
    await document.fonts.ready;
    await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
  }

  return { S, W, H, load, mk, cover, backdrop, squircle, liquidGlass, glassText, glassPanels, sizeCanvases, ready };
};
