import Phaser from 'phaser';
import { RecordSystem } from '../systems/RecordSystem';
import { TimerSystem } from '../systems/TimerSystem';

export class StageSelect extends Phaser.Scene {
  private timer = new TimerSystem();

  constructor() {
    super({ key: 'StageSelect' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    this.add.text(400, 60, 'DEATH RUN', {
      fontSize: '48px',
      color: '#ff4444',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(400, 110, 'Time Attack Action', {
      fontSize: '18px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    const stageInfo = [
      { name: 'Stage 1 - Grassland', diff: 'Easy', color: '#44ff44' },
      { name: 'Stage 2 - Ruins', diff: 'Normal', color: '#ffff44' },
      { name: 'Stage 3 - Desert 3D', diff: 'Normal', color: '#ffaa44' },
      { name: 'Stage 4 - Lava Castle', diff: 'Hard', color: '#ff4444' },
      { name: 'Stage 5 - Space 3D', diff: 'Hard', color: '#ff2222' },
    ];

    const sceneKeys = ['Stage1', 'Stage2', 'Stage3', 'Stage4', 'Stage5'];

    stageInfo.forEach((info, i) => {
      const y = 190 + i * 80;
      const record = RecordSystem.load(i + 1);

      const bg = this.add.rectangle(400, y, 500, 60, 0x333355)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => bg.setFillStyle(0x555577))
        .on('pointerout', () => bg.setFillStyle(0x333355))
        .on('pointerdown', () => {
          this.scene.start(sceneKeys[i]);
        });

      this.add.text(180, y - 12, info.name, {
        fontSize: '20px',
        color: '#ffffff',
        fontFamily: 'monospace',
      }).setOrigin(0, 0.5);

      this.add.text(180, y + 12, `[${info.diff}]`, {
        fontSize: '14px',
        color: info.color,
        fontFamily: 'monospace',
      }).setOrigin(0, 0.5);

      if (record) {
        this.add.text(580, y - 8, `Best: ${this.timer.format(record.bestTime)}`, {
          fontSize: '13px',
          color: '#88ff88',
          fontFamily: 'monospace',
        }).setOrigin(0.5);
        this.add.text(580, y + 10, `Rank: ${record.rank}`, {
          fontSize: '13px',
          color: record.rank === 'S' ? '#ffdd00' : '#aaaaaa',
          fontFamily: 'monospace',
        }).setOrigin(0.5);
      }
    });

    this.add.text(400, 560, 'WASD/Arrows: Move | Space/Z: Jump | Gamepad supported', {
      fontSize: '13px',
      color: '#666688',
      fontFamily: 'monospace',
    }).setOrigin(0.5);
  }
}
