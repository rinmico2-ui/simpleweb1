/* Pixel Love — WebAudio: 8-bit music loop + SFX. No external files. */
const Audio = (() => {
  let ac = null, master = null, sfxGain = null;
  let musicOn = false, soundOn = true;
  const voices = [];

  const C3=130.81, F3=174.61, G3=196.0, A3=220.0;
  const C4=261.63, D4=293.66, E4=329.63, F4=349.23, G4=392.0, A4=440.0, B4=493.88;
  const C5=523.25, D5=587.33;

  const CH = {
    C:[C4,E4,G4], Am:[A3,C4,E4], F:[F4,A4,C5], G:[G4,B4,D5], Dm:[D4,F4,A4], Em:[E4,G4,B4]
  };
  const PROG = ['C', 'Am', 'F', 'G'];
  const ROOTS = { C: C3, Am: A3, F: F3, G: G3 };

  function ensure() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ac = new AC();
      master = ac.createGain(); master.gain.value = 0;
      master.connect(ac.destination);
      sfxGain = ac.createGain(); sfxGain.gain.value = 0.6;
      sfxGain.connect(ac.destination);
    }
    if (ac.state === 'suspended') ac.resume();
    return true;
  }

  function envGain(t, dur, peak) {
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.035);
    g.gain.setValueAtTime(peak, Math.max(t + 0.04, t + dur - 0.06));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    return g;
  }
  function track(node) { voices.push(node); node.onended = () => { const i = voices.indexOf(node); if (i >= 0) voices.splice(i, 1); }; }

  function airy(freq, t, dur, peak) {
    const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = freq;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200; lp.Q.value = 3;
    const g = envGain(t, dur, peak);
    o.connect(lp); lp.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02); track(o);
  }
  function bass(freq, t, dur) {
    const o = ac.createOscillator(); o.type = 'square'; o.frequency.value = freq;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; lp.Q.value = 8;
    const g = ac.createGain(); g.gain.value = 0.16;
    o.connect(lp); lp.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur); track(o);
  }
  function buildScore() {
    const now = ac.currentTime + 0.08;
    const unit = 3.0;
    for (let lap = 0; lap < 3; lap++) {
      PROG.forEach((name, idx) => {
        const t = now + (lap * 4 + idx) * unit;
        const ch = CH[name], root = ROOTS[name];
        ch.forEach((n, i) => airy(n, t + i * 0.09, unit * 0.95, 0.11 + i * 0.015));
        [0,1,2,1,2,1,0,1].forEach((oi, i) => airy(ch[oi] * 2, t + 0.35 + i * 0.34, 0.5, 0.08));
        bass(root, t, unit * 0.45);
        bass(root * 1.5, t + unit * 0.5, unit * 0.4);
      });
    }
  }

  function startMusic() {
    if (!ensure()) return;
    if (musicOn) return;
    musicOn = true; updateButtons();
    master.gain.cancelScheduledValues(ac.currentTime);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), ac.currentTime);
    master.gain.linearRampToValueAtTime(0.75, ac.currentTime + 0.2);
    buildScore();
  }
  function stopMusic() {
    if (!musicOn || !master) return;
    musicOn = false; updateButtons();
    master.gain.cancelScheduledValues(ac.currentTime);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), ac.currentTime);
    master.gain.linearRampToValueAtTime(0.0001, ac.currentTime + 0.1);
    voices.slice().forEach(v => { try { v.stop(ac.currentTime + 0.12); } catch (e) {} });
    voices.length = 0;
  }
  function toggleMusic() { musicOn ? stopMusic() : startMusic(); }
  function toggleSound() { soundOn = !soundOn; updateButtons(); return soundOn; }

  /* --- SFX --- */
  function tone(type, freq, t, dur, vol, dest) {
    const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || sfxGain);
    o.start(t); o.stop(t + dur + 0.02); track(o);
    return o;
  }
  function noise(t, dur, vol, hp) {
    const len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource(); src.buffer = buf;
    const f = ac.createBiquadFilter(); f.type = hp ? 'highpass' : 'bandpass'; f.frequency.value = hp ? 5000 : 900;
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(sfxGain);
    src.start(t); track(src);
  }
  const SFX = {
    click()  { if (!sfxReady()) return; const t = ac.currentTime; tone('square', 880, t, 0.07, 0.12); },
    step()   { if (!sfxReady()) return; const t = ac.currentTime; noise(t, 0.05, 0.10, true); },
    pick()   { if (!sfxReady()) return; const t = ac.currentTime; [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone('triangle', f, t + i * 0.07, 0.28, 0.22)); },
    handoff(){ if (!sfxReady()) return; const t = ac.currentTime; [392, 523.25, 659.25].forEach((f, i) => tone('triangle', f, t + i * 0.09, 0.7, 0.25)); },
    heart()  { if (!sfxReady()) return; const t = ac.currentTime; [1318.5, 1567.98, 2093].forEach((f, i) => tone('sine', f, t + i * 0.05, 0.22, 0.18)); },
    envelope(){ if (!sfxReady()) return; const t = ac.currentTime; noise(t, 0.18, 0.25, false); tone('sine', 1567.98, t + 0.16, 0.3, 0.2); },
    seal()   { if (!sfxReady()) return; const t = ac.currentTime; noise(t, 0.12, 0.3, false); noise(t + 0.09, 0.08, 0.22, false); },
    gift()   { if (!sfxReady()) return; const t = ac.currentTime; [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone('square', f, t + i * 0.08, 0.3, 0.14)); [523.25, 659.25, 783.99].forEach(f => tone('triangle', f, t + 0.45, 1.4, 0.18)); },
    sparkle(){ if (!sfxReady()) return; const t = ac.currentTime; [2093, 2637, 3136].forEach((f, i) => tone('sine', f, t + i * 0.04, 0.3, 0.12)); }
  };
  function sfxReady() { return soundOn && ensure(); }
  function play(name) { if (SFX[name]) SFX[name](); }

  function updateButtons() {
    const m = document.getElementById('musicBtn');
    const s = document.getElementById('soundBtn');
    if (m) { m.setAttribute('aria-pressed', String(musicOn)); m.textContent = musicOn ? '♪ MUSIC: ON' : '♪ MUSIC: OFF'; }
    if (s) { s.setAttribute('aria-pressed', String(soundOn)); s.textContent = soundOn ? 'SFX: ON' : 'SFX: OFF'; }
  }

  return { startMusic, stopMusic, toggleMusic, toggleSound, play, updateButtons, isMusicOn: () => musicOn, isSoundOn: () => soundOn };
})();
