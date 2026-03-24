import Phaser from 'phaser';
import { RecordSystem } from '../systems/RecordSystem';
import { TimerSystem } from '../systems/TimerSystem';
import { UnlockSystem } from '../systems/UnlockSystem';

export class StageSelect extends Phaser.Scene {
  private timer = new TimerSystem();

  constructor() {
    super({ key: 'StageSelect' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    this.cameras.main.fadeIn(400);

    this.add.text(400, 55, '- the rules don\'t play by the book -', {
      fontSize: '20px',
      color: '#887766',
      fontFamily: 'Caveat, cursive',
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
      const stageNum = i + 1;
      const y = 135 + i * 90;
      const unlocked = UnlockSystem.isUnlocked(stageNum);
      const cleared = UnlockSystem.isCleared(stageNum);
      const record = RecordSystem.load(stageNum);

      if (unlocked) {
        // Unlocked stage
        const bg = this.add.rectangle(400, y, 500, 60, cleared ? 0x2a3a4a : 0x333355)
          .setInteractive({ useHandCursor: true })
          .on('pointerover', () => bg.setFillStyle(0x555577))
          .on('pointerout', () => bg.setFillStyle(cleared ? 0x2a3a4a : 0x333355))
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

        if (cleared) {
          // Checkmark for cleared
          this.add.text(155, y - 12, '\u2713', {
            fontSize: '18px',
            color: '#44ff44',
            fontFamily: 'monospace',
          }).setOrigin(0.5);
        }

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
      } else {
        // Locked stage
        const bg = this.add.rectangle(400, y, 500, 60, 0x1a1a22)
          .setInteractive({ cursor: 'not-allowed' });

        this.add.text(180, y - 12, info.name, {
          fontSize: '20px',
          color: '#444455',
          fontFamily: 'monospace',
        }).setOrigin(0, 0.5);

        this.add.text(180, y + 12, `[${info.diff}]`, {
          fontSize: '14px',
          color: '#333344',
          fontFamily: 'monospace',
        }).setOrigin(0, 0.5);

        // Lock icon
        this.add.text(580, y, '\u{1F512}', {
          fontSize: '24px',
        }).setOrigin(0.5);
      }
    });

    this.add.text(400, 565, 'WASD/Arrows: Move | Space/Z: Jump | Gamepad supported', {
      fontSize: '12px',
      color: '#555566',
      fontFamily: 'monospace',
    }).setOrigin(0.5);
  }
}
