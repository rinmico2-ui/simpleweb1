'use strict';
/* Pixel Love — scene manager + game logic */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const wait = ms => new Promise(r => setTimeout(r, ms));

const state = { hearts: 0, allHearts: false, scene: 0 };
const TOTAL_HEARTS = CONFIG.heartsTotal;

/* ============ Sprites ============ */
const boyCanvasIds = ['titleBoyCanvas','boyCanvas1','boyCanvas2','boyCanvas3','boyCanvas4','boyCanvas5','boyCanvas6','endingBoyCanvas'];
const girlCanvasIds = ['girlCanvas4','girlCanvas5','girlCanvas6','endingGirlCanvas'];

function redrawBoys() { boyCanvasIds.forEach(id => { const c = document.getElementById(id); if (c) Sprites.drawBoy(c.getContext('2d')); }); }
function redrawGirls() { girlCanvasIds.forEach(id => { const c = document.getElementById(id); if (c) Sprites.drawGirl(c.getContext('2d')); }); }
function redrawAll() { redrawBoys(); redrawGirls(); }
function redrawFlowersAndHearts() {
  [['patchFlowerCanvas'],['flowerGiftCanvas']].forEach(([id]) => { const c = document.getElementById(id); if (c) Sprites.drawFlower(c.getContext('2d')); });
  [['bigHeartCanvas'],['photoHeartCanvas'],['giftHeartCanvas']].forEach(([id]) => { const c = document.getElementById(id); if (c) Sprites.drawHeart(c.getContext('2d')); });
}

setInterval(() => {
  Sprites.state.boyBlink = Math.random() < 0.55;
  Sprites.state.girlBlink = Math.random() < 0.55;
  if (Sprites.state.boyBlink || Sprites.state.girlBlink) {
    redrawAll();
    setTimeout(() => { Sprites.state.boyBlink = false; Sprites.state.girlBlink = false; redrawAll(); }, 150);
  }
}, 1700);

/* ============ HUD / chapters ============ */
const chapterNames = {
  0: 'A Pixel Story', 1: 'Chapter 1 — The Garden', 2: 'Chapter 2 — The Flower',
  3: 'Chapter 3 — The Journey', 4: 'Chapter 4 — The Girl', 5: 'Chapter 5 — The Gift',
  6: 'Chapter 6 — A Little Moment', 7: 'Chapter 7 — The Letter', 8: 'Chapter 8 — One More Gift', 9: '— The End —'
};
function setChapter(n) { $('#chapterLabel').textContent = chapterNames[n] || ''; }
function updateHeartsHud() { $('#heartsCount').textContent = state.hearts + ' / ' + TOTAL_HEARTS; }
function showToast(msg, ms = 3200) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => t.classList.add('hidden'), ms);
}

let sceneEpoch = 0;
function goTo(n) {
  sceneEpoch++;
  state.scene = n;
  $('#bigHeart').classList.remove('on');
  const gift = $('#flowerGift');
  gift.style.display = 'none';
  $$('.scene').forEach(s => s.classList.remove('active'));
  document.getElementById('scene-' + n).classList.add('active');
  setChapter(n);
  stopGardenLoop();
  const sc = document.getElementById('scene-' + n);
  if (sc.dataset.enter) { try { window[sc.dataset.enter](); } catch (e) { console.error('enter hook failed', e); } }
}

/* ============ Particles ============ */
const particles = () => $('#particles');
function burstAt(x, y, count, type = 'heart') {
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = type === 'heart' ? 'heart-p' : 'spark-p';
    if (type === 'heart') el.textContent = '♥';
    el.style.left = (x + (Math.random() - 0.5) * 70) + 'px';
    el.style.top = (y + (Math.random() - 0.5) * 50) + 'px';
    el.style.setProperty('--dx', (Math.random() * 70 - 35) + 'px');
    const dur = 1700 + Math.random() * 1500;
    el.style.animationDuration = dur + 'ms';
    particles().appendChild(el);
    setTimeout(() => el.remove(), dur + 60);
  }
}
function centerOf(el) {
  const r = el.getBoundingClientRect();
  const host = $('#game').getBoundingClientRect();
  return { x: r.left - host.left + r.width / 2, y: r.top - host.top + r.height / 2 };
}
function burstAtElement(el, count, type = 'heart') {
  const c = centerOf(el);
  burstAt(c.x, c.y, count, type);
}

