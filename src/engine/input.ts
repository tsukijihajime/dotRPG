// キーボード・タッチ入力をまとめて「アクション」に変換する

export type Action = 'up' | 'down' | 'left' | 'right' | 'a' | 'b';
const ACTIONS: Action[] = ['up', 'down', 'left', 'right', 'a', 'b'];

const KEYMAP: Record<string, Action> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
  KeyZ: 'a',
  Enter: 'a',
  Space: 'a',
  KeyX: 'b',
  Escape: 'b',
  Backspace: 'b',
};

const REPEAT_DELAY = 16;
const REPEAT_RATE = 5;

class Input {
  private keys = new Set<Action>();
  private touch = new Set<Action>();
  private prev = new Set<Action>();
  private pressedNow = new Set<Action>();
  private hold = new Map<Action, number>();
  private listeners: (() => void)[] = [];

  /** 最初の操作時に呼ばれる（AudioContext の解除用） */
  onFirstInteraction(fn: () => void): void {
    this.listeners.push(fn);
  }

  private interacted(): void {
    for (const fn of this.listeners) fn();
  }

  init(): void {
    window.addEventListener('keydown', (e) => {
      const a = KEYMAP[e.code];
      if (a) {
        e.preventDefault();
        this.keys.add(a);
      }
      this.interacted();
    });
    window.addEventListener('keyup', (e) => {
      const a = KEYMAP[e.code];
      if (a) this.keys.delete(a);
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.touch.clear();
    });
    this.initTouch();
  }

  private initTouch(): void {
    // 十字キー：指をスライドしても方向が変わるようにパッド全体で判定
    const dpad = document.getElementById('dpad');
    const btns = Array.from(document.querySelectorAll<HTMLElement>('.dpad-btn'));
    if (dpad) {
      let pid: number | null = null;
      const setDir = (e: PointerEvent | null) => {
        for (const d of ['up', 'down', 'left', 'right'] as Action[]) this.touch.delete(d);
        btns.forEach((b) => b.classList.remove('active'));
        if (!e) return;
        const r = dpad.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        if (Math.hypot(dx, dy) < 12) return;
        const dir: Action = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
        this.touch.add(dir);
        btns.find((b) => b.dataset.dir === dir)?.classList.add('active');
      };
      dpad.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        pid = e.pointerId;
        dpad.setPointerCapture(e.pointerId);
        setDir(e);
        this.interacted();
      });
      dpad.addEventListener('pointermove', (e) => {
        if (e.pointerId === pid) setDir(e);
      });
      const end = (e: PointerEvent) => {
        if (e.pointerId === pid) {
          pid = null;
          setDir(null);
        }
      };
      dpad.addEventListener('pointerup', end);
      dpad.addEventListener('pointercancel', end);
    }

    document.querySelectorAll<HTMLElement>('.round-btn').forEach((btn) => {
      const act = btn.dataset.act as Action;
      const up = () => {
        this.touch.delete(act);
        btn.classList.remove('active');
      };
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        btn.setPointerCapture(e.pointerId);
        this.touch.add(act);
        btn.classList.add('active');
        this.interacted();
      });
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', up);
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
    });
  }

  /** 毎フレーム最初に呼ぶ */
  update(): void {
    this.pressedNow.clear();
    for (const a of ACTIONS) {
      const down = this.keys.has(a) || this.touch.has(a);
      if (down) {
        if (!this.prev.has(a)) this.pressedNow.add(a);
        this.hold.set(a, (this.hold.get(a) ?? 0) + 1);
        this.prev.add(a);
      } else {
        this.hold.set(a, 0);
        this.prev.delete(a);
      }
    }
  }

  isDown(a: Action): boolean {
    return this.prev.has(a);
  }

  pressed(a: Action): boolean {
    return this.pressedNow.has(a);
  }

  /** 押した瞬間＋長押し時のリピート */
  repeat(a: Action): boolean {
    if (this.pressedNow.has(a)) return true;
    const h = this.hold.get(a) ?? 0;
    return h > REPEAT_DELAY && (h - REPEAT_DELAY) % REPEAT_RATE === 0;
  }

  /** このフレームの押下を使い切る（同じ入力で二重に反応しないように） */
  consume(): void {
    this.pressedNow.clear();
  }
}

export const input = new Input();
