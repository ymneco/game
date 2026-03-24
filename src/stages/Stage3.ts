import Phaser from 'phaser';
import * as THREE from 'three';
import { inputManager } from '../input/InputManager';
import { TimerSystem } from '../systems/TimerSystem';

export class Stage3Scene extends Phaser.Scene {
  private threeRenderer!: THREE.WebGLRenderer;
  private threeScene!: THREE.Scene;
  private threeCamera!: THREE.PerspectiveCamera;

  private playerMesh!: THREE.Mesh;
  private playerVelocity = new THREE.Vector3();
  private playerOnGround = false;
  private playerPos = new THREE.Vector3(0, 1, 0);

  private platforms: { mesh: THREE.Mesh; box: THREE.Box3; crumbling?: boolean; state?: string; timer?: number; respawnTimer?: number; originalY?: number }[] = [];
  private enemies: { mesh: THREE.Mesh; type: 'weak' | 'strong'; startPos: THREE.Vector3; range: number; speed: number; alive: boolean }[] = [];
  private goalMesh!: THREE.Mesh;
  private goalBox!: THREE.Box3;

  private timer = new TimerSystem();
  private deaths = 0;
  private isDead = false;
  private cameraAngle = 0;
  private cameraDistance = 8;
  private cameraPitch = 0.4;
  private mouseDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private boundMouseDown: ((e: MouseEvent) => void) | null = null;
  private boundMouseMove: ((e: MouseEvent) => void) | null = null;
  private boundMouseUp: ((e: MouseEvent) => void) | null = null;

  private startPos = new THREE.Vector3(0, 2, 0);

  constructor() {
    super({ key: 'Stage3' });
  }

  init() {
    this.deaths = 0;
    this.isDead = false;
    this.cameraAngle = 0;
    this.cameraPitch = 0.4;
    this.platforms = [];
    this.enemies = [];
    this.playerVelocity.set(0, 0, 0);
    this.playerOnGround = false;
    this.mouseDragging = false;
  }

  create() {
    // Remove any existing Three.js canvases
    document.querySelectorAll('.three-canvas').forEach(c => c.remove());

    // Create Three.js renderer filling the game container
    const container = document.getElementById('game-container')!;
    const canvas = document.createElement('canvas');
    canvas.className = 'three-canvas';
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';
    container.appendChild(canvas);

    const w = container.clientWidth || 800;
    const h = container.clientHeight || 600;
    this.threeRenderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.threeRenderer.setSize(w, h);
    this.threeRenderer.setClearColor(0xddaa66);
    this.threeRenderer.shadowMap.enabled = true;

    this.threeScene = new THREE.Scene();
    this.threeScene.fog = new THREE.Fog(0xddaa66, 30, 80);

    const aspect = (container.clientWidth || 800) / (container.clientHeight || 600);
    this.threeCamera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.threeScene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffeedd, 0.8);
    directional.position.set(10, 20, 10);
    directional.castShadow = true;
    this.threeScene.add(directional);

    // Player
    const playerGeo = new THREE.BoxGeometry(0.6, 1, 0.6);
    const playerMat = new THREE.MeshLambertMaterial({ color: 0x44aaff });
    this.playerMesh = new THREE.Mesh(playerGeo, playerMat);
    this.playerMesh.castShadow = true;
    this.threeScene.add(this.playerMesh);

    // Build level
    this.buildLevel();

    // HTML HUD overlay (since Phaser canvas can't be transparent)
    this.game.canvas.style.display = 'none';
    const hud = document.createElement('div');
    hud.id = 'hud-3d';
    hud.style.cssText = 'position:absolute;top:0;left:0;width:100%;pointer-events:none;z-index:10;font-family:monospace;';
    hud.innerHTML = `
      <div style="position:absolute;top:10px;left:10px;color:#fff;font-size:16px;background:rgba(0,0,0,0.5);padding:3px 6px" id="hud-stage">Stage 3 - Desert Ruins</div>
      <div style="position:absolute;top:36px;left:10px;color:#ffff44;font-size:16px;background:rgba(0,0,0,0.5);padding:3px 6px" id="hud-time">Time: 00:00.00</div>
      <div style="position:absolute;top:10px;right:10px;color:#ff4444;font-size:16px;background:rgba(0,0,0,0.5);padding:3px 6px" id="hud-deaths">Deaths: 0</div>
    `;
    document.getElementById('game-container')!.appendChild(hud);
    this.deathOverlay = null as any;

