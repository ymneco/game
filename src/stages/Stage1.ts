import { BaseStage2D } from './BaseStage2D';

export class Stage1 extends BaseStage2D {
  constructor() {
    super({ key: 'Stage1' });
    this.config = {
      stageNum: 1,
      stageName: 'Stage 1 - Grassland',
      worldWidth: 3200,
      worldHeight: 600,
      playerStart: { x: 80, y: 400 },
      gravity: 1000,
      bgColor: '#88ccff',
    };
  }

  init() {
    super.init();
    this.fallingInterval = 5000;
    this.fallingSpeed = 150;
  }

  buildLevel() {
    this.add.rectangle(1600, 500, 3200, 200, 0x66aa44).setDepth(-1);

    // Ground segments
    this.addPlatform(400, 585, 800, 30, 0x558833);     // 0-800
    this.addPlatform(1200, 585, 500, 30, 0x558833);     // 950-1450
    this.addPlatform(1850, 585, 500, 30, 0x558833);     // 1600-2100
    this.addPlatform(2450, 585, 400, 30, 0x558833);     // 2250-2650
    this.addPlatform(2950, 585, 400, 30, 0x558833);     // 2750-3150

    // --- SECTION 1: Looks normal ---
    this.addPlatform(300, 480, 120, 20, 0x77bb55);
    this.addPlatform(500, 400, 100, 20, 0x77bb55);

    // TROLL 1: Trap platform - looks solid, falls instantly
    this.addTrapPlatform(700, 350, 80, 16);

    // TROLL 2: Fake spring near gap edge. Stepping on it = death by launch.
    // Correct: jump OVER the spring from before it, land on ground segment 2
    this.addFakeSpring(780, 567);
    this.addTrollMessage(780, 400, 'That spring looked safe, right?');

    // Stepping stones across gap (usable without spring, tight jumps)
    this.addPlatform(870, 530, 50, 14, 0x77bb55);
    this.addPlatform(940, 500, 50, 14, 0x77bb55);

    // TROLL: Hidden block above gap - if you jump from the edge (x~800),
    // you hit this and lose upward momentum, falling into the gap.
    // Correct: jump earlier (x~750) or later to avoid the block's position
    this.addHiddenBlock(830, 480, 40, 16);

    // --- SECTION 2: Getting trickier ---
    // TROLL: Hidden block above the platform - careless jump = bonk + fall
    this.addHiddenBlock(1100, 390, 40, 16);
    this.addPlatform(1100, 450, 100, 20, 0x77bb55);
    this.addWeakEnemy(1200, 560, 100, 40);

    // TROLL 3: Mirror enemy - jumps when you jump nearby.
    // Correct: jump from far away (>120px) to fly overhead
    this.addMirrorEnemy(1400, 560);
    this.addTrollMessage(1350, 400, 'Try jumping over this one...');

    // Crumbling platforms
    this.addCrumblingPlatform(1550, 450, 80, 16);
    this.addCrumblingPlatform(1700, 400, 80, 16);

    // --- SECTION 3: The fake goal ---
    this.addPlatform(1950, 480, 120, 20, 0x77bb55);
    this.addPlatform(2150, 420, 100, 20, 0x77bb55);

    // TROLL 4: Fake goal - looks exactly like the real one
    this.addFakeGoal(2400, 540);
    this.addTrollMessage(2450, 450, 'Did you really think it was that easy?');

    // --- SECTION 4: Real ending ---
    this.addPlatform(2700, 480, 100, 20, 0x77bb55);

    // TROLL 5: Gravity zone - unexpected upward launch
    this.addGravityZone(2800, 500, 60, 100);

    this.addPlatform(2900, 380, 80, 20, 0x77bb55);
    this.addPlatform(3000, 480, 100, 20, 0x77bb55);

    // Real goal
    this.setGoal(3100, 540, 40, 60);

    // Enemies
    this.addWeakEnemy(400, 560, 150, 50);
    this.addWeakEnemy(2300, 560, 80, 60);

    // Safe zones
    this.safeZones = [80, 500, 950, 1500, 2000, 2600, 3050];

    // Decorations
    for (let i = 0; i < 10; i++) {
      this.add.ellipse(200 + i * 300, 60 + Math.random() * 80, 80 + Math.random() * 40, 30 + Math.random() * 20, 0xffffff, 0.7).setDepth(-1);
    }
    for (let i = 0; i < 12; i++) {
      const tx = 100 + i * 260;
      this.add.rectangle(tx, 540, 16, 60, 0x664422).setDepth(-1);
      this.add.circle(tx, 500, 25, 0x338833).setDepth(-1);
    }
  }
}
