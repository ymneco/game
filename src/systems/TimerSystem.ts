export class TimerSystem {
  private startTime: number = 0;
  private elapsed: number = 0;
  private running: boolean = false;

  start() {
    this.startTime = performance.now();
    this.elapsed = 0;
    this.running = true;
  }

  stop(): number {
    if (this.running) {
      this.elapsed = (performance.now() - this.startTime) / 1000;
      this.running = false;
    }
    return this.elapsed;
  }

  getElapsed(): number {
    if (this.running) {
      return (performance.now() - this.startTime) / 1000;
    }
    return this.elapsed;
  }

  isRunning(): boolean {
    return this.running;
  }

  format(time?: number): string {
    const t = time ?? this.getElapsed();
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    const ms = Math.floor((t * 100) % 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }
}