    this.playerPos.copy(this.startPos);
    // Mouse camera control
    this.setupMouseCamera();

    this.timer.start();
  }

  private setupMouseCamera() {
    const canvas = document.querySelector('.three-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    this.boundMouseDown = (e: MouseEvent) => {
      this.mouseDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    };
    this.boundMouseMove = (e: MouseEvent) => {
      if (!this.mouseDragging) return;
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.cameraAngle += dx * 0.005;
      this.cameraPitch = Math.max(0.1, Math.min(1.2, this.cameraPitch + dy * 0.003));
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    };
    this.boundMouseUp = () => {
      this.mouseDragging = false;
    };

    canvas.addEventListener('mousedown', this.boundMouseDown);
    window.addEventListener('mousemove', this.boundMouseMove);
    window.addEventListener('mouseup', this.boundMouseUp);

    // Also support right-click drag (prevent context menu)
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private removeMouseCamera() {
    const canvas = document.querySelector('.three-canvas') as HTMLCanvasElement;
    if (canvas && this.boundMouseDown) canvas.removeEventListener('mousedown', this.boundMouseDown);
    if (this.boundMouseMove) window.removeEventListener('mousemove', this.boundMouseMove);
    if (this.boundMouseUp) window.removeEventListener('mouseup', this.boundMouseUp);
  }

  private buildLevel() {
    // Ground
    this.addPlatform3D(0, -0.5, 0, 60, 1, 60, 0xcc9944);

    // Ruins platforms
    this.addPlatform3D(4, 1, 0, 3, 0.5, 3, 0xaa8833);
    this.addPlatform3D(8, 2, 3, 3, 0.5, 3, 0xaa8833);
    this.addPlatform3D(12, 3, 0, 3, 0.5, 3, 0xaa8833);
    this.addPlatform3D(16, 2, -3, 3, 0.5, 3, 0xaa8833);

    // Bridge with crumbling sections
    this.addPlatform3D(20, 2, 0, 2, 0.3, 8, 0x887744, true);
    this.addPlatform3D(23, 2, 0, 2, 0.3, 2, 0xaa8833);
    this.addPlatform3D(26, 2, 0, 2, 0.3, 8, 0x887744, true);

    // More platforms
    this.addPlatform3D(30, 1, 3, 3, 0.5, 3, 0xaa8833);
    this.addPlatform3D(34, 1.5, -2, 3, 0.5, 3, 0xaa8833);
    this.addPlatform3D(38, 1, 0, 3, 0.5, 3, 0xaa8833);

    // Crumbling
    this.addPlatform3D(42, 1.5, 0, 2, 0.3, 2, 0x887744, true);
    this.addPlatform3D(46, 2, 2, 2, 0.3, 2, 0x887744, true);

    // Final section
    this.addPlatform3D(50, 1, 0, 4, 0.5, 4, 0xaa8833);

    // Weak enemies
    this.addEnemy3D(10, 0.5, 0, 'weak', 4, 2);
    this.addEnemy3D(30, 0.5, 0, 'weak', 3, 1.5);
    this.addEnemy3D(38, 1.75, 0, 'weak', 2, 1);
    this.addEnemy3D(46, 0.5, 0, 'weak', 3, 2);

    // Strong enemy patrolling
    this.addEnemy3D(34, 0.5, 0, 'strong', 6, 1.5);

    // Goal - tall pillar/arch
    const goalGeo = new THREE.CylinderGeometry(0.5, 0.5, 4, 8);
    const goalMat = new THREE.MeshLambertMaterial({ color: 0xffdd00, emissive: 0x444400 });
    this.goalMesh = new THREE.Mesh(goalGeo, goalMat);
    this.goalMesh.position.set(52, 2, 0);
    this.threeScene.add(this.goalMesh);
    this.goalBox = new THREE.Box3().setFromObject(this.goalMesh);

    // Decorative columns
    for (let i = 0; i < 8; i++) {
      const colGeo = new THREE.CylinderGeometry(0.3, 0.4, 5, 6);
      const colMat = new THREE.MeshLambertMaterial({ color: 0x998866 });
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.set(i * 7, 2.5, 10 + Math.random() * 5);
      col.castShadow = true;
      this.threeScene.add(col);
    }
  }

  private addPlatform3D(x: number, y: number, z: number, w: number, h: number, d: number, color: number, crumbling = false) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    this.threeScene.add(mesh);

    const box = new THREE.Box3().setFromObject(mesh);
    this.platforms.push({
      mesh, box, crumbling,
      state: crumbling ? 'solid' : undefined,
      timer: 0,
      respawnTimer: 0,
      originalY: y,
    });
  }

  private addEnemy3D(x: number, y: number, z: number, type: 'weak' | 'strong', range: number, speed: number) {
    const geo = type === 'weak'
      ? new THREE.SphereGeometry(0.4, 8, 8)
      : new THREE.OctahedronGeometry(0.5);
    const mat = new THREE.MeshLambertMaterial({
      color: type === 'weak' ? 0x44cc44 : 0xff2222,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    this.threeScene.add(mesh);

    this.enemies.push({
      mesh, type,
      startPos: new THREE.Vector3(x, y, z),
      range, speed,
      alive: true,
    });
  }

  update(time: number, delta: number) {
    if (!this.threeRenderer) return;
    inputManager.update();

    const dt = delta / 1000;

    if (!this.isDead) {
      // Movement
      const moveSpeed = 6;
      const forward = new THREE.Vector3(-Math.sin(this.cameraAngle), 0, -Math.cos(this.cameraAngle));
      const right = new THREE.Vector3(Math.cos(this.cameraAngle), 0, -Math.sin(this.cameraAngle));

      if (inputManager.left) this.playerVelocity.x = -moveSpeed * right.x + -moveSpeed * right.z;
      else if (inputManager.right) this.playerVelocity.x = moveSpeed * right.x + moveSpeed * right.z;
      else this.playerVelocity.x *= 0.8;

      if (inputManager.up) this.playerVelocity.z = moveSpeed * forward.z + moveSpeed * forward.x;
      else if (inputManager.down) this.playerVelocity.z = -moveSpeed * forward.z - moveSpeed * forward.x;
      else this.playerVelocity.z *= 0.8;

      // Gravity
      this.playerVelocity.y -= 20 * dt;

      // Jump
      if (inputManager.jump && this.playerOnGround) {
        this.playerVelocity.y = 8;
      }

      // Apply velocity
      this.playerPos.x += this.playerVelocity.x * dt;
      this.playerPos.y += this.playerVelocity.y * dt;
      this.playerPos.z += this.playerVelocity.z * dt;

      // Platform collision
      this.playerOnGround = false;
      const playerBox = new THREE.Box3(
        new THREE.Vector3(this.playerPos.x - 0.3, this.playerPos.y - 0.5, this.playerPos.z - 0.3),
        new THREE.Vector3(this.playerPos.x + 0.3, this.playerPos.y + 0.5, this.playerPos.z + 0.3)
      );

      for (const plat of this.platforms) {
        if (plat.crumbling && plat.state !== 'solid') continue;

        plat.box.setFromObject(plat.mesh);
        if (playerBox.intersectsBox(plat.box)) {
          const platTop = plat.box.max.y;
          const platBottom = plat.box.min.y;

          if (this.playerVelocity.y <= 0 && this.playerPos.y - 0.5 >= platTop - 0.3) {
            this.playerPos.y = platTop + 0.5;
            this.playerVelocity.y = 0;
            this.playerOnGround = true;

            // Trigger crumbling
            if (plat.crumbling && plat.state === 'solid') {
              plat.state = 'shaking';
              plat.timer = 1000;
            }
          } else if (this.playerVelocity.y > 0 && this.playerPos.y + 0.5 <= platBottom + 0.3) {
            this.playerVelocity.y = 0;
          } else {
            // Side collision - push out
            const dx = this.playerPos.x - (plat.box.min.x + plat.box.max.x) / 2;
            const dz = this.playerPos.z - (plat.box.min.z + plat.box.max.z) / 2;
            if (Math.abs(dx) > Math.abs(dz)) {
              this.playerPos.x += Math.sign(dx) * 0.1;
            } else {
              this.playerPos.z += Math.sign(dz) * 0.1;
            }
          }
        }
      }

      // Ground check (main ground at y=0)
      if (this.playerPos.y <= 0.5 && this.playerPos.x >= -30 && this.playerPos.x <= 30 && this.playerPos.z >= -30 && this.playerPos.z <= 30) {
        this.playerPos.y = 0.5;
        this.playerVelocity.y = 0;
        this.playerOnGround = true;
      }

      // Fall death
      if (this.playerPos.y < -10) {
        this.die();
      }

      // Enemy collision
      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        const dist = this.playerPos.distanceTo(enemy.mesh.position);
        if (dist < 0.8) {
          if (enemy.type === 'weak' && this.playerVelocity.y < 0 && this.playerPos.y > enemy.mesh.position.y) {
            // Stomp
            enemy.alive = false;
            enemy.mesh.visible = false;
            this.playerVelocity.y = 6;
          } else {
            this.die();
          }
        }
      }

      // Goal check
      this.goalBox.setFromObject(this.goalMesh);
      if (playerBox.intersectsBox(this.goalBox)) {
        this.win();
      }

      // Camera rotation with right stick or mouse
      this.cameraAngle += inputManager.rightStickX * 2 * dt;

      // Camera
      const camX = this.playerPos.x + Math.sin(this.cameraAngle) * this.cameraDistance;
      const camY = this.playerPos.y + this.cameraDistance * this.cameraPitch + 2;
      const camZ = this.playerPos.z + Math.cos(this.cameraAngle) * this.cameraDistance;
      this.threeCamera.position.set(camX, camY, camZ);
      this.threeCamera.lookAt(this.playerPos.x, this.playerPos.y + 0.5, this.playerPos.z);
    }

    // Update crumbling platforms
    for (const plat of this.platforms) {
      if (!plat.crumbling) continue;
      if (plat.state === 'shaking') {
        plat.timer! -= delta;
        plat.mesh.position.x += (Math.random() - 0.5) * 0.05;
        plat.mesh.position.z += (Math.random() - 0.5) * 0.05;
        if (plat.timer! <= 0) {
          plat.state = 'fallen';
          plat.mesh.visible = false;
          plat.respawnTimer = 5000;
        }
      } else if (plat.state === 'fallen') {
        plat.respawnTimer! -= delta;
        if (plat.respawnTimer! <= 1000 && !plat.mesh.visible) {
          plat.mesh.visible = true;
          (plat.mesh.material as THREE.MeshLambertMaterial).opacity = 0.3;
          (plat.mesh.material as THREE.MeshLambertMaterial).transparent = true;
        }
        if (plat.respawnTimer! <= 0) {
          plat.state = 'solid';
          (plat.mesh.material as THREE.MeshLambertMaterial).opacity = 1;
          (plat.mesh.material as THREE.MeshLambertMaterial).transparent = false;
        }
      }
    }

    // Update enemies
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      enemy.mesh.position.x = enemy.startPos.x + Math.sin(time / 1000 * enemy.speed) * enemy.range;
      enemy.mesh.rotation.y += 0.03;
    }

    // Player mesh
    this.playerMesh.position.copy(this.playerPos);

    // Goal animation
    this.goalMesh.rotation.y += 0.02;

    // Render Three.js
    this.threeRenderer.render(this.threeScene, this.threeCamera);

    // HUD
    const hudTime = document.getElementById('hud-time');
    const hudDeaths = document.getElementById('hud-deaths');
    if (hudTime) hudTime.textContent = `Time: ${this.timer.format()}`;
    if (hudDeaths) hudDeaths.textContent = `Deaths: ${this.deaths}`;
  }

  private die() {
    if (this.isDead) return;
    this.isDead = true;
    this.deaths++;
    this.playerVelocity.set(0, 0, 0);

    // Red flash via Three.js scene background
    this.threeRenderer.setClearColor(0x440000);
    this.time.delayedCall(300, () => {
      this.threeRenderer.setClearColor(0xddaa66);
      this.isDead = false;
      this.playerPos.copy(this.startPos);
      this.playerVelocity.set(0, 0, 0);
    });
  }

  private win() {
    const time = this.timer.stop();
    this.cleanup();
    this.scene.start('Result', {
      stageNum: 3,
      time,
      deaths: this.deaths,
    });
  }

  private cleanup() {
    this.removeMouseCamera();
    if (this.threeRenderer) {
      this.threeRenderer.dispose();
      this.threeRenderer.domElement.remove();
    }
    document.getElementById('hud-3d')?.remove();
    this.game.canvas.style.display = '';
  }

  shutdown() {
    this.cleanup();
  }
}
