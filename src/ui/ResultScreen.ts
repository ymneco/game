import Phaser from 'phaser';
import { RecordSystem } from '../systems/RecordSystem';
import { TimerSystem } from '../systems/TimerSystem';
import { UnlockSystem } from '../systems/UnlockSystem';

export class ResultScene extends Phaser.Scene {
  private timer = new TimerSystem();

  constructor() {
    super({ key: 'Result' });
  }

  create(data: { stageNum: number; time: number; deaths: number }) {
    const { stageNum, time, deaths } = data;
    const record = RecordSystem.save(stageNum, time, deaths);
    // Unlock next stage
    UnlockSystem.unlockStage(stageNum + 1);
    const rank = RecordSystem.getRank(stageNum, time, deaths);

    this.cameras.main.setBackgroundColor('#1a1a2e');

    this.add.text(400, 60, 'STAGE CLEAR!', {
      fontSize: '40px',
      color: '#44ff44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(400, 120, `Stage ${stageNum}`, {
      fontSize: '24px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Time
    this.add.text(300, 200, 'Time:', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0, 0.5);

    this.add.text(500, 200, this.timer.format(time), {
      fontSize: '28px',
      color: '#ffff44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    // Deaths
    this.add.text(300, 260, 'Deaths:', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0, 0.5);

    this.add.text(500, 260, `${deaths}`, {
      fontSize: '28px',
      color: '#ff4444',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    // Rank
    const rankColors: Record<string, string> = {
      'S': '#ffdd00',
      'A': '#44ff44',
      'B': '#4488ff',
      'C': '#aaaaaa',
    };

    this.add.text(400, 340, `Rank: ${rank}`, {
      fontSize: '48px',
      color: rankColors[rank] || '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Best record
    if (record.bestTime < time) {
      this.add.text(400, 410, `Best Time: ${this.timer.format(record.bestTime)}`, {
        fontSize: '16px',
        color: '#88ff88',
        fontFamily: 'monospace',
      }).setOrigin(0.5);
    }

    // Buttons
    const nextStage = stageNum < 5 ? `Stage${stageNum + 1}` : null;

    const retryBg = this.add.rectangle(300, 500, 180, 50, 0x444466)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => retryBg.setFillStyle(0x666688))
      .on('pointerout', () => retryBg.setFillStyle(0x444466))
      .on('pointerdown', () => this.scene.start(`Stage${stageNum}`));

    this.add.text(300, 500, 'RETRY', {
      fontSize: '20px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);

    if (nextStage) {
      const nextBg = this.add.rectangle(500, 500, 180, 50, 0x446644)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => nextBg.setFillStyle(0x668866))
        .on('pointerout', () => nextBg.setFillStyle(0x446644))
        .on('pointerdown', () => this.scene.start(nextStage));

      this.add.text(500, 500, 'NEXT', {
        fontSize: '20px', color: '#ffffff', fontFamily: 'monospace',
      }).setOrigin(0.5);
    }

    const menuBg = this.add.rectangle(400, 560, 180, 40, 0x333344)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => menuBg.setFillStyle(0x555566))
      .on('pointerout', () => menuBg.setFillStyle(0x333344))
      .on('pointerdown', () => this.scene.start('StageSelect'));

    this.add.text(400, 560, 'MENU', {
      fontSize: '16px', color: '#aaaaaa', fontFamily: 'monospace',
    }).setOrigin(0.5);
  }
}
