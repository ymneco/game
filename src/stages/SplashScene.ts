import Phaser from 'phaser';

export class SplashScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Splash' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#000000');

    const enText = this.add.text(400, 300, 'Beyond this point,\nthe rules don\'t play by the book.\n\nThere\'s no tidy,\npredictable ending here.', {
      fontSize: '32px',
      color: '#F5F0E8',
      fontFamily: 'Caveat, cursive',
      fontStyle: 'bold',
      align: 'center',
      lineSpacing: 10,
    }).setOrigin(0.5).setAngle(1.5).setAlpha(0);

    // Fade in
    this.tweens.add({
      targets: enText,
      alpha: 1,
      duration: 400,
    });

    // After 1.5s, fade out then transition
    this.time.delayedCall(1800, () => {
      this.tweens.add({
        targets: enText,
        alpha: 0,
        duration: 600,
      });
    });

    // Scene transition after total ~2.5s
    this.time.delayedCall(2500, () => {
      this.scene.start('StageSelect');
    });
  }
}
