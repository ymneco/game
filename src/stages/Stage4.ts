import { BaseStage2D } from './BaseStage2D';
import Phaser from 'phaser';

export class Stage4 extends BaseStage2D {
  private scrollZoneActive = false;
  private scrollWall!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'Stage4' });
    this.config = {
      stageNum: 4,
      stageName: 'Stage 4 - Lava Castle',
      worldWidth: 8000,
      worldHeight: 600,
      playerStart: { x: 80, y: 400 },
      gravity: 1000,
      bgColor: '#331111',
    };
  }

  init() {
    super.init();
    this.fallingInterval = 2000;
    this.fallingSpeed = 300;
    this.scrollZoneActive = false;
  }

  buildLevel() {
    // Lava bg
    this.add.rectangle(4000, 590, 8000, 20, 0xff4400).setDepth(-1);
    this.add.rectangle(4000, 300, 8000, 600, 0x220000).setDepth(-2);

    // Ground sections (with many gaps for lava death)
    this.addPlatform(300, 570, 600, 20, 0x553333);
    this.addPlatform(1000, 570, 300, 20, 0x553333);
    this.addPlatform(1600, 570, 400, 20, 0x553333);
    this.addPlatform(2200, 570, 200, 20, 0x553333);
    this.addPlatform(2800, 570, 300, 20, 0x553333);
    this.addPlatform(3500, 570, 200, 20, 0x553333);
    this.addPlatform(4200, 570, 300, 20, 0x553333);
    this.addPlatform(5000, 570, 400, 20, 0x553333);
    this.addPlatform(5800, 570, 200, 20, 0x553333);
    this.addPlatform(6500, 570, 300, 20, 0x553333);
    this.addPlatform(7200, 570, 400, 20, 0x553333);
    this.addPlatform(7800, 570, 400, 20, 0x553333);

    // Narrow platforms - player width * 2-3
    const narrow = 70;
    // Section 1: zigzag narrow platforms
    this.addPlatform(700, 470, narrow, 16, 0x664444);
    this.addPlatform(850, 390, narrow, 16, 0x664444);
    this.addPlatform(950, 310, narrow, 16, 0x664444);
    this.addPlatform(1100, 250, narrow, 16, 0x664444);

    // Crumbling madness
    this.addCrumblingPlatform(1350, 450, 60, 14);
    this.addCrumblingPlatform(1450, 380, 60, 14);
    this.addCrumblingPlatform(1550, 310, 60, 14);
    this.addCrumblingPlatform(1650, 380, 60, 14);
    this.addCrumblingPlatform(1750, 450, 60, 14);
    this.addCrumblingPlatform(1850, 380, 60, 14);
    this.addCrumblingPlatform(1950, 310, 60, 14);

    // Stacked crumbling
    this.addCrumblingPlatform(2100, 450, 60, 14);
    this.addCrumblingPlatform(2100, 350, 60, 14);
    this.addCrumblingPlatform(2100, 250, 60, 14);

    // Section 2: tight jumps
    this.addPlatform(2400, 400, narrow, 16, 0x664444);
    this.addPlatform(2530, 330, narrow, 16, 0x664444);
    this.addPlatform(2650, 260, narrow, 16, 0x664444);

    // Moving platforms over gaps
    this.addMovingPlatform(2900, 350, 3200, 60, 14, 80);
    this.addMovingPlatform(3300, 300, 3600, 60, 14, 70);

    // More crumbling
    this.addCrumblingPlatform(3700, 400, 60, 14);
    this.addCrumblingPlatform(3800, 350, 60, 14);
    this.addCrumblingPlatform(3900, 300, 60, 14);
    this.addCrumblingPlatform(4000, 250, 60, 14);

    // Section 3: steep platforms
    this.addPlatform(4300, 450, narrow, 16, 0x664444);
    this.addPlatform(4400, 380, narrow, 16, 0x664444);
    this.addPlatform(4500, 310, narrow, 16, 0x664444);
    this.addPlatform(4600, 240, narrow, 16, 0x664444);
    this.addPlatform(4700, 310, narrow, 16, 0x664444);
    this.addPlatform(4800, 380, narrow, 16, 0x664444);
    this.addPlatform(4900, 450, narrow, 16, 0x664444);

    // Forced scroll section (5200-5800)
    this.scrollWall = this.add.rectangle(5100, 300, 40, 600, 0xff0000, 0.3);
    this.physics.add.existing(this.scrollWall, false);
    const swBody = this.scrollWall.body as Phaser.Physics.Arcade.Body;
    swBody.setAllowGravity(false);
    swBody.setImmovable(true);

    this.addPlatform(5200, 500, narrow, 16, 0x664444);
    this.addPlatform(5320, 420, narrow, 16, 0x664444);
    this.addPlatform(5440, 340, narrow, 16, 0x664444);
    this.addPlatform(5560, 420, narrow, 16, 0x664444);
    this.addPlatform(5680, 500, narrow, 16, 0x664444);

    // Post-scroll section
    this.addPlatform(6000, 450, 100, 16, 0x664444);
    this.addPlatform(6200, 380, narrow, 16, 0x664444);

    // More crumbling
    this.addCrumblingPlatform(6400, 350, 60, 14);
    this.addCrumblingPlatform(6550, 300, 60, 14);
    this.addCrumblingPlatform(6700, 350, 60, 14);

    // Final approach
    this.addPlatform(6900, 400, 100, 16, 0x664444);
    this.addPlatform(7100, 350, narrow, 16, 0x664444);
    this.addPlatform(7300, 400, 100, 16, 0x664444);

    // 8 weak enemies with nasty placement
    this.addWeakEnemy(400, 545, 100, 60);
    this.addWeakEnemy(1050, 545, 80, 70);
    this.addWeakEnemy(1700, 545, 100, 50);
    this.addWeakEnemy(2300, 545, 60, 80);
    this.addWeakEnemy(2900, 545, 80, 60);
    this.addWeakEnemy(4400, 545, 60, 90);
    this.addWeakEnemy(5000, 545, 80, 70);
    this.addWeakEnemy(7300, 545, 100, 60);

    // Safe zones
    this.safeZones = [80, 500, 1200, 1800, 2400, 3000, 4000, 5000, 6000, 7000, 7700];

    // Lava particles decoration
    for (let i = 0; i < 30; i++) {
      const lx = Math.random() * 8000;
      const ly = 570 + Math.random() * 20;
      this.add.circle(lx, ly, 3 + Math.random() * 5, 0xff6600, 0.6).setDepth(-1);
    }

    // Goal
    this.setGoal(7700, 520, 40, 60);
  }

  update(time: number, delta: number) {
    super.update(time, delta);

    // Forced scroll section
    if (this.player.x > 5100 && this.player.x < 5800) {
      if (!this.scrollZoneActive) {
        this.scrollZoneActive = true;
        (this.scrollWall.body as Phaser.Physics.Arcade.Body).setVelocityX(100);
      }
    }

    if (this.scrollZoneActive && this.scrollWall.x < 5800) {
      // If player is behind the wall, die
      this.physics.add.overlap(this.player, this.scrollWall, () => {
        if (!this.isDead) this.die();
      });
    }

    if (this.scrollWall.x >= 5800) {
      this.scrollZoneActive = false;
      (this.scrollWall.body as Phaser.Physics.Arcade.Body).setVelocityX(0);
    }
  }
}