/* ============ Typewriter ============ */
function typeText(el, text, speed = 28) {
  return new Promise(resolve => {
    el.textContent = '';
    let i = 0;
    clearInterval(typeText._t);
    typeText._t = setInterval(() => {
      i++;
      el.textContent = text.slice(0, i);
      if (i >= text.length) { clearInterval(typeText._t); resolve(); }
    }, speed);
    typeText._skip = () => { clearInterval(typeText._t); el.textContent = text; resolve(); };
  });
}

/* ============ Dialogue system ============ */
let dlgLines = [], dlgIndex = 0, dlgOnEnd = null, dlgTyping = false, dlgResolveTyping = null;

function say(lines, onEnd) {
  dlgLines = lines.slice();
  dlgIndex = 0;
  dlgOnEnd = onEnd || null;
  $('#dialogue').classList.remove('hidden');
  renderDlgLine();
}
function renderDlgLine() {
  const line = dlgLines[dlgIndex];
  const nameEl = $('#dlgName');
  const who = (line.who || 'note').toLowerCase();
  nameEl.textContent = who === 'boy' ? 'BOY' : who === 'girl' ? 'GIRL' : '✦';
  nameEl.className = who;
  dlgTyping = true;
  const done = typeText($('#dlgText'), line.text, 26);
  dlgResolveTyping = () => { if (typeText._skip) typeText._skip(); };
  done.then(() => { dlgTyping = false; });
}
function advanceDialogue() {
  if (dlgTyping) { if (typeText._skip) typeText._skip(); dlgTyping = false; return; }
  dlgIndex++;
  if (dlgIndex >= dlgLines.length) { endDialogue(); return; }
  renderDlgLine();
  Audio.play('click');
}
function endDialogue() {
  clearInterval(typeText._t);
  $('#dialogue').classList.add('hidden');
  const cb = dlgOnEnd; dlgOnEnd = null; dlgLines = [];
  if (cb) cb();
}
$('#dialogue').addEventListener('click', advanceDialogue);
$('#dlgSkip').addEventListener('click', e => { e.stopPropagation(); endDialogue(); });
document.addEventListener('keydown', e => {
  if (!$('#dialogue').classList.contains('hidden') && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    advanceDialogue();
  }
});

/* ============ Stars & fireflies ============ */
function spawnStars(containerId, n) {
  const c = document.getElementById(containerId);
  if (!c) return;
  c.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const size = Math.random() < 0.22 ? 4 : 2;
    s.style.width = size + 'px';
    s.style.height = size + 'px';
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 58 + '%';
    s.style.setProperty('--tw', (1.6 + Math.random() * 2.4) + 's');
    s.style.animationDelay = (Math.random() * 2.4) + 's';
    c.appendChild(s);
  }
}
function spawnFireflies() {
  const c = $('#fireflies');
  if (!c || c.childElementCount) return;
  for (let i = 0; i < 9; i++) {
    const f = document.createElement('div');
    f.className = 'firefly';
    f.style.left = 12 + Math.random() * 74 + '%';
    f.style.top = 30 + Math.random() * 38 + '%';
    f.style.setProperty('--ft', (7 + Math.random() * 6) + 's');
    f.style.animationDelay = (Math.random() * 5) + 's';
    c.appendChild(f);
  }
}
function spawnPetals(containerId, n) {
  const c = document.getElementById(containerId);
  if (!c) return;
  c.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const p = document.createElement('div');
    p.className = 'petal';
    p.style.left = Math.random() * 100 + '%';
    p.style.setProperty('--d', (8 + Math.random() * 6) + 's');
    p.style.setProperty('--delay', (-Math.random() * 12) + 's');
    c.appendChild(p);
  }
}
const BUTTERFLY_COLORS = ['#e88baa', '#c9b6e4', '#ffe066', '#a8d8ea'];
function spawnButterflies(containerId, n) {
  const c = document.getElementById(containerId);
  if (!c || c.childElementCount) return;
  for (let i = 0; i < n; i++) {
    const b = document.createElement('div');
    b.className = 'butterfly';
    b.style.top = (14 + Math.random() * 34) + '%';
    b.style.setProperty('--wt', (17 + Math.random() * 12) + 's');
    b.style.setProperty('--wdelay', (-Math.random() * 16) + 's');
    b.style.setProperty('--wc', BUTTERFLY_COLORS[i % BUTTERFLY_COLORS.length]);
    b.innerHTML = '<div class="bwing left"></div><div class="bbody"></div><div class="bwing right"></div>';
    c.appendChild(b);
  }
}

