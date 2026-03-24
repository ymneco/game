/**
 * Learning Test Bot v4 - cause-aware
 * Analyzes WHY it died and takes appropriate countermeasures:
 * - fall: jump earlier at that spot
 * - enemy: jump further back to fly over, or stop and wait
 * - spring: avoid that x zone entirely (jump before it)
 * - object: speed up through that area (don't pause)
 */
interface DeathRecord {
  x: number;
  cause: string; // 'fall' | 'enemy' | 'spring' | 'object'
  count: number;
}

export class TestBot {
  private game: any;
  private stageKey: string;
  private intervalId: number | null = null;
  private deathRecords: Map<number, DeathRecord> = new Map();
  private jumpPoints: Map<number, number> = new Map(); // bucket -> jump hold time
  private avoidZones: Set<number> = new Set(); // zones to jump OVER
  private speedZones: Set<number> = new Set(); // zones to rush through
  private lastX = 0;
  private lastDeaths = 0;
  private maxX = 0;
  private attempts = 0;
  private cd = 0;
  private pauseTimer = 0;
  private moveTimer = 0;
  private log: string[] = [];

  constructor(game: any, stageKey: string) {
    this.game = game;
    this.stageKey = stageKey;
  }

  private press(k: string) { window.dispatchEvent(new KeyboardEvent('keydown', { code: k, bubbles: true })); }
  private release(k: string) { window.dispatchEvent(new KeyboardEvent('keyup', { code: k, bubbles: true })); }
  private tap(k: string, ms: number) { this.press(k); setTimeout(() => this.release(k), ms); }
  private bucket(x: number): number { return Math.floor(x / 40) * 40; }

  private learnFromDeath(scene: any) {
    const cause = scene.lastDeathCause || 'unknown';
    const deathX = scene.lastDeathX || this.lastX;
    const b = this.bucket(deathX);

    const existing = this.deathRecords.get(b);
    if (existing) {
      existing.count++;
    } else {
      this.deathRecords.set(b, { x: deathX, cause, count: 1 });
    }

    const record = this.deathRecords.get(b)!;

    switch (cause) {
      case 'fall':
        // Fell into gap → jump before the gap edge
        // Jump 120px before death point with a long hold
        this.jumpPoints.set(b - 120, 180);
        this.jumpPoints.set(b - 80, 180);
        this.log.push(`#${scene.deaths} FALL@${Math.round(deathX)} → jump@${b - 120}`);
        break;

      case 'enemy':
        // Enemy contact → jump from further away (160px back) to fly OVER
        // If died multiple times, try even further back
        const dist = 120 + record.count * 40;
        this.jumpPoints.set(b - dist, 200);
        this.avoidZones.add(b);
        this.log.push(`#${scene.deaths} ENEMY@${Math.round(deathX)} → jump@${b - dist} (dist=${dist})`);
        break;

      case 'spring':
        // Spring launched → avoid that zone, jump before it
        this.avoidZones.add(b);
        this.avoidZones.add(b - 40);
        this.jumpPoints.set(b - 120, 170);
        this.log.push(`#${scene.deaths} SPRING@${Math.round(deathX)} → avoid+jump@${b - 120}`);
        break;

      case 'object':
        // Falling object → rush through, don't stop
        this.speedZones.add(b);
        this.speedZones.add(b - 40);
        this.speedZones.add(b + 40);
        this.log.push(`#${scene.deaths} OBJECT@${Math.round(deathX)} → speed zone`);
        break;

      default:
        this.jumpPoints.set(b - 80, 150);
        this.log.push(`#${scene.deaths} UNKNOWN@${Math.round(deathX)} → jump@${b - 80}`);
    }
  }

  start() {
    const scene = this.game.scene.getScene(this.stageKey);
    if (scene) this.lastDeaths = scene.deaths || 0;

    this.intervalId = window.setInterval(() => {
      const s = this.game.scene.getScene(this.stageKey);
      if (!s || !s.player || !s.player.body) return;

      // Check clear
      const result = this.game.scene.getScene('Result');
      if (result && result.scene.isActive()) {
        this.stop();
        this.log.push(`CLEARED! deaths=${s.deaths} maxX=${Math.round(this.maxX)}`);
        console.log(`[Bot] CLEARED! deaths=${s.deaths} maxX=${Math.round(this.maxX)}`);
        (window as any).__botResult = {
          cleared: true, deaths: s.deaths, maxX: Math.round(this.maxX),
          log: this.log,
        };
        return;
      }

      const x = s.player.x;
      const y = s.player.y;
      const og = s.player.body.blocked.down || s.player.body.touching.down;

      // Learn from deaths
      if (s.isDead) {
        if (s.deaths > this.lastDeaths) {
          this.learnFromDeath(s);
          this.lastDeaths = s.deaths;
          this.attempts++;
          this.pauseTimer = 20;
        }
        this.release('ArrowRight');
        return;
      }

      // Pause handling
      if (this.pauseTimer > 0) {
        this.pauseTimer--;
        this.release('ArrowRight');
        return;
      }

      this.lastX = x;
      if (x > this.maxX) this.maxX = x;

      this.cd = Math.max(0, this.cd - 1);
      const b = this.bucket(x);

      // In speed zones: don't pause, just run
      const inSpeedZone = this.speedZones.has(b);

      // Periodic pauses (but not in speed zones)
      this.moveTimer++;
      if (!inSpeedZone && this.moveTimer > 90) {
        this.release('ArrowRight');
        this.pauseTimer = 10;
        this.moveTimer = 0;
        return;
      }

      this.press('ArrowRight');
      if (this.cd > 0) return;

      // Check if we need to jump at this position
      const jumpHold = this.jumpPoints.get(b);
      if (og && jumpHold) {
        this.tap('Space', jumpHold);
        this.cd = Math.floor(jumpHold / 10);
      }
    }, 33);

    setTimeout(() => {
      this.stop();
      const s = this.game.scene.getScene(this.stageKey);
      this.log.push(`TIMEOUT maxX=${Math.round(this.maxX)} deaths=${s?.deaths}`);
      (window as any).__botResult = {
        cleared: false, maxX: Math.round(this.maxX), deaths: s?.deaths,
        log: this.log, deathRecords: Object.fromEntries(this.deathRecords),
      };
    }, 180000);
  }

  stop() {
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
    this.release('ArrowRight');
    this.release('Space');
  }
}

(window as any).TestBot = TestBot;
