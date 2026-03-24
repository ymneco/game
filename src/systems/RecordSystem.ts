export interface StageRecord {
  bestTime: number;
  bestDeaths: number;
  rank: string;
}

export class RecordSystem {
  static getRank(stageNum: number, time: number, deaths: number): string {
    const targets: Record<number, number[]> = {
      1: [30, 45, 60],
      2: [60, 90, 120],
      3: [90, 120, 180],
      4: [120, 180, 240],
      5: [150, 210, 300],
    };
    const t = targets[stageNum] || [60, 120, 180];
    if (time <= t[0] && deaths <= 3) return 'S';
    if (time <= t[1] && deaths <= 10) return 'A';
    if (time <= t[2]) return 'B';
    return 'C';
  }

  static save(stageNum: number, time: number, deaths: number): StageRecord {
    const key = `deathrun_stage_${stageNum}`;
    const existing = this.load(stageNum);
    const rank = this.getRank(stageNum, time, deaths);
    const record: StageRecord = {
      bestTime: existing ? Math.min(existing.bestTime, time) : time,
      bestDeaths: existing ? Math.min(existing.bestDeaths, deaths) : deaths,
      rank,
    };
    localStorage.setItem(key, JSON.stringify(record));
    return record;
  }

  static load(stageNum: number): StageRecord | null {
    const key = `deathrun_stage_${stageNum}`;
    const data = localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data);
  }
}