/* ============ Collectible hearts ============ */
function resetHearts() {
  state.hearts = 0; state.allHearts = false;
  $$('.p-heart').forEach(h => { h.classList.remove('collected'); h.style.visibility = 'visible'; });
  $('#allHeartsBadge').classList.add('hidden');
  updateHeartsHud();
}
function collectHeart(el) {
  if (el.classList.contains('collected')) return;
  el.classList.add('collected');
  el.style.visibility = 'hidden';
  state.hearts++;
  updateHeartsHud();
  Audio.play('heart');
  burstAtElement(el, 5, 'heart');
  if (state.hearts >= TOTAL_HEARTS) {
    state.allHearts = true;
    showToast('♥ YOU FOUND EVERY LITTLE HEART ♥', 3600);
    Audio.play('sparkle');
  }
}

/* ============ SCENE 1 — walk the garden ============ */
const garden = { x: 0, y: 0, vx: 0, vy: 0, keys: {}, raf: null, lastStep: 0 };
const DIR_KEYS = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };

function gardenBounds() {
  const r = $('#scene-1').getBoundingClientRect();
  return { w: r.width, h: r.height, groundTop: r.height * 0.60, groundBottom: r.height * 0.90, padX: r.width * 0.035 };
}
function placeGardenBoy() {
  const b = gardenBounds();
  const el = $('#boyWrap1');
  el.style.left = garden.x + 'px';
  el.style.top = garden.y + 'px';
}
function initGardenPos() {
  const b = gardenBounds();
  if (!garden.x) { garden.x = b.w * 0.12; garden.y = b.h * 0.64; }
  garden.x = Math.min(Math.max(garden.x, b.padX), b.w - 96 - b.padX);
  garden.y = Math.min(Math.max(garden.y, b.groundTop), b.groundBottom);
  placeGardenBoy();
}
function gardenTick(t) {
  if (state.scene !== 1) { stopGardenLoop(); return; }
  const dt = Math.min(40, t - (garden.lastT || t)) / 1000; garden.lastT = t;
  const k = garden.keys;
  let dx = (k.right ? 1 : 0) - (k.left ? 1 : 0);
  let dy = (k.down ? 1 : 0) - (k.up ? 1 : 0);
  const moving = dx !== 0 || dy !== 0;
  if (moving) {
    const len = Math.hypot(dx, dy); dx /= len; dy /= len;
    const speed = 300;
    const b = gardenBounds();
    garden.x = Math.min(Math.max(garden.x + dx * speed * dt, b.padX), b.w - 96 - b.padX);
    garden.y = Math.min(Math.max(garden.y + dy * speed * dt, b.groundTop), b.groundBottom);
    const el = $('#boyWrap1');
    el.classList.add('char-walk');
    el.classList.toggle('boy-flip', dx < -0.05);
    if (t - garden.lastStep > 330) { garden.lastStep = t; Audio.play('step'); }
    checkGardenPickups();
    checkGardenNear();
  } else {
    $('#boyWrap1').classList.remove('char-walk');
  }
  placeGardenBoy();
  garden.raf = requestAnimationFrame(gardenTick);
}
function stopGardenLoop() { if (garden.raf) cancelAnimationFrame(garden.raf); garden.raf = null; garden.lastT = 0; }
function startGardenLoop() { stopGardenLoop(); garden.raf = requestAnimationFrame(gardenTick); }

