import Phaser from 'phaser';

export class SplashScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Splash' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#000000');

    // English text only
    const enText = this.add.text(400, 300, 'Beyond this point,\nthe rules don\'t play by the book.\n\nThere\'s no tidy,\npredictable ending here.', {
      fontSize: '32px',
      color: '#F5F0E8',
      fontFamily: 'Caveat, cursive',
      fontStyle: 'bold',
      align: 'center',
      lineSpacing: 10,
    }).setOrigin(0.5).setAngle(1.5);

    // Wait 1.5s then fade out over 0.6s
    this.time.delayedCall(1500, () => {
      this.tweens.add({
        targets: enText,
        alpha: 0,
        duration: 600,
        onComplete: () => {
          this.scene.start('StageSelect');
        },
      });
      this.cameras.main.fadeOut(600, 0, 0, 0);
    });
  }
}
