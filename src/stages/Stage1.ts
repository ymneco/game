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
    // Sky / grass background
    this.add.rectangle(1600, 500, 3200, 200, 0x66aa44).setDepth(-1);

    // === SECTION 1: Looks normal... ===
    // Ground segments
    this.addPlatform(350, 585, 700, 30, 0x558833);    // 0-700
    this.addPlatform(1100, 585, 400, 30, 0x558833);   // 900-1300
    this.addPlatform(1700, 585, 500, 30, 0x558833);   // 1450-1950
    this.addPlatform(2300, 585, 400, 30, 0x558833);   // 2100-2500
    this.addPlatform(2850, 585, 500, 30, 0x558833);   // 2600-3100

    // Normal looking platforms
    this.addPlatform(300, 480, 120, 20, 0x77bb55);
    this.addPlatform(500, 400, 100, 20, 0x77bb55);

    // TROLL 1: This platform looks normal but is a trap - falls instantly
    this.addTrapPlatform(700, 350, 80, 16);
    // The real path is to jump OVER this platform
    this.addPlatform(830, 450, 80, 20, 0x77bb55);

    // TROLL 2: Fake spring at edge of ground - looks helpful to cross the gap
    this.addFakeSpring(680, 567);
    // The real way: use platform at 830, then hidden block at x=950
    this.addHiddenBlock(950, 500, 50, 16);
    this.addTrollMessage(680, 400, 'That spring looked safe, right?');

    // === SECTION 2: Getting trickier ===
    this.addPlatform(1100, 450, 100, 20, 0x77bb55);

    // Normal enemy - stomp to proceed
    this.addWeakEnemy(1200, 560, 80, 40);

    // TROLL 3: Enemy that looks weak but is actually a mirror enemy
    // It jumps when YOU jump, so you can't dodge by jumping
    this.addMirrorEnemy(1550, 560);
    this.addTrollMessage(1500, 400, 'Try jumping over this one...');
    // The trick: you need to NOT jump and run under while it's on ground
    // Or approach slowly and bait its jump, then run under

    // Crumbling platforms over gap
    this.addCrumblingPlatform(1500, 450, 80, 16);
    this.addCrumblingPlatform(1650, 400, 80, 16);

    // === SECTION 3: The fake goal ===
    this.addPlatform(1900, 480, 120, 20, 0x77bb55);
    this.addPlatform(2100, 420, 100, 20, 0x77bb55);

    // TROLL 4: FAKE GOAL - looks exactly like the real one
    this.addFakeGoal(2350, 540);
    this.addTrollMessage(2400, 450, 'Did you really think it was that easy?');

    // Real goal is further ahead, past more traps
    // After fake goal death, player learns to be suspicious

    // === SECTION 4: Real ending ===
    this.addPlatform(2600, 480, 100, 20, 0x77bb55);

    // TROLL 5: Gravity zone - get launched up unexpectedly
    this.addGravityZone(2700, 500, 60, 100);

    // Normal platforms to real goal
    this.addPlatform(2800, 380, 80, 20, 0x77bb55);
    this.addPlatform(2950, 450, 100, 20, 0x77bb55);

    // Real goal (further than expected)
    this.setGoal(3050, 540, 40, 60);

    // Enemies
    this.addWeakEnemy(600, 560, 100, 50);
    this.addWeakEnemy(2200, 560, 80, 60);

    // Safe zones for falling objects
    this.safeZones = [80, 500, 950, 1500, 2000, 2600, 3000];

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