function distToEl(el, x, y) {
  const c = centerOf(el);
  return Math.hypot(c.x - x, c.y - y);
}
function playerCenter() {
  const el = $('#boyWrap1');
  const host = $('#game').getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return { x: r.left - host.left + r.width / 2, y: r.top - host.top + r.height / 2 };
}
function checkGardenPickups() {
  const p = playerCenter();
  $$('.p-heart').forEach(h => { if (!h.classList.contains('collected') && distToEl(h, p.x, p.y) < 54) collectHeart(h); });
}
const SPOTS = {
  spotFlower:  'A wildflower sways gently. It seems to nod — as if it is in on the secret.',
  spotPond:    'The pond sparkles like a pocketful of dropped stars.',
  spotTree:    'Petals drift down like slow, soft pink snow.',
  spotMailbox: 'An empty mailbox. Waiting for a letter that was never posted.'
};
const SPOT_NAMES = { spotFlower: '✦ FLOWERS', spotPond: '✦ THE POND', spotTree: '✦ THE TREE', spotMailbox: '✦ THE MAILBOX' };
function nearestSpot() {
  const p = playerCenter();
  let best = null, bestD = Infinity;
  Object.keys(SPOTS).forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const d = distToEl(el, p.x, p.y);
    if (d < bestD) { bestD = d; best = id; }
  });
  return bestD < 78 ? best : null;
}
const coarsePointer = () => window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 700;
function checkGardenNear() {
  const near = nearestSpot();
  const prompt = $('#prompt');
  if (near) {
    prompt.innerHTML = coarsePointer()
      ? SPOT_NAMES[near] + ' — Tap to look'
      : SPOT_NAMES[near] + ' — Press <kbd>E</kbd> to look';
    prompt.dataset.spot = near;
    prompt.classList.remove('hidden');
  } else {
    prompt.classList.add('hidden');
    delete prompt.dataset.spot;
  }
}
function interactSpot(id) {
  if (!SPOTS[id]) return;
  Audio.play('click');
  say([{ who: 'note', text: SPOTS[id] }]);
}
document.addEventListener('keydown', e => {
  if (state.scene !== 1) return;
  if (DIR_KEYS[e.code] || DIR_KEYS[e.key]) {
    const dir = DIR_KEYS[e.code] || DIR_KEYS[e.key];
    garden.keys[dir] = true;
    e.preventDefault();
  }
  if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E') {
    const near = nearestSpot();
    if (near) interactSpot(near);
  }
});
document.addEventListener('keyup', e => {
  const dir = DIR_KEYS[e.code] || DIR_KEYS[e.key];
  if (dir) garden.keys[dir] = false;
});
$('#prompt').addEventListener('click', () => { const id = $('#prompt').dataset.spot; if (id) interactSpot(id); });
Object.keys(SPOTS).forEach(id => { document.getElementById(id).addEventListener('click', () => interactSpot(id)); });
$$('.p-heart').forEach(h => h.addEventListener('click', () => collectHeart(h)));
$$('.dbtn').forEach(btn => {
  const dir = btn.dataset.dir;
  const on = e => { e.preventDefault(); garden.keys[dir] = true; };
  const off = e => { e.preventDefault(); garden.keys[dir] = false; };
  btn.addEventListener('pointerdown', on);
  btn.addEventListener('pointerup', off);
  btn.addEventListener('pointerleave', off);
  btn.addEventListener('pointercancel', off);
});
$('#continueJourneyBtn').addEventListener('click', () => { Audio.play('click'); goTo(2); });

