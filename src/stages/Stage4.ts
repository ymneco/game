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
      worldWidth: 8500,
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
    this.add.rectangle(4250, 590, 8500, 20, 0xff4400).setDepth(-1);
    this.add.rectangle(4250, 300, 8500, 600, 0x220000).setDepth(-2);

    const narrow = 70;

    // Ground sections
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
    this.addPlatform(8000, 570, 600, 20, 0x553333);

    // === SECTION 1: Looks like a normal hard stage ===
    this.addPlatform(700, 470, narrow, 16, 0x664444);
    this.addPlatform(850, 390, narrow, 16, 0x664444);

    // TROLL: Platform that looks solid but is a trap
    this.addTrapPlatform(950, 310, narrow, 16);
    this.addPlatform(1050, 370, narrow, 16, 0x664444);
    this.addTrollMessage(950, 250, 'Lava floor accepts all');

    // TROLL: Two fake springs in a row
    this.addFakeSpring(1150, 550);
    this.addTrollMessage(1150, 480, 'BOING!');

    // Crumbling madness
    this.addCrumblingPlatform(1350, 450, 60, 14);
    this.addCrumblingPlatform(1450, 380, 60, 14);
    this.addCrumblingPlatform(1550, 310, 60, 14);
    this.addCrumblingPlatform(1650, 380, 60, 14);
    this.addCrumblingPlatform(1750, 450, 60, 14);

    // === SECTION 2: Mirror enemy gauntlet ===
    this.addMirrorEnemy(2000, 545);
    this.addMirrorEnemy(2150, 545);
    this.addTrollMessage(1950, 400, 'They learn. You die.');

    // Stacked crumbling
    this.addCrumblingPlatform(2100, 450, 60, 14);
    this.addCrumblingPlatform(2100, 350, 60, 14);
    this.addCrumblingPlatform(2100, 250, 60, 14);

    // === SECTION 3: Tight jumps with hidden blocks ===
    this.addPlatform(2400, 400, narrow, 16, 0x664444);
    // Hidden block stops your jump mid-air
    this.addHiddenBlock(2500, 320, 40, 16);
    this.addPlatform(2530, 400, narrow, 16, 0x664444);
    this.addPlatform(2650, 340, narrow, 16, 0x664444);

    // Moving platforms over lava
    this.addMovingPlatform(2900, 350, 3200, 60, 14, 80);
    this.addMovingPlatform(3300, 300, 3600, 60, 14, 70);

    // TROLL: Fake goal in lava castle theme
    this.addFakeGoal(3700, 520);
    this.addTrollMessage(3750, 400, 'The real castle is in another section');

    // More crumbling
    this.addCrumblingPlatform(3800, 400, 60, 14);
    this.addCrumblingPlatform(3900, 350, 60, 14);
    this.addCrumblingPlatform(4000, 300, 60, 14);
    this.addCrumblingPlatform(4100, 250, 60, 14);

    // === SECTION 4: Gravity zones + narrow platforms ===
    this.addPlatform(4300, 450, narrow, 16, 0x664444);
    this.addGravityZone(4400, 400, 60, 120);
    this.addPlatform(4500, 300, narrow, 16, 0x664444);
    this.addPlatform(4600, 380, narrow, 16, 0x664444);
    this.addPlatform(4700, 300, narrow, 16, 0x664444);

    // === SECTION 5: Forced scroll ===
    this.scrollWall = this.add.rectangle(4900, 300, 40, 600, 0xff0000, 0.3);
    this.physics.add.existing(this.scrollWall, false);
    const swBody = this.scrollWall.body as Phaser.Physics.Arcade.Body;
    swBody.setAllowGravity(false);
    swBody.setImmovable(true);

    this.addPlatform(5000, 500, narrow, 16, 0x664444);
    this.addPlatform(5120, 420, narrow, 16, 0x664444);
    this.addPlatform(5240, 340, narrow, 16, 0x664444);
    this.addPlatform(5360, 420, narrow, 16, 0x664444);
    this.addPlatform(5480, 500, narrow, 16, 0x664444);
    this.addPlatform(5600, 420, narrow, 16, 0x664444);

    // === SECTION 6: Final gauntlet ===
    this.addPlatform(6000, 450, 100, 16, 0x664444);
    this.addPlatform(6200, 380, narrow, 16, 0x664444);

    // TROLL: Three trap platforms in a row disguised as the final path
    this.addTrapPlatform(6400, 350, 60, 14);
    this.addTrapPlatform(6550, 300, 60, 14);
    // The safe one
    this.addPlatform(6700, 350, 80, 16, 0x664444);

    // Hidden block as the actual bridge
    this.addHiddenBlock(6450, 430, 50, 14);
    this.addHiddenBlock(6580, 400, 50, 14);

    this.addPlatform(6900, 400, 100, 16, 0x664444);
    this.addPlatform(7100, 350, narrow, 16, 0x664444);
    this.addPlatform(7300, 400, 100, 16, 0x664444);

    // Weak enemies
    this.addWeakEnemy(400, 545, 100, 60);
    this.addWeakEnemy(1050, 545, 80, 70);
    this.addWeakEnemy(1700, 545, 100, 50);
    this.addWeakEnemy(2800, 545, 80, 60);
    this.addWeakEnemy(5000, 545, 80, 70);
    this.addWeakEnemy(6800, 545, 100, 60);
    this.addWeakEnemy(7500, 545, 80, 50);
    this.addWeakEnemy(7800, 545, 60, 80);

    // Safe zones
    this.safeZones = [80, 500, 1200, 1800, 2400, 3000, 4000, 5000, 6000, 7000, 7700, 8200];

    // Lava particles
    for (let i = 0; i < 40; i++) {
      this.add.circle(Math.random() * 8500, 570 + Math.random() * 20, 3 + Math.random() * 5, 0xff6600, 0.6).setDepth(-1);
    }

    // Goal
    this.setGoal(8200, 520, 40, 60);
  }

  update(time: number, delta: number) {
    super.update(time, delta);

    // Forced scroll section
    if (this.player.x > 4900 && this.player.x < 5700) {
      if (!this.scrollZoneActive) {
        this.scrollZoneActive = true;
        (this.scrollWall.body as Phaser.Physics.Arcade.Body).setVelocityX(100);
      }
    }

    if (this.scrollZoneActive && this.scrollWall.x < 5700) {
      this.physics.add.overlap(this.player, this.scrollWall, () => {
        if (!this.isDead) this.die();
      });
    }

    if (this.scrollWall.x >= 5700) {
      this.scrollZoneActive = false;
      (this.scrollWall.body as Phaser.Physics.Arcade.Body).setVelocityX(0);
    }
  }
}
