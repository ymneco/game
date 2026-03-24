const STORAGE_KEY = 'deathrun_game_unlocked';

export class UnlockSystem {
  static getUnlockedStage(): number {
    const val = localStorage.getItem(STORAGE_KEY);
    return val ? parseInt(val, 10) : 1;
  }

  static unlockStage(stageNum: number) {
    const current = this.getUnlockedStage();
    if (stageNum > current) {
      localStorage.setItem(STORAGE_KEY, stageNum.toString());
    }
  }

  static isUnlocked(stageNum: number): boolean {
    return stageNum <= this.getUnlockedStage();
  }

  static isCleared(stageNum: number): boolean {
    return stageNum < this.getUnlockedStage();
  }
}
