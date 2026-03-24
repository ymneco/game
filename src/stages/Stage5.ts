import Phaser from 'phaser';
import * as THREE from 'three';
import { inputManager } from '../input/InputManager';
import { TimerSystem } from '../systems/TimerSystem';

export class Stage5Scene extends Phaser.Scene {
  private threeRenderer!: THREE.WebGLRenderer;
  private threeScene!: THREE.Scene;
  private threeCamera!: THREE.PerspectiveCamera;

  private playerMesh!: THREE.Mesh;
  private playerVelocity = new THREE.Vector3();
  private playerOnGround = false;
  private playerPos = new THREE.Vector3(0, 2, 0);

  private platforms: { mesh: THREE.Mesh; box: THREE.Box3; crumbling?: boolean; state?: string; timer?: number; respawnTimer?: number; moving?: boolean; moveAxis?: string; moveRange?: number; moveSpeed?: number; startPos?: THREE.Vector3; rotating?: boolean; rotSpeed?: number }[] = [];
  private enemies: { mesh: THREE.Mesh; type: 'weak' | 'strong'; startPos: THREE.Vector3; range: number; speed: number; alive: boolean; chasing?: boolean }[] = [];
  private goalMesh!: THREE.Mesh;
  private goalBox!: THREE.Box3;

  private timer = new TimerSystem();
  private deaths = 0;
  private isDead = false;
  private cameraAngle = 0;
  private cameraDistance = 8;
  private cameraPitch = 0.5;
  private mouseDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private boundMouseDown: ((e: MouseEvent) => void) | null = null;
  private boundMouseMove: ((e: MouseEvent) => void) | null = null;
  private boundMouseUp: ((e: MouseEvent) => void) | null = null;

  private startPos = new THREE.Vector3(0, 2, 0);

  constructor() {
    super({ key: 'Stage5' });
  }

  init() {
    this.deaths = 0;
    this.isDead = false;
    this.cameraAngle = 0;
    this.cameraPitch = 0.5;
    this.platforms = [];
    this.enemies = [];
    this.playerVelocity.set(0, 0, 0);
    this.playerOnGround = false;
    this.mouseDragging = false;
  }

  create() {
    // Remove any existing Three.js canvases
    document.querySelectorAll('.three-canvas').forEach(c => c.remove());

    const container = document.getElementById('game-container')!;
    const canvas = document.createElement('canvas');
    canvas.className = 'three-canvas';
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';
    container.appendChild(canvas);

    const w = container.clientWidth || 800;
    const h = container.clientHeight || 600;
    this.threeRenderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.threeRenderer.setSize(w, h);
    this.threeRenderer.setClearColor(0x000022);
    this.threeRenderer.shadowMap.enabled = true;

    this.threeScene = new THREE.Scene();
    this.threeScene.fog = new THREE.Fog(0x000022, 40, 100);

    const aspect = (container.clientWidth || 800) / (container.clientHeight || 600);
    this.threeCamera = new THREE.PerspectiveCamera(60, aspect, 0.1, 200);

    // Space lighting
    const ambient = new THREE.AmbientLight(0x333366, 0.5);
    this.threeScene.add(ambient);
    const point1 = new THREE.PointLight(0x4488ff, 1, 50);
    point1.position.set(10, 10, 0);
    this.threeScene.add(point1);
    const point2 = new THREE.PointLight(0xff4488, 0.8, 50);
    point2.position.set(40, 15, -5);
    this.threeScene.add(point2);

    // Starfield
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(3000);
    for (let i = 0; i < 3000; i++) {
      starPositions[i] = (Math.random() - 0.5) * 200;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.2 });
    this.threeScene.add(new THREE.Points(starGeo, starMat));

    // Player
    const playerGeo = new THREE.BoxGeometry(0.6, 1, 0.6);
    const playerMat = new THREE.MeshLambertMaterial({ color: 0x44aaff, emissive: 0x112244 });
    this.playerMesh = new THREE.Mesh(playerGeo, playerMat);
    this.threeScene.add(this.playerMesh);

