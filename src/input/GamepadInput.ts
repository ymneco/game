export class GamepadInput {
  private prevButtons: boolean[] = [];
  private currButtons: boolean[] = [];
  private axes: number[] = [0, 0, 0, 0];

  update() {
    const gamepads = navigator.getGamepads();
    const gp = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3];
    if (!gp) {
      this.currButtons = [];
      this.axes = [0, 0, 0, 0];
      return;
    }

    this.prevButtons = [...this.currButtons];
    this.currButtons = gp.buttons.map(b => b.pressed);
    this.axes = [...gp.axes];
  }

  private buttonDown(index: number): boolean {
    return this.currButtons[index] || false;
  }

  private buttonJustDown(index: number): boolean {
    return (this.currButtons[index] || false) && !(this.prevButtons[index] || false);
  }

  get leftStickX(): number {
    const v = this.axes[0] || 0;
    return Math.abs(v) > 0.15 ? v : 0;
  }

  get leftStickY(): number {
    const v = this.axes[1] || 0;
    return Math.abs(v) > 0.15 ? v : 0;
  }

  get rightStickX(): number {
    const v = this.axes[2] || 0;
    return Math.abs(v) > 0.15 ? v : 0;
  }

  get rightStickY(): number {
    const v = this.axes[3] || 0;
    return Math.abs(v) > 0.15 ? v : 0;
  }

  get left(): boolean {
    return this.leftStickX < -0.15 || this.buttonDown(14);
  }

  get right(): boolean {
    return this.leftStickX > 0.15 || this.buttonDown(15);
  }

  get up(): boolean {
    return this.leftStickY < -0.15 || this.buttonDown(12);
  }

  get down(): boolean {
    return this.leftStickY > 0.15 || this.buttonDown(13);
  }

  // A button (Xbox) / Cross (PS)
  get jump(): boolean {
    return this.buttonJustDown(0);
  }
}
