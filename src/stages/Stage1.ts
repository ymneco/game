import { BaseStage2D } from './BaseStage2D';

export class Stage1 extends BaseStage2D {
  constructor() {
    super({ key: 'Stage1' });
    this.config = {
      stageNum: 1,
      stageName: 'Stage 1 - Grassland',
      worldWidth: 3000,
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
    // Sky gradient bg
    this.add.rectangle(1500, 500, 3000, 200, 0x66aa44).setDepth(-1); // Grass bg

    // Ground segments with gaps
    this.addPlatform(350, 585, 700, 30, 0x558833);     // 0-700
    this.addPlatform(950, 585, 60, 30, 0x558833);      // small island in gap
    this.addPlatform(1350, 585, 500, 30, 0x558833);    // 1100-1600
    this.addPlatform(2050, 585, 600, 30, 0x558833);    // 1750-2350
    this.addPlatform(2700, 585, 400, 30, 0x558833);    // 2500-2900

    // Simple platforms / steps
    this.addPlatform(300, 480, 120, 20, 0x77bb55);
    this.addPlatform(500, 400, 100, 20, 0x77bb55);
    this.addPlatform(720, 350, 80, 20, 0x77bb55);
    this.addPlatform(830, 450, 80, 20, 0x77bb55);

    // More platforms after gap
    this.addPlatform(1100, 450, 120, 20, 0x77bb55);
    this.addPlatform(1300, 380, 100, 20, 0x77bb55);

    // Crumbling platforms (bridge over gap)
    this.addCrumblingPlatform(1650, 450, 80, 16);
    this.addCrumblingPlatform(1800, 400, 80, 16);

    // After crumbling section
    this.addPlatform(1950, 480, 120, 20, 0x77bb55);
    this.addPlatform(2150, 420, 100, 20, 0x77bb55);
    this.addPlatform(2350, 480, 120, 20, 0x77bb55);

    // Enemies
    this.addWeakEnemy(600, 560, 100, 50);
    this.addWeakEnemy(1200, 560, 80, 40);
    this.addWeakEnemy(2200, 560, 120, 60);

    // Safe zones for falling objects
    this.safeZones = [80, 500, 950, 1500, 2000, 2600];

    // Goal
    this.setGoal(2800, 540, 40, 60);

    // Decorations - clouds
    for (let i = 0; i < 8; i++) {
      this.add.ellipse(
        200 + i * 350,
        60 + Math.random() * 80,
        80 + Math.random() * 40,
        30 + Math.random() * 20,
        0xffffff,
        0.7
      ).setDepth(-1);
    }

    // Trees
    for (let i = 0; i < 10; i++) {
      const tx = 150 + i * 280;
      this.add.rectangle(tx, 540, 16, 60, 0x664422).setDepth(-1);
      this.add.circle(tx, 500, 25, 0x338833).setDepth(-1);
    }
  }
}