/* ============ SCENE 2 — find the flower ============ */
function enterScene2() {
  Sprites.state.boyHasFlower = false;
  redrawBoys();
  spawnButterflies('butterflies2', 3);
  const boy = $('#boyWrap2');
  boy.style.left = '8%';
  boy.classList.remove('char-walk');
  const flower = $('#patchFlower');
  flower.classList.remove('picked');
  $('#continueJourney2Btn').classList.add('hidden');
}
async function pickFlower() {
  const my = sceneEpoch;
  const flower = $('#patchFlower');
  if (flower.classList.contains('picked')) return;
  flower.classList.add('picked');
  Audio.play('pick');
  $('#pickSparkles').innerHTML = '';
  const boy = $('#boyWrap2');
  boy.classList.add('char-walk');
  boy.style.left = '54%';
  await wait(5100);
  if (my !== sceneEpoch) return;
  boy.classList.remove('char-walk');
  /* sparkle burst */
  const host = $('#scene-2').getBoundingClientRect();
  const fx = host.width * 0.66 + 44, fy = host.height * 0.60;
  for (let i = 0; i < 14; i++) {
    const s = document.createElement('div');
    s.className = 'pick-spark';
    s.style.left = fx + 'px';
    s.style.top = fy + 'px';
    s.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px');
    s.style.setProperty('--dy', (Math.random() * -140 - 20) + 'px');
    $('#pickSparkles').appendChild(s);
  }
  Sprites.state.boyHasFlower = true;
  redrawBoys();
  flower.style.visibility = 'hidden';
  Audio.play('sparkle');
  say(CONFIG.story.scene2, () => {
    if (my !== sceneEpoch) return;
    $('#continueJourney2Btn').classList.remove('hidden');
  });
}
$('#patchFlower').addEventListener('click', pickFlower);
$('#continueJourney2Btn').addEventListener('click', () => { Audio.play('click'); goTo(3); });

/* ============ SCENE 3 — the journey ============ */
function enterScene3() {
  redrawBoys();
  spawnPetals('petals3', 16);
  spawnButterflies('butterflies3', 2);
  $('#boyWrap3').classList.add('char-walk');
  const my = sceneEpoch;
  setTimeout(() => { if (my === sceneEpoch) say(CONFIG.story.scene3, () => goTo(4)); }, 900);
}

/* ============ SCENE 4 — the girl ============ */
function enterScene4() {
  redrawAll();
  spawnPetals('petals4', 10);
  const boy = $('#boyWrap4');
  const girl = $('#girlWrap4');
  const my = sceneEpoch;
  boy.style.transition = 'none';
  boy.style.left = '-18%';
  void boy.getBoundingClientRect();
  $('#qBubble').classList.remove('show');
  $('#giveFlowerBtn').classList.add('hidden');
  Sprites.state.girlPose = 'idle'; redrawGirls();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    boy.style.transition = 'left 4.6s linear';
    boy.style.left = '24%';
    boy.classList.add('char-walk');
  }));
  setTimeout(() => {
    if (my !== sceneEpoch) return;
    boy.classList.remove('char-walk');
    $('#qBubble').classList.add('show');
    Sprites.state.girlPose = 'shock'; redrawGirls();
    Audio.play('click');
    setTimeout(() => {
      if (my !== sceneEpoch) return;
      $('#qBubble').classList.remove('show');
      Sprites.state.girlPose = 'idle'; redrawGirls();
      say(CONFIG.story.scene4, () => { $('#giveFlowerBtn').classList.remove('hidden'); });
    }, 1300);
  }, 4900);
}
$('#giveFlowerBtn').addEventListener('click', () => { Audio.play('click'); goTo(5); });

