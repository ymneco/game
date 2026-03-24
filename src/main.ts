import Phaser from 'phaser';
import { StageSelect } from './stages/StageSelect';
import { Stage1 } from './stages/Stage1';
import { Stage2 } from './stages/Stage2';
import { Stage3Scene } from './stages/Stage3';
import { Stage4 } from './stages/Stage4';
import { Stage5Scene } from './stages/Stage5';
import { ResultScene } from './ui/ResultScreen';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#222233',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 1000 },
      debug: false,
    },
  },
  scene: [StageSelect, Stage1, Stage2, Stage3Scene, Stage4, Stage5Scene, ResultScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

const game = new Phaser.Game(config);
(window as any).__game = game;
