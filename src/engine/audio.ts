// Web Audio API でチップチューン風の BGM と効果音をコードから鳴らす（音声ファイル不要）

type Wave = 'pulse12' | 'pulse25' | 'pulse50' | 'triangle' | 'noise';

interface VoiceDef {
  wave: Wave;
  vol: number;
  notes: string;
}

interface TrackDef {
  bpm: number;
  voices: VoiceDef[];
}

type NoteVal = number | null | 'k' | 's' | 'h';
interface Note {
  m: NoteVal;
  d: number; // 16分音符いくつ分か
}

const NOTE_INDEX: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function parseNotes(src: string): Note[] {
  return src
    .trim()
    .split(/\s+/)
    .filter((t) => t && t !== '|')
    .map((tok) => {
      const [name, dur] = tok.split('-');
      const d = Number(dur || 1);
      if (name === 'r') return { m: null, d };
      if (name === 'k' || name === 's' || name === 'h') return { m: name, d };
      const m = /^([A-G])([#b]?)(\d)$/.exec(name);
      if (!m) throw new Error(`bad note ${tok}`);
      let n = NOTE_INDEX[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
      n += (Number(m[3]) + 1) * 12;
      return { m: n, d };
    });
}

const midiToFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// ---------------- 曲データ（すべてオリジナル） ----------------
const DRUM_MARCH = 'k-2 h-2 s-2 h-2 k-2 h-2 s-2 h-2';
const DRUM_BATTLE = 'k-2 h-1 h-1 s-2 h-2 k-2 k-2 s-2 h-2';
const eight = (lo: string, hi: string, times = 4) => Array(times).fill(`${lo}-2 ${hi}-2`).join(' ');

const TITLE_LEAD = `G4-2 C5-2 E5-2 G5-10 | F5-2 E5-2 D5-2 E5-2 C5-8 | A4-2 D5-2 F5-2 A5-10 | G5-2 F5-2 E5-2 F5-2 D5-8 |
  E5-2 F5-2 G5-4 C6-4 B5-2 A5-2 | A5-4 G5-4 F5-4 E5-4 | D5-2 E5-2 F5-4 E5-2 D5-2 B4-4 | C5-12 r-4`;
const TITLE_BASS = `C3-4 G3-4 C4-4 G3-4 | C3-4 G3-4 E3-4 G3-4 | D3-4 A3-4 D4-4 A3-4 | G2-4 D3-4 G3-4 D3-4 |
  C3-4 G3-4 E3-4 G3-4 | F2-4 C3-4 A3-4 C3-4 | G2-4 D3-4 G3-4 B2-4 | C3-4 G3-4 C3-8`;
const TITLE_HARM = `E4-16 | G4-8 E4-8 | F4-16 | B3-16 | G4-16 | A4-8 F4-8 | F4-8 D4-8 | E4-16`;

const TRACKS: Record<string, TrackDef> = {
  title: {
    bpm: 112,
    voices: [
      { wave: 'pulse25', vol: 0.16, notes: TITLE_LEAD },
      { wave: 'pulse50', vol: 0.06, notes: TITLE_HARM },
      { wave: 'triangle', vol: 0.28, notes: TITLE_BASS },
    ],
  },
  ending: {
    bpm: 84,
    voices: [
      { wave: 'pulse25', vol: 0.16, notes: TITLE_LEAD },
      { wave: 'pulse50', vol: 0.06, notes: TITLE_HARM },
      { wave: 'triangle', vol: 0.28, notes: TITLE_BASS },
    ],
  },
  town: {
    bpm: 96,
    voices: [
      {
        wave: 'pulse25',
        vol: 0.15,
        notes: `E5-4 G5-2 E5-2 D5-4 C5-4 | D5-4 E5-2 D5-2 C5-4 A4-4 | G4-4 A4-2 C5-2 D5-4 E5-4 | D5-12 r-4 |
          E5-4 G5-2 A5-2 G5-4 E5-4 | F5-4 E5-2 D5-2 C5-4 A4-4 | G4-4 C5-2 D5-2 E5-4 D5-4 | C5-12 r-4`,
      },
      { wave: 'pulse12', vol: 0.06, notes: `G4-16 | A4-16 | E4-16 | B3-16 | G4-16 | A4-16 | B3-16 | E4-16` },
      {
        wave: 'triangle',
        vol: 0.26,
        notes: `C3-4 E3-4 G3-4 E3-4 | F2-4 A2-4 C3-4 A2-4 | C3-4 E3-4 G3-4 E3-4 | G2-4 B2-4 D3-4 B2-4 |
          C3-4 E3-4 G3-4 E3-4 | F2-4 A2-4 C3-4 A2-4 | G2-4 B2-4 D3-4 G2-4 | C3-4 G2-4 C3-8`,
      },
    ],
  },
  castle: {
    bpm: 88,
    voices: [
      {
        wave: 'pulse25',
        vol: 0.15,
        notes: `C5-4 G4-2 C5-2 E5-4 D5-2 C5-2 | D5-6 E5-2 D5-4 G4-4 | E5-4 F5-2 G5-2 A5-4 G5-2 F5-2 | E5-6 D5-2 C5-8 |
          A4-4 B4-2 C5-2 D5-4 C5-2 B4-2 | C5-4 D5-2 E5-2 F5-8 | G5-4 F5-2 E5-2 D5-4 C5-2 D5-2 | C5-12 r-4`,
      },
      { wave: 'pulse12', vol: 0.07, notes: `E4-16 | G4-16 | C5-16 | G4-8 E4-8 | F4-16 | A4-16 | B4-16 | E4-16` },
      {
        wave: 'triangle',
        vol: 0.28,
        notes: `C3-4 E3-4 G3-4 E3-4 | G2-4 B2-4 D3-4 G2-4 | C3-4 E3-4 F3-4 D3-4 | C3-4 G2-4 C3-8 |
          F2-4 A2-4 D3-4 F2-4 | A2-4 C3-4 F3-4 A2-4 | G2-4 B2-4 G2-4 B2-4 | C3-4 G2-4 C3-8`,
      },
    ],
  },
  field: {
    bpm: 132,
    voices: [
      {
        wave: 'pulse25',
        vol: 0.15,
        notes: `C5-3 G4-1 C5-2 E5-2 G5-4 E5-4 | F5-3 E5-1 D5-2 C5-2 D5-8 | D5-3 A4-1 D5-2 F5-2 A5-4 F5-4 | G5-3 F5-1 E5-2 D5-2 E5-8 |
          C6-3 B5-1 A5-2 G5-2 A5-4 F5-4 | G5-3 F5-1 E5-2 D5-2 E5-4 C5-4 | D5-2 D5-2 E5-2 F5-2 G5-4 B4-4 | C5-8 G4-4 r-4`,
      },
      {
        wave: 'triangle',
        vol: 0.26,
        notes: `${eight('C3', 'C4')} | ${eight('F2', 'F3', 2)} ${eight('G2', 'G3', 2)} | ${eight('D3', 'D4')} | ${eight('G2', 'G3', 2)} ${eight('C3', 'C4', 2)} |
          ${eight('A2', 'A3', 2)} ${eight('F2', 'F3', 2)} | ${eight('C3', 'C4', 2)} ${eight('A2', 'A3', 2)} | ${eight('G2', 'G3')} | ${eight('C3', 'C4', 2)} ${eight('G2', 'G3', 2)}`,
      },
      { wave: 'noise', vol: 0.05, notes: DRUM_MARCH },
    ],
  },
  cave: {
    bpm: 80,
    voices: [
      {
        wave: 'pulse12',
        vol: 0.13,
        notes: `A4-4 C5-4 B4-4 G#4-4 | A4-8 E4-8 | F4-4 A4-4 G#4-4 E4-4 | A4-12 r-4 |
          C5-4 E5-4 D5-4 B4-4 | C5-8 A4-8 | D5-4 C5-4 B4-4 G#4-4 | A4-12 r-4`,
      },
      { wave: 'triangle', vol: 0.3, notes: `A2-16 | A2-16 | F2-16 | E2-16 | A2-16 | A2-16 | D2-8 E2-8 | A2-16` },
      { wave: 'noise', vol: 0.035, notes: 'k-8 r-8' },
    ],
  },
  battle: {
    bpm: 168,
    voices: [
      {
        wave: 'pulse25',
        vol: 0.15,
        notes: `A4-1 B4-1 C5-1 D5-1 E5-4 E5-2 D5-2 C5-2 B4-2 | C5-4 A4-4 E4-4 A4-4 | F4-1 G4-1 A4-1 B4-1 C5-4 C5-2 B4-2 A4-2 G4-2 | A4-4 G#4-4 B4-4 E5-4 |
          A5-4 G5-2 F5-2 E5-4 C5-4 | D5-4 C5-2 B4-2 C5-4 A4-4 | F5-4 E5-2 D5-2 E5-2 D5-2 C5-2 B4-2 | A4-2 E4-2 A4-2 B4-2 C5-2 D5-2 E5-4`,
      },
      {
        wave: 'triangle',
        vol: 0.28,
        notes: `${eight('A2', 'A3')} | ${eight('A2', 'A3')} | ${eight('F2', 'F3')} | ${eight('E2', 'E3')} |
          ${eight('F2', 'F3')} | ${eight('G2', 'G3')} | ${eight('D2', 'D3')} | ${eight('E2', 'E3')}`,
      },
      { wave: 'noise', vol: 0.05, notes: DRUM_BATTLE },
    ],
  },
  boss: {
    bpm: 150,
    voices: [
      {
        wave: 'pulse50',
        vol: 0.13,
        notes: `D5-2 D5-2 r-2 D5-2 F5-4 E5-4 | C#5-2 D5-2 E5-2 C#5-2 A4-8 | D5-2 D5-2 r-2 D5-2 G5-4 F5-4 | E5-2 F5-2 G5-2 E5-2 A5-8 |
          Bb5-4 A5-4 G5-4 F5-4 | E5-2 F5-2 E5-2 D5-2 C#5-8 | D5-2 F5-2 A5-2 D6-2 C6-2 Bb5-2 A5-2 G5-2 | A5-12 r-4`,
      },
      {
        wave: 'triangle',
        vol: 0.3,
        notes: `${eight('D2', 'D3')} | ${eight('A1', 'A2')} | ${eight('D2', 'D3')} | ${eight('C2', 'C3')} |
          ${eight('Bb1', 'Bb2')} | ${eight('A1', 'A2')} | ${eight('D2', 'D3')} | ${eight('A1', 'A2')}`,
      },
      { wave: 'noise', vol: 0.055, notes: DRUM_BATTLE },
    ],
  },
};

const JINGLES: Record<string, TrackDef> = {
  levelup: {
    bpm: 150,
    voices: [
      { wave: 'pulse25', vol: 0.17, notes: 'C5-1 E5-1 G5-1 C6-3 r-1 A5-1 B5-1 C6-7' },
      { wave: 'triangle', vol: 0.28, notes: 'C3-6 r-1 F3-2 G3-7' },
    ],
  },
  victory: {
    bpm: 160,
    voices: [
      { wave: 'pulse25', vol: 0.17, notes: 'G4-1 G4-1 G4-1 C5-5 r-1 A4-2 B4-2 C5-2 E5-8' },
      { wave: 'pulse12', vol: 0.07, notes: 'E4-1 E4-1 E4-1 G4-5 r-1 F4-2 G4-2 G4-2 C5-8' },
      { wave: 'triangle', vol: 0.28, notes: 'C3-8 F2-6 C3-8' },
    ],
  },
  inn: {
    bpm: 100,
    voices: [
      { wave: 'pulse25', vol: 0.15, notes: 'C5-2 E5-2 G5-2 C6-2 B5-2 G5-2 D5-2 G5-2 C6-8' },
      { wave: 'triangle', vol: 0.26, notes: 'C3-8 G2-8 C3-8' },
    ],
  },
  save: {
    bpm: 90,
    voices: [
      { wave: 'pulse25', vol: 0.14, notes: 'E5-2 G5-2 C6-4 B5-2 D6-2 C6-8' },
      { wave: 'pulse12', vol: 0.06, notes: 'C5-4 E5-4 G5-4 E5-8' },
      { wave: 'triangle', vol: 0.24, notes: 'C3-8 G2-4 C3-8' },
    ],
  },
  defeat: {
    bpm: 70,
    voices: [
      { wave: 'pulse25', vol: 0.15, notes: 'A4-3 G#4-3 G4-3 F#4-3 F4-12' },
      { wave: 'triangle', vol: 0.26, notes: 'A2-6 D#2-6 D2-12' },
    ],
  },
  fanfare: {
    bpm: 120,
    voices: [
      { wave: 'pulse25', vol: 0.16, notes: 'C5-2 C5-1 C5-1 G5-4 F5-2 E5-2 F5-2 G5-2 C6-12' },
      { wave: 'pulse12', vol: 0.07, notes: 'E4-2 E4-1 E4-1 C5-4 A4-2 G4-2 A4-2 B4-2 E5-12' },
      { wave: 'triangle', vol: 0.28, notes: 'C3-8 F2-4 G2-4 C3-12' },
    ],
  },
};

interface ParsedVoice {
  wave: Wave;
  vol: number;
  notes: Note[];
  idx: number;
  next: number;
}

class Sound {
  ac: AudioContext | null = null;
  private master!: GainNode;
  private musicBus!: GainNode;
  private sfxBus!: GainNode;
  private waves: Partial<Record<Wave, PeriodicWave>> = {};
  private noiseBuf!: AudioBuffer;
  private timer: number | null = null;
  private voices: ParsedVoice[] = [];
  private step = 0;
  private loopLen = 0;
  private loopStart = 0;
  private loop = true;
  private activeNodes: OscillatorNode[] = [];
  currentBgm = '';
  muted = false;

  unlock(): void {
    if (!this.ac) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ac = new AC();
      this.master = this.ac.createGain();
      this.master.gain.value = this.muted ? 0 : 0.8;
      this.master.connect(this.ac.destination);
      this.musicBus = this.ac.createGain();
      this.musicBus.connect(this.master);
      this.sfxBus = this.ac.createGain();
      this.sfxBus.connect(this.master);
      for (const [name, duty] of [
        ['pulse12', 0.125],
        ['pulse25', 0.25],
        ['pulse50', 0.5],
      ] as [Wave, number][]) {
        this.waves[name] = this.makePulse(duty);
      }
      this.noiseBuf = this.ac.createBuffer(1, this.ac.sampleRate, this.ac.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      // 解除前に予約されていた BGM を鳴らす
      if (this.currentBgm) {
        const name = this.currentBgm;
        this.currentBgm = '';
        this.bgm(name);
      }
    }
    if (this.ac.state === 'suspended') void this.ac.resume();
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.ac) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ac.currentTime, 0.02);
  }

  private makePulse(duty: number): PeriodicWave {
    const n = 32;
    const real = new Float32Array(n);
    const imag = new Float32Array(n);
    for (let i = 1; i < n; i++) {
      real[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * duty);
    }
    return this.ac!.createPeriodicWave(real, imag);
  }

  private osc(wave: Wave | OscillatorType, freq: number, t: number): OscillatorNode {
    const o = this.ac!.createOscillator();
    if (wave === 'pulse12' || wave === 'pulse25' || wave === 'pulse50') o.setPeriodicWave(this.waves[wave]!);
    else o.type = wave as OscillatorType;
    o.frequency.setValueAtTime(freq, t);
    return o;
  }

  private playNote(v: { wave: Wave; vol: number }, m: NoteVal, t: number, dur: number, bus: GainNode): void {
    const ac = this.ac!;
    if (m === null) return;
    if (v.wave === 'noise' || typeof m === 'string') {
      this.drum(m as 'k' | 's' | 'h', t, v.vol, bus);
      return;
    }
    const o = this.osc(v.wave, midiToFreq(m), t);
    const g = ac.createGain();
    const end = t + dur;
    const sustain = v.wave === 'triangle' ? v.vol : v.vol * 0.7;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v.vol, t + 0.006);
    g.gain.linearRampToValueAtTime(sustain, t + 0.06);
    g.gain.setValueAtTime(sustain, Math.max(t + 0.06, end - 0.03));
    g.gain.linearRampToValueAtTime(0, end);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(end + 0.01);
    if (bus === this.musicBus) {
      this.activeNodes.push(o);
      o.onended = () => {
        const i = this.activeNodes.indexOf(o);
        if (i >= 0) this.activeNodes.splice(i, 1);
      };
    }
  }

  private drum(kind: 'k' | 's' | 'h', t: number, vol: number, bus: GainNode): void {
    const ac = this.ac!;
    if (kind === 'k') {
      const o = ac.createOscillator();
      o.type = 'triangle';
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
      const g = ac.createGain();
      g.gain.setValueAtTime(vol * 6, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      o.connect(g).connect(bus);
      o.start(t);
      o.stop(t + 0.16);
      return;
    }
    const src = ac.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ac.createBiquadFilter();
    f.type = kind === 'h' ? 'highpass' : 'bandpass';
    f.frequency.value = kind === 'h' ? 7000 : 1800;
    const g = ac.createGain();
    const len = kind === 'h' ? 0.04 : 0.12;
    g.gain.setValueAtTime(kind === 'h' ? vol * 0.7 : vol * 1.6, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    src.connect(f).connect(g).connect(bus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + len + 0.01);
  }

  // ---------------- BGM ----------------
  bgm(name: string): void {
    if (this.currentBgm === name && this.timer !== null) return;
    this.stopBgm();
    this.currentBgm = name;
    if (!this.ac) return; // 最初の操作後に鳴らす
    this.startTrack(TRACKS[name], true);
  }

  stopBgm(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    // 予約済みの音を止める
    if (this.ac) {
      const now = this.ac.currentTime;
      for (const o of this.activeNodes) {
        try {
          o.stop(now + 0.02);
        } catch {
          /* already stopped */
        }
      }
    }
    this.activeNodes = [];
    this.currentBgm = '';
  }

  private startTrack(track: TrackDef, loop: boolean): void {
    const ac = this.ac!;
    this.step = 60 / track.bpm / 4;
    this.loop = loop;
    this.voices = track.voices.map((v) => ({ wave: v.wave, vol: v.vol, notes: parseNotes(v.notes), idx: 0, next: 0 }));
    this.loopLen = this.voices[0].notes.reduce((s, n) => s + n.d, 0) * this.step;
    this.loopStart = ac.currentTime + 0.06;
    for (const v of this.voices) v.next = this.loopStart;
    const tick = () => this.schedule();
    tick();
    this.timer = window.setInterval(tick, 25);
  }

  private schedule(): void {
    const ac = this.ac!;
    const horizon = ac.currentTime + 0.2;
    for (const v of this.voices) {
      while (v.next < horizon) {
        const loopEnd = this.loopStart + this.loopLen;
        if (v.next >= loopEnd - 1e-6) {
          if (!this.loop) break;
          // 全パートの頭をそろえてループ
          if (this.voices.every((x) => x.next >= loopEnd - 1e-6)) {
            this.loopStart = loopEnd;
            for (const x of this.voices) {
              x.idx = 0;
              x.next = this.loopStart;
            }
          } else break;
        }
        const n = v.notes[v.idx];
        const dur = Math.min(n.d * this.step, loopEnd - v.next);
        this.playNote(v, n.m, v.next, dur * 0.95, this.musicBus);
        v.next += n.d * this.step;
        v.idx = (v.idx + 1) % v.notes.length;
      }
    }
  }

  /** ファンファーレなど。BGM を止めて鳴らし、終わったら resolve */
  jingle(name: string): Promise<void> {
    const track = JINGLES[name];
    this.stopBgm();
    if (!this.ac) return new Promise((r) => setTimeout(r, 600));
    const step = 60 / track.bpm / 4;
    let total = 0;
    const t0 = this.ac.currentTime + 0.05;
    for (const v of track.voices) {
      let t = t0;
      for (const n of parseNotes(v.notes)) {
        this.playNote(v, n.m, t, n.d * step * 0.95, this.musicBus);
        t += n.d * step;
      }
      total = Math.max(total, t - t0);
    }
    return new Promise((r) => setTimeout(r, total * 1000 + 250));
  }

  // ---------------- 効果音 ----------------
  private tone(wave: Wave | OscillatorType, f0: number, f1: number, dur: number, vol: number, delay = 0): void {
    const ac = this.ac!;
    const t = ac.currentTime + delay;
    const o = this.osc(wave, f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.sfxBus);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private noise(dur: number, vol: number, freq: number, delay = 0, type: BiquadFilterType = 'lowpass'): void {
    const ac = this.ac!;
    const t = ac.currentTime + delay;
    const src = ac.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ac.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(this.sfxBus);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  sfx(name: string): void {
    if (!this.ac) return;
    switch (name) {
      case 'cursor':
        this.tone('pulse25', 1320, 1320, 0.04, 0.08);
        break;
      case 'confirm':
        this.tone('pulse25', 880, 880, 0.04, 0.1);
        this.tone('pulse25', 1760, 1760, 0.06, 0.08, 0.04);
        break;
      case 'cancel':
        this.tone('pulse25', 660, 440, 0.08, 0.08);
        break;
      case 'text':
        this.tone('pulse12', 1000, 1000, 0.015, 0.025);
        break;
      case 'bump':
        this.tone('square', 90, 60, 0.08, 0.12);
        break;
      case 'stairs':
        for (let i = 0; i < 4; i++) this.tone('pulse25', 600 - i * 90, 500 - i * 90, 0.06, 0.08, i * 0.07);
        break;
      case 'door':
        this.noise(0.12, 0.2, 900);
        break;
      case 'encounter':
        for (let i = 0; i < 6; i++) this.tone('pulse50', 300 + i * 120, 600 + i * 120, 0.05, 0.08, i * 0.05);
        break;
      case 'attack':
        this.noise(0.12, 0.35, 3000, 0, 'bandpass');
        this.tone('pulse25', 900, 200, 0.12, 0.08);
        break;
      case 'hit':
        this.noise(0.18, 0.45, 1500);
        this.tone('square', 220, 60, 0.15, 0.1);
        break;
      case 'crit':
        this.noise(0.3, 0.5, 4000, 0, 'bandpass');
        for (let i = 0; i < 3; i++) this.tone('pulse25', 1200, 300, 0.1, 0.09, i * 0.06);
        break;
      case 'hurt':
        this.noise(0.25, 0.5, 600);
        this.tone('square', 160, 50, 0.25, 0.14);
        break;
      case 'miss':
        this.tone('pulse25', 500, 900, 0.1, 0.06);
        break;
      case 'spell':
        for (let i = 0; i < 8; i++) this.tone('pulse25', 400 + i * 150, 500 + i * 150, 0.05, 0.06, i * 0.035);
        break;
      case 'fire':
        this.noise(0.5, 0.4, 1200);
        this.tone('sawtooth', 200, 80, 0.4, 0.06);
        break;
      case 'thunder':
        this.noise(0.7, 0.6, 2500);
        this.tone('square', 80, 30, 0.6, 0.15);
        break;
      case 'heal':
        [0, 4, 7, 12, 16].forEach((s, i) => this.tone('pulse25', 523 * Math.pow(2, s / 12), 523 * Math.pow(2, s / 12), 0.12, 0.08, i * 0.06));
        break;
      case 'item':
        this.tone('pulse25', 700, 1400, 0.12, 0.08);
        break;
      case 'buy':
        this.tone('pulse25', 1568, 1568, 0.05, 0.08);
        this.tone('pulse25', 2093, 2093, 0.12, 0.08, 0.06);
        break;
      case 'chest':
        [0, 7, 12].forEach((s, i) => this.tone('pulse25', 659 * Math.pow(2, s / 12), 659 * Math.pow(2, s / 12), 0.1, 0.09, i * 0.08));
        break;
      case 'run':
        for (let i = 0; i < 5; i++) this.tone('pulse25', 800 - i * 100, 700 - i * 100, 0.05, 0.07, i * 0.05);
        break;
      case 'enemyDie':
        this.noise(0.4, 0.3, 2000);
        this.tone('pulse50', 800, 100, 0.4, 0.07);
        break;
      case 'warp':
        for (let i = 0; i < 10; i++) this.tone('pulse25', 300 + i * 100, 300 + i * 100, 0.04, 0.06, i * 0.03);
        break;
    }
  }
}

export const sound = new Sound();