/* ============ SCENE 5 — the flower gift ============ */
function enterScene5() {
  const my = sceneEpoch;
  Sprites.state.boyHasFlower = true;
  Sprites.state.girlPose = 'idle';
  Sprites.state.boyPose = 'idle';
  redrawAll();
  const boy = $('#boyWrap5');
  const warm = $('#warmGlow');
  warm.classList.remove('on');
  $('#bigHeart').classList.remove('on');
  const gift = $('#flowerGift');
  gift.style.display = 'none';
  boy.style.transition = 'none';
  boy.style.left = '16%';
  boy.getBoundingClientRect();
  boy.style.transition = 'left 2s linear';
  boy.style.left = '32%';
  boy.classList.add('char-walk');
  setTimeout(() => { if (my === sceneEpoch) boy.classList.remove('char-walk'); }, 2050);
  giftGivingSequence(my);
}
async function giftGivingSequence(my) {
  const gift = $('#flowerGift');
  const boy = $('#boyWrap5');
  const girl = $('#girlWrap5');
  await wait(2300); if (my !== sceneEpoch) return;

  /* flower appears in boy's hand area */
  Sprites.drawFlower($('#flowerGiftCanvas').getContext('2d'));
  const br = boy.getBoundingClientRect();
  const host = $('#game').getBoundingClientRect();
  gift.style.display = 'block';
  gift.style.transition = 'none';
  gift.style.left = (br.left - host.left + br.width - 6) + 'px';
  gift.style.top = (br.top - host.top + br.height * 0.66) + 'px';
  gift.getBoundingClientRect();
  gift.style.transition = 'left 1.15s cubic-bezier(.34,1.4,.64,1), top 1.15s cubic-bezier(.34,1.4,.64,1)';
  const gr = girl.getBoundingClientRect();
  requestAnimationFrame(() => {
    gift.style.left = (gr.left - host.left + gr.width * 0.58) + 'px';
    gift.style.top = (gr.top - host.top + gr.height * 0.62) + 'px';
  });
  Audio.play('handoff');
  await wait(1150); if (my !== sceneEpoch) return;

  /* girl reacts */
  Sprites.state.girlPose = 'shock'; redrawGirls();
  burstAtElement(girl, 9, 'heart');
  Audio.play('heart');
  await wait(1000); if (my !== sceneEpoch) return;

  /* she accepts; the gift is hers now */
  Sprites.state.girlPose = 'accept';
  Sprites.state.boyPose = 'smile';
  Sprites.state.boyHasFlower = false;
  redrawAll();
  gift.style.display = 'none';
  warmGlowOn();
  $('#bigHeart').classList.add('on');
  burstAtElement(girl, 12, 'spark');
  Audio.play('sparkle');
  await wait(1500); if (my !== sceneEpoch) return;

  say(CONFIG.story.scene5, () => { if (my === sceneEpoch) setTimeout(() => goTo(6), 1300); });
}
function warmGlowOn() { $('#warmGlow').classList.add('on'); }

/* ============ SCENE 6 — photo moment ============ */
function enterScene6() {
  const my = sceneEpoch;
  Sprites.state.girlPose = 'accept';
  Sprites.state.boyPose = 'smile';
  redrawAll();
  spawnStars('photoStars', 28);
  spawnPetals('petals6', 12);
  $('#polaroid').classList.add('hidden');
  $('#continueAfterPhotoBtn').classList.add('hidden');
  $('#keepMomentBtn').classList.remove('hidden');
}
function snapshotPhoto() {
  const c = $('#snapshotCanvas');
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const g = ctx.createLinearGradient(0, 0, 0, c.height);
  g.addColorStop(0, '#4a3566'); g.addColorStop(0.45, '#b85f8c'); g.addColorStop(0.72, '#ffb98a'); g.addColorStop(0.85, '#8fbf8a'); g.addColorStop(1, '#79ac74');
  ctx.fillStyle = g; ctx.fillRect(0, 0, c.width, c.height);
  /* stars */
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 26; i++) ctx.fillRect(Math.random() * c.width, Math.random() * 52, 2, 2);
  /* moon */
  ctx.fillStyle = '#fff8d6'; ctx.fillRect(c.width - 38, 10, 18, 18);
  /* ground */
  ctx.fillStyle = '#8fbf8a'; ctx.fillRect(0, c.height - 30, c.width, 30);
  /* characters */
  const b = document.getElementById('boyCanvas6');
  const gl = document.getElementById('girlCanvas6');
  ctx.drawImage(b, 26, c.height - 74, 52, 66);
  ctx.drawImage(gl, c.width - 78, c.height - 74, 52, 66);
  /* heart above them */
  ctx.fillStyle = '#e85d8a';
  const hx = c.width / 2, hy = 66;
  const H = [[0,0],[-1,0],[1,0],[-2,1],[0,1],[2,1],[-2,2],[-1,2],[0,2],[1,2],[2,2],[-1,3],[0,3],[1,3],[0,4]];
  H.forEach(([x, y]) => ctx.fillRect(hx + x * 5, hy + y * 5, 5, 5));
}
$('#keepMomentBtn').addEventListener('click', () => {
  const flash = $('#flash');
  flash.classList.add('on');
  Audio.play('sparkle');
  setTimeout(() => flash.classList.remove('on'), 160);
  snapshotPhoto();
  $('#polaroid').classList.remove('hidden');
  $('#keepMomentBtn').classList.add('hidden');
  $('#continueAfterPhotoBtn').classList.remove('hidden');
});
$('#continueAfterPhotoBtn').addEventListener('click', () => { Audio.play('click'); goTo(7); });

