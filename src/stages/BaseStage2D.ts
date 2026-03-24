import Phaser from 'phaser';
import { inputManager } from '../input/InputManager';
import { TimerSystem } from '../systems/TimerSystem';

export interface StageConfig {
  stageNum: number;
  stageName: string;
  worldWidth: number;
  worldHeight: number;
  playerStart: { x: number; y: number };
  gravity?: number;
  bgColor?: string;
}

export abstract class BaseStage2D extends Phaser.Scene {
  protected config!: StageConfig;
  protected player!: Phaser.Physics.Arcade.Sprite;
  protected platforms!: Phaser.Physics.Arcade.StaticGroup;
  protected weakEnemies!: Phaser.Physics.Arcade.Group;
  protected strongEnemies!: Phaser.Physics.Arcade.Group;
  protected crumblingPlatforms: { sprite: Phaser.GameObjects.Rectangle; body: Phaser.Physics.Arcade.Body; timer: number; state: string; respawnTimer: number }[] = [];
  protected fallingObjects!: Phaser.Physics.Arcade.Group;
  protected goal!: Phaser.GameObjects.Rectangle;
  protected goalBody!: Phaser.Physics.Arcade.Body;
  protected timer = new TimerSystem();
  protected deaths = 0;
  protected isDead = false;
  protected canDoubleJump = false;
  protected hasDoubleJumped = false;
  protected isOnGround = false;

  // HUD
  protected hudTimeText!: Phaser.GameObjects.Text;
  protected hudDeathText!: Phaser.GameObjects.Text;
  protected hudStageText!: Phaser.GameObjects.Text;
  protected deathOverlay!: Phaser.GameObjects.Rectangle;

  // Falling object config
  protected fallingInterval = 5000;
  protected fallingSpeed = 200;
  protected safeZones: number[] = [];
  protected fallingTimer = 0;
  protected movingPlatforms: { sprite: Phaser.GameObjects.Rectangle; body: Phaser.Physics.Arcade.Body; startX: number; endX: number; speed: number; dir: number }[] = [];

  abstract buildLevel(): void;

  init() {
    this.deaths = 0;
    this.isDead = false;
    this.hasDoubleJumped = false;
    this.crumblingPlatforms = [];
    this.movingPlatforms = [];
    this.fallingTimer = 0;
  }

  create() {
    const cfg = this.config;
    this.cameras.main.setBackgroundColor(cfg.bgColor || '#4488aa');
    this.physics.world.setBounds(0, 0, cfg.worldWidth, cfg.worldHeight);
    this.physics.world.gravity.y = cfg.gravity || 1000;

    // Groups
    this.platforms = this.physics.add.staticGroup();
    this.weakEnemies = this.physics.add.group({ allowGravity: false });
    this.strongEnemies = this.physics.add.group({ allowGravity: false });
    this.fallingObjects = this.physics.add.group({ allowGravity: false });

    // Player: simple colored rectangle
    const playerGfx = this.add.rectangle(0, 0, 28, 36, 0x44aaff);
    this.player = this.physics.add.existing(playerGfx, false) as unknown as Phaser.Physics.Arcade.Sprite;
    const playerBody = (this.player.body as Phaser.Physics.Arcade.Body);
    playerBody.setCollideWorldBounds(false);
    playerBody.setSize(28, 36);
    this.player.setPosition(cfg.playerStart.x, cfg.playerStart.y);

    // Build level
    this.buildLevel();

    // Collisions
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.weakEnemies, this.platforms);

    // Player vs weak enemy
    this.physics.add.overlap(this.player, this.weakEnemies, (_p, enemy) => {
      if (this.isDead) return;
      const pb = this.player.body as Phaser.Physics.Arcade.Body;
      const eb = (enemy as Phaser.GameObjects.GameObject).body as Phaser.Physics.Arcade.Body;
      // Check if player is above enemy and falling down
      if (pb.velocity.y > 0 && pb.bottom <= eb.top + 20) {
        // Stomp!
        (enemy as Phaser.GameObjects.GameObject).destroy();
        pb.setVelocityY(-300);
      } else {
        this.die();
      }
    });

