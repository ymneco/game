import { KeyboardInput } from './KeyboardInput';
import { GamepadInput } from './GamepadInput';

export class InputManager {
  keyboard: KeyboardInput;
  gamepad: GamepadInput;

  constructor() {
    this.keyboard = new KeyboardInput();
    this.gamepad = new GamepadInput();
  }

  update() {
    this.keyboard.update();
    this.gamepad.update();
  }

  get left(): boolean {
    return this.keyboard.left || this.gamepad.left;
  }

  get right(): boolean {
    return this.keyboard.right || this.gamepad.right;
  }

  get up(): boolean {
    return this.keyboard.up || this.gamepad.up;
  }

  get down(): boolean {
    return this.keyboard.down || this.gamepad.down;
  }

  get jump(): boolean {
    return this.keyboard.jump || this.gamepad.jump;
  }

  get rightStickX(): number {
    return this.gamepad.rightStickX;
  }

  get rightStickY(): number {
    return this.gamepad.rightStickY;
  }
}

export const inputManager = new InputManager();