/* ============ SCENE 7 — the secret letter ============ */
function enterScene7() {
  spawnStars('letterStars', 55);
  const btn = $('#envelopeBtn');
  btn.classList.remove('shaking', 'open');
  btn.disabled = false;
  btn.querySelector('.env-seal').classList.remove('broken');
  $('#letterPanel').classList.add('hidden');
  $('#letterText').textContent = '';
  $('#continueAfterLetterBtn').classList.add('hidden');
  $('#letterCursor').style.display = 'inline';
}
let letterRunning = false;
async function openLetter() {
  if (letterRunning) return;
  letterRunning = true;
  const my = sceneEpoch;
  const btn = $('#envelopeBtn');
  btn.disabled = true;
  Audio.play('click');
  btn.classList.add('shaking');
  await wait(620); if (my !== sceneEpoch) { letterRunning = false; return; }
  btn.classList.remove('shaking');
  btn.querySelector('.env-seal').classList.add('broken');
  Audio.play('seal');
  await wait(480); if (my !== sceneEpoch) { letterRunning = false; return; }
  btn.classList.add('open');
  Audio.play('envelope');
  await wait(750); if (my !== sceneEpoch) { letterRunning = false; return; }
  $('#letterPanel').classList.remove('hidden');
  await typeText($('#letterText'), CONFIG.LETTER, 26);
  if (my !== sceneEpoch) { letterRunning = false; return; }
  $('#letterCursor').style.display = 'none';
  Audio.play('sparkle');
  $('#continueAfterLetterBtn').classList.remove('hidden');
  letterRunning = false;
}
$('#envelopeBtn').addEventListener('click', openLetter);
$('#continueAfterLetterBtn').addEventListener('click', () => { Audio.play('click'); goTo(8); });

/* ============ SCENE 8 — the gift ============ */
function enterScene8() {
  spawnStars('giftStars', 55);
  const btn = $('#giftBtn');
  btn.classList.remove('shaking', 'open');
  btn.disabled = false;
  $('#giftHeartCanvas').classList.add('hidden');
  $('#giftMessage').classList.add('hidden');
  $('#continueAfterGiftBtn').classList.add('hidden');
}
let giftRunning = false;
async function openGift() {
  if (giftRunning) return;
  giftRunning = true;
  const my = sceneEpoch;
  const btn = $('#giftBtn');
  btn.disabled = true;
  Audio.play('click');
  btn.classList.add('shaking');
  await wait(660); if (my !== sceneEpoch) { giftRunning = false; return; }
  btn.classList.remove('shaking');
  btn.classList.add('open');
  const heart = $('#giftHeartCanvas');
  heart.classList.remove('hidden');
  Sprites.drawHeart(heart.getContext('2d'));
  Audio.play('gift');
  const box = btn.getBoundingClientRect();
  const host = $('#game').getBoundingClientRect();
  burstAt(box.left - host.left + box.width / 2, box.top - host.top + box.height * 0.4, 18, 'spark');
  burstAt(box.left - host.left + box.width / 2, box.top - host.top + box.height * 0.4, 8, 'heart');
  await wait(950); if (my !== sceneEpoch) { giftRunning = false; return; }
  $('#giftMessage').classList.remove('hidden');
  $('#continueAfterGiftBtn').classList.remove('hidden');
  giftRunning = false;
}
$('#giftBtn').addEventListener('click', openGift);
$('#continueAfterGiftBtn').addEventListener('click', () => { Audio.play('click'); goTo(9); });