    // Player vs strong enemy
    this.physics.add.overlap(this.player, this.strongEnemies, () => {
      if (!this.isDead) this.die();
    });

    // Camera
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, cfg.worldWidth, cfg.worldHeight);

    // HUD (fixed to camera)
    this.hudStageText = this.add.text(10, 10, cfg.stageName, {
      fontSize: '16px', color: '#ffffff', fontFamily: 'monospace',
      backgroundColor: '#00000088', padding: { x: 6, y: 3 },
    }).setScrollFactor(0).setDepth(100);

    this.hudTimeText = this.add.text(10, 36, 'Time: 00:00.00', {
      fontSize: '16px', color: '#ffff44', fontFamily: 'monospace',
      backgroundColor: '#00000088', padding: { x: 6, y: 3 },
    }).setScrollFactor(0).setDepth(100);

    this.hudDeathText = this.add.text(690, 10, 'Deaths: 0', {
      fontSize: '16px', color: '#ff4444', fontFamily: 'monospace',
      backgroundColor: '#00000088', padding: { x: 6, y: 3 },
    }).setScrollFactor(0).setDepth(100);

    // Death overlay
    this.deathOverlay = this.add.rectangle(400, 300, 800, 600, 0xff0000, 0)
      .setScrollFactor(0).setDepth(99);

    // Start timer
    this.timer.start();
  }

  protected addPlatform(x: number, y: number, w: number, h: number, color: number = 0x66aa44): Phaser.GameObjects.Rectangle {
    const plat = this.add.rectangle(x, y, w, h, color);
    this.platforms.add(plat);
    (plat.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    return plat;
  }

  protected addCrumblingPlatform(x: number, y: number, w: number = 80, h: number = 16) {
    const sprite = this.add.rectangle(x, y, w, h, 0x8B6914);
    const body = this.physics.add.existing(sprite, true) as unknown as Phaser.GameObjects.Rectangle;
    (body.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();

    this.physics.add.collider(this.player, sprite, () => {
      const cp = this.crumblingPlatforms.find(c => c.sprite === sprite);
      if (cp && cp.state === 'solid') {
        cp.state = 'shaking';
        cp.timer = 1000; // 1 second shake
      }
    });

    this.crumblingPlatforms.push({
      sprite,
      body: sprite.body as Phaser.Physics.Arcade.Body,
      timer: 0,
      state: 'solid',
      respawnTimer: 0,
    });
  }

  protected addWeakEnemy(x: number, y: number, rangeX: number, speed: number = 60) {
    const enemy = this.add.circle(x, y, 14, 0x44cc44);
    this.weakEnemies.add(enemy);
    const body = enemy.body as Phaser.Physics.Arcade.Body;
    body.setCircle(14);
    body.setVelocityX(speed);
    body.setBounceX(1);
    body.setCollideWorldBounds(true);

    // Store patrol data
    (enemy as any)._patrolMin = x - rangeX;
    (enemy as any)._patrolMax = x + rangeX;
    (enemy as any)._speed = speed;
  }

  protected addStrongEnemy(x: number, y: number, patternFn: (enemy: Phaser.GameObjects.Arc, time: number) => void) {
    const enemy = this.add.circle(x, y, 16, 0xff2222);
    // Add spikes visual
    this.add.circle(x, y, 10, 0xcc0000).setName('inner_' + x);
    this.strongEnemies.add(enemy);
    const body = enemy.body as Phaser.Physics.Arcade.Body;
    body.setCircle(16);
    (enemy as any)._pattern = patternFn;
    (enemy as any)._startX = x;
    (enemy as any)._startY = y;
  }

  protected setGoal(x: number, y: number, w: number = 40, h: number = 60) {
    this.goal = this.add.rectangle(x, y, w, h, 0xffdd00);
    // Add flag decoration
    this.add.triangle(x + 20, y - 20, 0, 0, 20, 10, 0, 20, 0xff4444).setDepth(1);
    this.physics.add.existing(this.goal, true);
    this.physics.add.overlap(this.player, this.goal, () => {
      if (!this.isDead) this.win();
    });
  }

  protected addMovingPlatform(x: number, y: number, endX: number, w: number = 80, h: number = 16, speed: number = 60) {
    const sprite = this.add.rectangle(x, y, w, h, 0x6688aa);
    this.physics.add.existing(sprite, false);
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true);
    body.setAllowGravity(false);
    body.setVelocityX(speed);

    this.physics.add.collider(this.player, sprite);

    this.movingPlatforms.push({
      sprite,
      body,
      startX: Math.min(x, endX),
      endX: Math.max(x, endX),
      speed,
      dir: 1,
    });
  }

  protected die() {
    if (this.isDead) return;
    this.isDead = true;
    this.deaths++;

    const pb = this.player.body as Phaser.Physics.Arcade.Body;
    pb.setVelocity(0, 0);
    pb.setAllowGravity(false);

    // Flash red
    this.deathOverlay.setAlpha(0.5);
    this.time.delayedCall(300, () => {
      this.deathOverlay.setAlpha(0);
      this.respawn();
    });
  }

  protected respawn() {
    this.isDead = false;
    this.hasDoubleJumped = false;
    const pb = this.player.body as Phaser.Physics.Arcade.Body;
    pb.setAllowGravity(true);
    this.player.setPosition(this.config.playerStart.x, this.config.playerStart.y);
    pb.setVelocity(0, 0);
  }

  protected win() {
    const time = this.timer.stop();
    this.scene.start('Result', {
      stageNum: this.config.stageNum,
      time,
      deaths: this.deaths,
    });
  }

  update(time: number, delta: number) {
    inputManager.update();

    if (this.isDead) return;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    this.isOnGround = body.blocked.down || body.touching.down;

    // Movement
    const speed = 250;
    if (inputManager.left) {
      body.setVelocityX(-speed);
    } else if (inputManager.right) {
      body.setVelocityX(speed);
    } else {
      body.setVelocityX(0);
    }

    // Jump
    if (inputManager.jump) {
      if (this.isOnGround) {
        body.setVelocityY(-500);
        this.hasDoubleJumped = false;
      } else if (this.canDoubleJump && !this.hasDoubleJumped) {
        body.setVelocityY(-450);
        this.hasDoubleJumped = true;
      }
    }

    // Better jump feel: cut jump short on release, faster fall
    if (body.velocity.y < 0 && !inputManager.keyboard.isDown('Space') && !inputManager.keyboard.isDown('KeyZ')) {
      body.setVelocityY(body.velocity.y * 0.9);
    }
    if (body.velocity.y > 0) {
      body.setVelocityY(Math.min(body.velocity.y + 8, 600)); // Faster fall, capped
    }

    // Fall death
    if (this.player.y > this.config.worldHeight + 50) {
      this.die();
    }

    // Update crumbling platforms
    this.updateCrumblingPlatforms(delta);

    // Update moving platforms
    this.updateMovingPlatforms();

    // Update enemies patrol
    this.updateEnemies(time);

    // Update falling objects
    this.updateFallingObjects(time, delta);

    // HUD
    this.hudTimeText.setText(`Time: ${this.timer.format()}`);
    this.hudDeathText.setText(`Deaths: ${this.deaths}`);

    // Reset on ground state for double jump
    if (this.isOnGround) {
      this.hasDoubleJumped = false;
    }
  }

  private updateCrumblingPlatforms(delta: number) {
    for (const cp of this.crumblingPlatforms) {
      if (cp.state === 'shaking') {
        cp.timer -= delta;
        // Shake effect
        cp.sprite.x += (Math.random() - 0.5) * 4;
        if (cp.timer <= 500 && cp.timer > 0) {
          cp.sprite.setAlpha(0.5 + Math.random() * 0.5);
        }
        if (cp.timer <= 0) {
          cp.state = 'fallen';
          cp.sprite.setVisible(false);
          (cp.sprite.body as Phaser.Physics.Arcade.StaticBody).enable = false;
          cp.respawnTimer = 5000;
        }
      } else if (cp.state === 'fallen') {
        cp.respawnTimer -= delta;
        if (cp.respawnTimer <= 1000 && !cp.sprite.visible) {
          // Show preview
          cp.sprite.setVisible(true);
          cp.sprite.setAlpha(0.3);
        }
        if (cp.respawnTimer <= 0) {
          cp.state = 'solid';
          cp.sprite.setAlpha(1);
          (cp.sprite.body as Phaser.Physics.Arcade.StaticBody).enable = true;
        }
      }
    }
  }

  private updateMovingPlatforms() {
    for (const mp of this.movingPlatforms) {
      if (mp.sprite.x >= mp.endX) {
        mp.body.setVelocityX(-mp.speed);
      } else if (mp.sprite.x <= mp.startX) {
        mp.body.setVelocityX(mp.speed);
      }
    }
  }

  private updateEnemies(time: number) {
    this.weakEnemies.getChildren().forEach((enemy: any) => {
      if (enemy._patrolMin !== undefined) {
        if (enemy.x < enemy._patrolMin) {
          (enemy.body as Phaser.Physics.Arcade.Body).setVelocityX(enemy._speed);
        } else if (enemy.x > enemy._patrolMax) {
          (enemy.body as Phaser.Physics.Arcade.Body).setVelocityX(-enemy._speed);
        }
      }
    });

    this.strongEnemies.getChildren().forEach((enemy: any) => {
      if (enemy._pattern) {
        enemy._pattern(enemy, time);
      }
    });
  }

  protected updateFallingObjects(_time: number, delta: number) {
    if (this.fallingInterval <= 0) return;

    this.fallingTimer += delta;
    if (this.fallingTimer >= this.fallingInterval) {
      this.fallingTimer = 0;
      this.spawnFallingObject();
    }

    // Update existing objects
    this.fallingObjects.getChildren().forEach((obj: any) => {
      if (!obj.active) return;
      // Check if on ground
      if (obj.y >= this.config.worldHeight - 40) {
        obj._groundTimer = (obj._groundTimer || 0) + delta;
        (obj.body as Phaser.Physics.Arcade.Body).setVelocityY(0);
        obj.y = this.config.worldHeight - 40;
        if (obj._groundTimer > 2000) {
          obj.destroy();
        }
      }

      // Shadow/warning
      if (obj._shadow) {
        obj._shadow.setPosition(obj.x, this.config.worldHeight - 25);
        obj._shadow.setAlpha(Math.min(1, (obj.y / this.config.worldHeight)));
      }
    });

    // Check crush: player between falling obj and ground
    this.physics.overlap(this.player, this.fallingObjects, (_p, obj) => {
      if (this.isDead) return;
      this.die();
    });
  }

  protected spawnFallingObject() {
    const camLeft = this.cameras.main.scrollX;
    const camRight = camLeft + 800;

    // Pick random X within camera view, avoiding safe zones and player
    const playerX = this.player.x;
    let x: number;
    let attempts = 0;
    do {
      x = Phaser.Math.Between(camLeft + 50, camRight - 50);
      attempts++;
    } while ((this.safeZones.some(sz => Math.abs(x - sz) < 60) || Math.abs(x - playerX) < 80) && attempts < 30);

    const y = this.cameras.main.scrollY - 20;
    const obj = this.add.rectangle(x, y, 24, 24, 0x887766);
    this.fallingObjects.add(obj);
    const body = obj.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(this.fallingSpeed);
    body.setAllowGravity(false);

    // Shadow indicator
    const shadow = this.add.ellipse(x, this.config.worldHeight - 25, 30, 8, 0x000000, 0.3);
    (obj as any)._shadow = shadow;
    (obj as any)._groundTimer = 0;
  }
}
