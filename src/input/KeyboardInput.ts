export class KeyboardInput {
  private keys: Set<string> = new Set();
  private justPressed: Set<string> = new Set();
  private prevKeys: Set<string> = new Set();

  constructor() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
  }

  update() {
    this.justPressed.clear();
    for (const key of this.keys) {
      if (!this.prevKeys.has(key)) {
        this.justPressed.add(key);
      }
    }
    this.prevKeys = new Set(this.keys);
  }

  isDown(code: string): boolean {
    return this.keys.has(code);
  }

  isJustDown(code: string): boolean {
    return this.justPressed.has(code);
  }

  get left(): boolean {
    return this.isDown('ArrowLeft') || this.isDown('KeyA');
  }

  get right(): boolean {
    return this.isDown('ArrowRight') || this.isDown('KeyD');
  }

  get up(): boolean {
    return this.isDown('ArrowUp') || this.isDown('KeyW');
  }

  get down(): boolean {
    return this.isDown('ArrowDown') || this.isDown('KeyS');
  }

  get jump(): boolean {
    return this.isJustDown('Space') || this.isJustDown('KeyZ');
  }
}