/* ============ SCENE 9 — ending ============ */
function enterScene9() {
  particles().innerHTML = '';
  Sprites.state.girlPose = 'accept';
  Sprites.state.boyPose = 'smile';
  Sprites.state.boyHasFlower = false;
  redrawAll();
  spawnStars('nightStars', 70);
  spawnFireflies();
  $('#allHeartsBadge').classList.toggle('hidden', !state.allHearts);
  syncEndingMusicBtn();
}
function syncEndingMusicBtn() {
  const b = $('#musicToggleEndingBtn');
  b.textContent = Audio.isMusicOn() ? '♪ MUSIC: ON' : '♪ MUSIC: OFF';
  b.setAttribute('aria-pressed', String(Audio.isMusicOn()));
}
function resetStory() {
  sceneEpoch++;
  resetHearts();
  Sprites.state.boyHasFlower = false;
  Sprites.state.boyPose = 'idle';
  Sprites.state.girlPose = 'idle';
  garden.x = 0; garden.y = 0; garden.keys = {};
  stopGardenLoop();
  redrawAll();
  particles().innerHTML = '';
  $('#bigHeart').classList.remove('on');
  $('#warmGlow').classList.remove('on');
  $('#polaroid').classList.add('hidden');
  endDialogueSilent();
}
function endDialogueSilent() {
  clearInterval(typeText._t);
  $('#dialogue').classList.add('hidden');
  dlgOnEnd = null; dlgLines = [];
}
$('#replayStoryBtn').addEventListener('click', () => { Audio.play('click'); resetStory(); goTo(1); });
$('#returnTitleBtn').addEventListener('click', () => { Audio.play('click'); resetStory(); goTo(0); });
$('#musicToggleEndingBtn').addEventListener('click', () => { Audio.toggleMusic(); syncEndingMusicBtn(); });

/* ============ Global toggles & start ============ */
$('#musicBtn').addEventListener('click', () => { Audio.toggleMusic(); syncEndingMusicBtn(); });
$('#soundBtn').addEventListener('click', () => Audio.toggleSound());
$('#startGameBtn').addEventListener('click', () => {
  Audio.startMusic();
  Audio.play('click');
  goTo(1);
});

/* enter hooks — declarative via data-enter on sections */
document.getElementById('scene-1').dataset.enter = 'enterGarden';
document.getElementById('scene-2').dataset.enter = 'enterScene2';
document.getElementById('scene-3').dataset.enter = 'enterScene3';
document.getElementById('scene-4').dataset.enter = 'enterScene4';
document.getElementById('scene-5').dataset.enter = 'enterScene5';
document.getElementById('scene-6').dataset.enter = 'enterScene6';
document.getElementById('scene-7').dataset.enter = 'enterScene7';
document.getElementById('scene-8').dataset.enter = 'enterScene8';
document.getElementById('scene-9').dataset.enter = 'enterScene9';
window.enterGarden = function () { initGardenPos(); startGardenLoop(); spawnButterflies('butterflies1', 2); };
window.enterScene2 = enterScene2; window.enterScene3 = enterScene3; window.enterScene4 = enterScene4;
window.enterScene5 = enterScene5; window.enterScene6 = enterScene6; window.enterScene7 = enterScene7;
window.enterScene8 = enterScene8; window.enterScene9 = enterScene9;

/* ============ Boot ============ */
resetHearts();
redrawAll();
redrawFlowersAndHearts();
spawnStars('titleStars', 45);
setChapter(0);
