import { BaseStage2D } from './BaseStage2D';

export class Stage2 extends BaseStage2D {
  constructor() {
    super({ key: 'Stage2' });
    this.config = {
      stageNum: 2,
      stageName: 'Stage 2 - Ruins',
      worldWidth: 5500,
      worldHeight: 600,
      playerStart: { x: 80, y: 400 },
      gravity: 1000,
      bgColor: '#334455',
    };
  }

  init() {
    super.init();
    this.fallingInterval = 3000;
    this.fallingSpeed = 220;
  }

  buildLevel() {
    this.add.rectangle(2750, 300, 5500, 600, 0x222233).setDepth(-2);

    // Ground with gaps
    this.addPlatform(400, 585, 800, 30, 0x554433);
    this.addPlatform(1200, 585, 400, 30, 0x554433);
    this.addPlatform(1800, 585, 400, 30, 0x554433);
    this.addPlatform(2400, 585, 300, 30, 0x554433);
    this.addPlatform(3100, 585, 500, 30, 0x554433);
    this.addPlatform(3800, 585, 300, 30, 0x554433);
    this.addPlatform(4400, 585, 400, 30, 0x554433);
    this.addPlatform(5100, 585, 600, 30, 0x554433);

    // === SECTION 1: Stairs look safe ===
    this.addPlatform(450, 470, 80, 20, 0x665544);
    this.addPlatform(580, 390, 80, 20, 0x665544);
    // TROLL: Third step is a trap platform
    this.addTrapPlatform(700, 310, 80, 16);
    this.addPlatform(700, 390, 60, 20, 0x665544); // Real path is lower
    this.addPlatform(850, 260, 100, 20, 0x665544);

    // TROLL: Spring trap at top of stairs
    this.addFakeSpring(900, 240);
    this.addTrollMessage(900, 180, 'Boing! ...oh.');

    // Real jump path
    this.addPlatform(1050, 350, 80, 20, 0x665544);
    this.addPlatform(1200, 420, 100, 20, 0x665544);

    // === SECTION 2: Crumbling gauntlet ===
    this.addCrumblingPlatform(1500, 450, 70, 16);
    this.addCrumblingPlatform(1620, 400, 70, 16);
    // TROLL: One stable-looking platform in the sequence is fake
    this.addTrapPlatform(1740, 350, 70, 16);
    this.addCrumblingPlatform(1860, 300, 70, 16);
    // Hidden block saves you if you fall from the trap
    this.addHiddenBlock(1740, 450, 60, 16);

    // Moving platforms
    this.addMovingPlatform(2100, 400, 2400, 80, 16, 50);

    // === SECTION 3: The corridor of lies ===
    this.addPlatform(2500, 350, 120, 20, 0x665544);

    // TROLL: Arrow sign points right, but the path is actually left (hidden block above)
    this.add.triangle(2620, 340, 0, 15, 30, 0, 30, 30, 0x44ff44).setDepth(1);
    this.addHiddenBlock(2450, 280, 60, 16); // Hidden upper path

    // Continue right (the "wrong" way has a fake goal)
    this.addPlatform(2700, 350, 80, 20, 0x665544);
    this.addFakeGoal(2900, 540);
    this.addTrollMessage(2950, 450, 'Nope! The arrow lied.');

    // The real path (from hidden block above) continues upper route
    this.addPlatform(2550, 220, 100, 20, 0x665544);
    this.addPlatform(2750, 180, 80, 20, 0x665544);
    this.addPlatform(2950, 220, 100, 20, 0x665544);

    // Drop back down to ground
    this.addPlatform(3100, 350, 100, 20, 0x665544);

    // === SECTION 4: Strong enemy zone ===
    // Mirror enemy blocks the corridor
    this.addMirrorEnemy(3300, 560);
    this.addTrollMessage(3250, 400, 'This one learns your moves...');

    // Normal enemies as distraction
    this.addWeakEnemy(3500, 560, 100, 60);
    this.addWeakEnemy(3700, 560, 80, 50);

    // Strong enemy patrols
    this.addStrongEnemy(3600, 530, (enemy, time) => {
      enemy.x = (enemy as any)._startX + Math.sin(time / 600) * 120;
    });

    // === SECTION 5: Final approach ===
    this.addPlatform(4000, 450, 80, 20, 0x665544);
    this.addMovingPlatform(4200, 350, 4500, 70, 14, 60);

    // TROLL: Falling objects rain intensifies near the end
    this.addPlatform(4500, 400, 100, 20, 0x665544);
    this.addPlatform(4700, 350, 80, 20, 0x665544);

    // Gravity zone before final platform
    this.addGravityZone(4850, 500, 80, 120);

    this.addPlatform(4950, 450, 100, 20, 0x665544);

    // Real goal
    this.setGoal(5200, 540, 40, 60);

    // Weak enemies scattered
    this.addWeakEnemy(300, 560, 150, 50);
    this.addWeakEnemy(1100, 560, 80, 70);
    this.addWeakEnemy(4400, 560, 80, 60);

    // Safe zones
    this.safeZones = [80, 600, 1200, 1800, 2400, 3000, 3600, 4200, 4800, 5100];

    // Torches
    for (let i = 0; i < 18; i++) {
      const tx = 300 + i * 290;
      this.add.rectangle(tx, 100, 8, 30, 0x664422).setDepth(-1);
      this.add.circle(tx, 82, 8, 0xff6600).setDepth(-1).setAlpha(0.8);
    }
  }
}