    this.buildLevel();

    // HTML HUD overlay
    this.game.canvas.style.display = 'none';
    const hud = document.createElement('div');
    hud.id = 'hud-3d';
    hud.style.cssText = 'position:absolute;top:0;left:0;width:100%;pointer-events:none;z-index:10;font-family:monospace;';
    hud.innerHTML = `
      <div style="position:absolute;top:10px;left:10px;color:#fff;font-size:16px;background:rgba(0,0,0,0.5);padding:3px 6px" id="hud-stage">Stage 5 - Space Station</div>
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
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private removeMouseCamera() {
    const canvas = document.querySelector('.three-canvas') as HTMLCanvasElement;
    if (canvas && this.boundMouseDown) canvas.removeEventListener('mousedown', this.boundMouseDown);
    if (this.boundMouseMove) window.removeEventListener('mousemove', this.boundMouseMove);
    if (this.boundMouseUp) window.removeEventListener('mouseup', this.boundMouseUp);
  }

  private buildLevel() {
    // Starting island
    this.addPlatform3D(0, 0, 0, 4, 1, 4, 0x334466);

    // Floating islands path
    this.addPlatform3D(5, 1, 0, 2, 0.5, 2, 0x334466);
    this.addPlatform3D(9, 2, 2, 2, 0.5, 2, 0x334466);
    this.addPlatform3D(13, 1, 0, 2, 0.5, 2, 0x334466);

    // Moving platforms
    this.addPlatform3D(17, 2, 0, 2, 0.3, 2, 0x446688, false, true, 'x', 4, 1.5);
    this.addPlatform3D(23, 3, 0, 2, 0.3, 2, 0x446688, false, true, 'z', 4, 1.2);

    // Crumbling sequence
    this.addPlatform3D(27, 2, 0, 1.5, 0.3, 1.5, 0x553344, true);
    this.addPlatform3D(30, 2.5, 2, 1.5, 0.3, 1.5, 0x553344, true);
    this.addPlatform3D(33, 3, 0, 1.5, 0.3, 1.5, 0x553344, true);
    this.addPlatform3D(36, 2.5, -2, 1.5, 0.3, 1.5, 0x553344, true);

    // Rotating platform section
    this.addPlatform3D(40, 2, 0, 6, 0.3, 1, 0x445566, false, false, undefined, undefined, undefined, true, 0.5);

    // More islands
    this.addPlatform3D(45, 2, 0, 2, 0.5, 2, 0x334466);
    this.addPlatform3D(49, 3, 3, 2, 0.5, 2, 0x334466);

    // Narrow corridor (camera restriction zone)
    this.addPlatform3D(53, 2, 0, 10, 0.3, 2, 0x334466);
    // Walls
    this.addPlatform3D(53, 4, 1.5, 10, 4, 0.3, 0x222244);
    this.addPlatform3D(53, 4, -1.5, 10, 4, 0.3, 0x222244);

    // More crumbling
    this.addPlatform3D(60, 2, 0, 1.5, 0.3, 1.5, 0x553344, true);
    this.addPlatform3D(63, 2.5, 0, 1.5, 0.3, 1.5, 0x553344, true);
    this.addPlatform3D(66, 3, 0, 1.5, 0.3, 1.5, 0x553344, true);
    this.addPlatform3D(69, 2.5, 0, 1.5, 0.3, 1.5, 0x553344, true);

    // Moving platform over void
    this.addPlatform3D(73, 3, 0, 2, 0.3, 2, 0x446688, false, true, 'x', 5, 1);

    // Final island
    this.addPlatform3D(80, 2, 0, 5, 1, 5, 0x334466);

    // Weak enemies on platforms
    this.addEnemy3D(5, 2, 0, 'weak', 1, 1);
    this.addEnemy3D(13, 2, 0, 'weak', 1, 0.8);
    this.addEnemy3D(45, 3, 0, 'weak', 1.5, 1.2);
    this.addEnemy3D(55, 3, 0, 'weak', 3, 0.8);
    this.addEnemy3D(69, 3.5, 0, 'weak', 1, 1);
    this.addEnemy3D(80, 3, 0, 'weak', 2, 1.5);

    // Strong enemies - 1 chasing, 1 patrolling
    this.addEnemy3D(40, 3, 0, 'strong', 8, 2, true); // chaser
    this.addEnemy3D(60, 3, 0, 'strong', 5, 1.5);

    // Goal
    const goalGeo = new THREE.CylinderGeometry(0.3, 0.3, 5, 8);
    const goalMat = new THREE.MeshLambertMaterial({ color: 0xffdd00, emissive: 0x664400 });
    this.goalMesh = new THREE.Mesh(goalGeo, goalMat);
    this.goalMesh.position.set(82, 4, 0);
    this.threeScene.add(this.goalMesh);
    this.goalBox = new THREE.Box3().setFromObject(this.goalMesh);
  }

  private addPlatform3D(x: number, y: number, z: number, w: number, h: number, d: number, color: number, crumbling = false, moving = false, moveAxis?: string, moveRange?: number, moveSpeed?: number, rotating = false, rotSpeed?: number) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.threeScene.add(mesh);

    this.platforms.push({
      mesh,
      box: new THREE.Box3().setFromObject(mesh),
      crumbling,
      state: crumbling ? 'solid' : undefined,
      timer: 0,
      respawnTimer: 0,
      moving,
      moveAxis,
      moveRange,
      moveSpeed,
      startPos: new THREE.Vector3(x, y, z),
      rotating,
      rotSpeed,
    });
  }

  private addEnemy3D(x: number, y: number, z: number, type: 'weak' | 'strong', range: number, speed: number, chasing = false) {
    const geo = type === 'weak'
      ? new THREE.SphereGeometry(0.4, 8, 8)
      : new THREE.OctahedronGeometry(0.5);
    const mat = new THREE.MeshLambertMaterial({
      color: type === 'weak' ? 0x44cc44 : 0xff2222,
      emissive: type === 'weak' ? 0x112211 : 0x440000,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    this.threeScene.add(mesh);

    this.enemies.push({
      mesh, type,
      startPos: new THREE.Vector3(x, y, z),
      range, speed, alive: true, chasing,
    });
  }

  update(time: number, delta: number) {
    if (!this.threeRenderer) return;
    inputManager.update();
    const dt = delta / 1000;

    if (!this.isDead) {
      const moveSpeed = 6;
      const forward = new THREE.Vector3(-Math.sin(this.cameraAngle), 0, -Math.cos(this.cameraAngle));
      const right = new THREE.Vector3(Math.cos(this.cameraAngle), 0, -Math.sin(this.cameraAngle));

      if (inputManager.left) {
        this.playerVelocity.x = -moveSpeed * right.x;
        this.playerVelocity.z = -moveSpeed * right.z;
      } else if (inputManager.right) {
        this.playerVelocity.x = moveSpeed * right.x;
        this.playerVelocity.z = moveSpeed * right.z;
      } else {
        this.playerVelocity.x *= 0.85;
        this.playerVelocity.z *= 0.85;
      }

      if (inputManager.up) {
        this.playerVelocity.x += moveSpeed * forward.x * dt * 10;
        this.playerVelocity.z += moveSpeed * forward.z * dt * 10;
      } else if (inputManager.down) {
        this.playerVelocity.x -= moveSpeed * forward.x * dt * 10;
        this.playerVelocity.z -= moveSpeed * forward.z * dt * 10;
      }

      // Clamp horizontal speed
      const hSpeed = Math.sqrt(this.playerVelocity.x ** 2 + this.playerVelocity.z ** 2);
      if (hSpeed > moveSpeed) {
        this.playerVelocity.x *= moveSpeed / hSpeed;
        this.playerVelocity.z *= moveSpeed / hSpeed;
      }

      this.playerVelocity.y -= 20 * dt;

      if (inputManager.jump && this.playerOnGround) {
        this.playerVelocity.y = 8;
      }

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
          if (this.playerVelocity.y <= 0 && this.playerPos.y - 0.5 >= platTop - 0.4) {
            this.playerPos.y = platTop + 0.5;
            this.playerVelocity.y = 0;
            this.playerOnGround = true;

            if (plat.crumbling && plat.state === 'solid') {
              plat.state = 'shaking';
              plat.timer = 1000;
            }
          } else if (this.playerVelocity.y > 0) {
            this.playerVelocity.y = 0;
          } else {
            const dx = this.playerPos.x - plat.mesh.position.x;
            const dz = this.playerPos.z - plat.mesh.position.z;
            if (Math.abs(dx) > Math.abs(dz)) {
              this.playerPos.x += Math.sign(dx) * 0.1;
            } else {
              this.playerPos.z += Math.sign(dz) * 0.1;
            }
          }
        }
      }

      if (this.playerPos.y < -15) this.die();

      // Enemy collision
      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        const dist = this.playerPos.distanceTo(enemy.mesh.position);
        if (dist < 0.8) {
          if (enemy.type === 'weak' && this.playerVelocity.y < 0 && this.playerPos.y > enemy.mesh.position.y) {
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
      if (playerBox.intersectsBox(this.goalBox)) this.win();

      this.cameraAngle += inputManager.rightStickX * 2 * dt;
    }

    // Update moving platforms
    for (const plat of this.platforms) {
      if (plat.moving && plat.startPos) {
        const t = time / 1000 * (plat.moveSpeed || 1);
        if (plat.moveAxis === 'x') {
          plat.mesh.position.x = plat.startPos.x + Math.sin(t) * (plat.moveRange || 3);
        } else if (plat.moveAxis === 'z') {
          plat.mesh.position.z = plat.startPos.z + Math.sin(t) * (plat.moveRange || 3);
        }
      }
      if (plat.rotating) {
        plat.mesh.rotation.y += (plat.rotSpeed || 0.5) * dt;
      }

      // Crumbling
      if (plat.crumbling) {
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
            if (plat.startPos) plat.mesh.position.copy(plat.startPos);
          }
        }
      }
    }

    // Update enemies
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      if (enemy.chasing && !this.isDead) {
        // Chase player
        const dir = new THREE.Vector3().subVectors(this.playerPos, enemy.mesh.position).normalize();
        enemy.mesh.position.x += dir.x * enemy.speed * dt;
        enemy.mesh.position.z += dir.z * enemy.speed * dt;
      } else {
        enemy.mesh.position.x = enemy.startPos.x + Math.sin(time / 1000 * enemy.speed) * enemy.range;
      }
      enemy.mesh.rotation.y += 0.03;
    }

    this.playerMesh.position.copy(this.playerPos);
    this.goalMesh.rotation.y += 0.02;

    // Camera
    const camX = this.playerPos.x + Math.sin(this.cameraAngle) * this.cameraDistance;
    const camY = this.playerPos.y + this.cameraDistance * this.cameraPitch + 2;
    const camZ = this.playerPos.z + Math.cos(this.cameraAngle) * this.cameraDistance;
    this.threeCamera.position.set(camX, camY, camZ);
    this.threeCamera.lookAt(this.playerPos.x, this.playerPos.y + 0.5, this.playerPos.z);

    this.threeRenderer.render(this.threeScene, this.threeCamera);

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
    this.threeRenderer.setClearColor(0x220000);
    this.time.delayedCall(300, () => {
      this.threeRenderer.setClearColor(0x000022);
      this.isDead = false;
      this.playerPos.copy(this.startPos);
      this.playerVelocity.set(0, 0, 0);
    });
  }

  private win() {
    const time = this.timer.stop();
    this.cleanup();
    this.scene.start('Result', {
      stageNum: 5,
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
