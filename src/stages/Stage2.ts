import { BaseStage2D } from './BaseStage2D';

export class Stage2 extends BaseStage2D {
  constructor() {
    super({ key: 'Stage2' });
    this.config = {
      stageNum: 2,
      stageName: 'Stage 2 - Ruins',
      worldWidth: 5000,
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
    // Dark dungeon background
    this.add.rectangle(2500, 300, 5000, 600, 0x222233).setDepth(-2);

    // Ground (with gaps)
    this.addPlatform(400, 585, 800, 30, 0x554433);
    this.addPlatform(1200, 585, 400, 30, 0x554433);
    this.addPlatform(1800, 585, 600, 30, 0x554433);
    this.addPlatform(2600, 585, 400, 30, 0x554433);
    this.addPlatform(3200, 585, 500, 30, 0x554433);
    this.addPlatform(3900, 585, 400, 30, 0x554433);
    this.addPlatform(4500, 585, 600, 30, 0x554433);

    // Stepped platforms - cliff section
    this.addPlatform(450, 470, 80, 20, 0x665544);
    this.addPlatform(580, 390, 80, 20, 0x665544);
    this.addPlatform(700, 310, 80, 20, 0x665544);
    this.addPlatform(850, 260, 100, 20, 0x665544);

    // Jump to next section
    this.addPlatform(1050, 350, 80, 20, 0x665544);
    this.addPlatform(1200, 420, 100, 20, 0x665544);

    // Crumbling platforms in sequence
    this.addCrumblingPlatform(1500, 450, 70, 16);
    this.addCrumblingPlatform(1620, 400, 70, 16);
    this.addCrumblingPlatform(1740, 350, 70, 16);
    this.addCrumblingPlatform(1860, 300, 70, 16);
    this.addCrumblingPlatform(1980, 350, 70, 16);

    // Moving platforms
    this.addMovingPlatform(2200, 400, 2500, 80, 16, 50);
    this.addMovingPlatform(2700, 350, 3000, 80, 16, 60);

    // More platforms
    this.addPlatform(3100, 300, 100, 20, 0x665544);
    this.addPlatform(3300, 400, 80, 20, 0x665544);
    this.addPlatform(3500, 350, 80, 20, 0x665544);

    // Upper route
    this.addPlatform(3700, 250, 120, 20, 0x665544);
    this.addPlatform(3900, 300, 100, 20, 0x665544);

    // Final section
    this.addPlatform(4200, 400, 100, 20, 0x665544);
    this.addPlatform(4400, 350, 80, 20, 0x665544);

    // Weak enemies
    this.addWeakEnemy(300, 560, 150, 50);
    this.addWeakEnemy(900, 560, 100, 70);
    this.addWeakEnemy(1800, 560, 100, 40);
    this.addWeakEnemy(2600, 560, 120, 80);
    this.addWeakEnemy(3300, 560, 100, 60);
    this.addWeakEnemy(4300, 560, 80, 50);

    // Strong enemy - blocks a corridor
    this.addStrongEnemy(3000, 530, (enemy, time) => {
      enemy.x = (enemy as any)._startX + Math.sin(time / 800) * 100;
    });

    // Safe zones
    this.safeZones = [80, 600, 1200, 1800, 2400, 3000, 3600, 4200, 4700];

    // Brick decorations
    for (let i = 0; i < 25; i++) {
      this.add.rectangle(
        200 * i, 20, 5000, 40, 0x443322
      ).setDepth(-1).setAlpha(0.3);
    }

    // Torches (decorative)
    for (let i = 0; i < 15; i++) {
      const tx = 300 + i * 320;
      this.add.rectangle(tx, 100, 8, 30, 0x664422).setDepth(-1);
      this.add.circle(tx, 82, 8, 0xff6600).setDepth(-1).setAlpha(0.8);
    }

    // Goal
    this.setGoal(4750, 540, 40, 60);
  }
}
