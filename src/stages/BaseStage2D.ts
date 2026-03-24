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
  protected springLaunched = false;

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

  // Troll mechanics
  protected fakeSpringTraps: { sprite: Phaser.GameObjects.Rectangle; x: number; y: number; triggered: boolean }[] = [];
  protected hiddenBlocks: { x: number; y: number; w: number; h: number; revealed: boolean; sprite?: Phaser.GameObjects.Rectangle }[] = [];
  protected mirrorEnemies: { sprite: Phaser.GameObjects.Arc; body: Phaser.Physics.Arcade.Body; baseY: number }[] = [];
  protected fakeGoals: Phaser.GameObjects.Rectangle[] = [];
  protected trollMessages: { x: number; y: number; text: string; shown: boolean }[] = [];

  abstract buildLevel(): void;

  init() {
    this.deaths = 0;
    this.isDead = false;
    this.hasDoubleJumped = false;
    this.crumblingPlatforms = [];
    this.movingPlatforms = [];
    this.fakeSpringTraps = [];
    this.hiddenBlocks = [];
    this.mirrorEnemies = [];
    this.fakeGoals = [];
    this.trollMessages = [];
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
        // Stomp! (hide, don't destroy - revive on respawn)
        const e = enemy as Phaser.GameObjects.GameObject;
        e.setActive(false);
        (e as any).setVisible(false);
        (e.body as Phaser.Physics.Arcade.Body).enable = false;
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

  /** Fake spring: looks helpful but launches player into death zone on touch */
  protected addFakeSpring(x: number, y: number) {
    const springY = y - 16;
    const spring = this.add.rectangle(x, springY, 32, 20, 0xff8800);
    this.add.rectangle(x, springY - 6, 22, 4, 0xffaa33);
    this.add.rectangle(x, springY + 6, 28, 4, 0xcc6600);
    this.add.text(x, springY - 18, '^', { fontSize: '16px', color: '#44ff44' }).setOrigin(0.5);
    this.physics.add.existing(spring, true);
    (spring.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();

    let triggered = false;
    this.physics.add.overlap(this.player, spring, () => {
      if (this.isDead || triggered) return;
      triggered = true;
      const pb = this.player.body as Phaser.Physics.Arcade.Body;
      pb.setVelocityY(-2000);
      this.springLaunched = true;
      // Re-enable after respawn
      this.time.delayedCall(2000, () => { triggered = false; });
    });
  }

  /** Hidden block: invisible until player jumps into it from below */
  protected addHiddenBlock(x: number, y: number, w: number = 40, h: number = 20, deadly: boolean = false) {
    const block = { x, y, w, h, revealed: false, sprite: undefined as Phaser.GameObjects.Rectangle | undefined };
    this.hiddenBlocks.push(block);
    // The block only appears when hit from below
    return block;
  }

  /** Mirror enemy: jumps when the player jumps, making dodging impossible without trickery */
  protected addMirrorEnemy(x: number, y: number) {
    const enemy = this.add.circle(x, y, 14, 0xff44ff);
    this.strongEnemies.add(enemy);
    const body = enemy.body as Phaser.Physics.Arcade.Body;
    body.setCircle(14);
    body.setAllowGravity(true);
    body.setBounceY(0);

    this.mirrorEnemies.push({ sprite: enemy, body, baseY: y });
  }

  /** Fake goal: looks like the real goal but kills you */
  protected addFakeGoal(x: number, y: number) {
    const fg = this.add.rectangle(x, y, 40, 60, 0xffdd00);
    this.add.triangle(x + 20, y - 20, 0, 0, 20, 10, 0, 20, 0xff4444).setDepth(1);
    this.physics.add.existing(fg, true);
    this.physics.add.overlap(this.player, fg, () => {
      if (!this.isDead) {
        // Gotcha! It's a trap
        this.die();
      }
    });
    this.fakeGoals.push(fg);
  }

  /** Troll message: appears when player reaches a certain x position */
  protected addTrollMessage(x: number, y: number, text: string) {
    this.trollMessages.push({ x, y, text, shown: false });
  }

  /** Platform that looks solid but falls when touched */
  protected addTrapPlatform(x: number, y: number, w: number = 80, h: number = 16) {
    const sprite = this.add.rectangle(x, y, w, h, 0x66aa44); // Same color as normal platform
    this.physics.add.existing(sprite, true);
    (sprite.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();

    this.physics.add.collider(this.player, sprite, () => {
      // Instantly fall after landing
      this.time.delayedCall(100, () => {
        (sprite.body as Phaser.Physics.Arcade.StaticBody).enable = false;
        this.tweens.add({
          targets: sprite,
          y: sprite.y + 400,
          alpha: 0,
          duration: 500,
        });
      });
    });
  }

  /** Reverse gravity zone */
  protected addGravityZone(x: number, y: number, w: number, h: number) {
    const zone = this.add.rectangle(x, y, w, h, 0x4400ff, 0.15);
    this.physics.add.existing(zone, true);
    this.physics.add.overlap(this.player, zone, () => {
      if (!this.isDead) {
        const pb = this.player.body as Phaser.Physics.Arcade.Body;
        pb.setVelocityY(-600);
      }
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

  // Last death info for bot analysis
  public lastDeathCause: string = '';
  public lastDeathX: number = 0;
  public lastDeathY: number = 0;
  public lastDeathVY: number = 0;

  protected die() {
    if (this.isDead) return;
    this.isDead = true;
    this.deaths++;

    const pb = this.player.body as Phaser.Physics.Arcade.Body;

    // Analyze death cause
    this.lastDeathX = this.player.x;
    this.lastDeathY = this.player.y;
    this.lastDeathVY = pb.velocity.y;

    if (this.springLaunched || pb.velocity.y < -500) {
      this.lastDeathCause = 'spring'; // Launched by fake spring
    } else if (this.player.y > this.config.worldHeight - 20) {
      this.lastDeathCause = 'fall'; // Fell into gap
    } else {
      // Check proximity to enemies
      let nearEnemy = false;
      const checkGroup = (group: Phaser.Physics.Arcade.Group) => {
        group.getChildren().forEach((e: any) => {
          if (e.active && Math.abs(e.x - this.player.x) < 40 && Math.abs(e.y - this.player.y) < 40) {
            nearEnemy = true;
          }
        });
      };
      checkGroup(this.weakEnemies);
      checkGroup(this.strongEnemies);
      if (nearEnemy) {
        this.lastDeathCause = 'enemy';
      } else {
        this.lastDeathCause = 'object'; // Falling object or trap
      }
    }

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
    this.springLaunched = false;
    const pb = this.player.body as Phaser.Physics.Arcade.Body;
    pb.setAllowGravity(true);
    this.player.setPosition(this.config.playerStart.x, this.config.playerStart.y);
    pb.setVelocity(0, 0);

    // Clear falling objects near spawn
    const spawnX = this.config.playerStart.x;
    this.fallingObjects.getChildren().forEach((obj: any) => {
      if (obj.active && Math.abs(obj.x - spawnX) < 150) {
        if ((obj as any)._shadow) (obj as any)._shadow.destroy();
        obj.destroy();
      }
    });

    // Revive all defeated weak enemies
    this.weakEnemies.getChildren().forEach((e: any) => {
      if (!e.active) {
        e.setActive(true);
        e.setVisible(true);
        if (e.body) e.body.enable = true;
      }
    });
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
    // Skip if spring launched (let the full force apply)
    if (body.velocity.y < 0 && !this.springLaunched && !inputManager.keyboard.isDown('Space') && !inputManager.keyboard.isDown('KeyZ')) {
      body.setVelocityY(body.velocity.y * 0.9);
    }
    if (this.isOnGround) {
      this.springLaunched = false;
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

    // Update troll mechanics
    this.updateTrollMechanics(time);

    // HUD
    this.hudTimeText.setText(`Time: ${this.timer.format()}`);
    this.hudDeathText.setText(`Deaths: ${this.deaths}`);

    // Reset on ground state for double jump
    if (this.isOnGround) {
      this.hasDoubleJumped = false;
    }
  }

  private updateTrollMechanics(time: number) {
    // Hidden blocks: reveal when player hits from below
    for (const hb of this.hiddenBlocks) {
      if (hb.revealed) continue;
      const pb = this.player.body as Phaser.Physics.Arcade.Body;
      const px = this.player.x, py = this.player.y;
      // Check if player head hits the block area from below
      if (pb.velocity.y < 0 &&
          px > hb.x - hb.w / 2 - 14 && px < hb.x + hb.w / 2 + 14 &&
          py - 18 < hb.y + hb.h / 2 && py - 18 > hb.y - hb.h / 2 - 10) {
        hb.revealed = true;
        hb.sprite = this.add.rectangle(hb.x, hb.y, hb.w, hb.h, 0xaaaa44);
        this.platforms.add(hb.sprite);
        (hb.sprite.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
        pb.setVelocityY(50); // Stop upward momentum
      }
    }

    // Mirror enemies: if player jumps within detection range, enemy mirrors the jump
    // Correct approach: jump from OUTSIDE detection range (>120px away) to fly over
    // Wrong approach: jump near the enemy - it jumps to your exact height = death
    const pb = this.player.body as Phaser.Physics.Arcade.Body;
    for (const me of this.mirrorEnemies) {
      if (!me.sprite.active) continue;
      const dist = Math.abs(this.player.x - me.sprite.x);
      if (dist < 120 && pb.velocity.y < -50 && me.body.blocked.down) {
        // Enemy mirrors player's jump velocity exactly = same height = collision
        me.body.setVelocityY(pb.velocity.y);
      }
    }

    // Troll messages: display when player reaches x
    for (const tm of this.trollMessages) {
      if (tm.shown) continue;
      if (Math.abs(this.player.x - tm.x) < 100) {
        tm.shown = true;
        const txt = this.add.text(tm.x, tm.y, tm.text, {
          fontSize: '14px',
          color: '#ff8888',
          fontFamily: 'Caveat, monospace',
          backgroundColor: '#00000088',
          padding: { x: 4, y: 2 },
        }).setOrigin(0.5).setDepth(50);
        this.tweens.add({
          targets: txt,
          alpha: 0,
          y: tm.y - 40,
          duration: 3000,
          onComplete: () => txt.destroy(),
        });
      }
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
          if (obj._shadow) { obj._shadow.destroy(); obj._shadow = null; }
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
