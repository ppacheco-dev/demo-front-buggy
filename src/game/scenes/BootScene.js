import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const { width, height } = this.scale;

    // Loading background & bar
    const progressBox = this.add.graphics();
    const progressBar = this.add.graphics();
    
    const boxWidth = Math.min(320, width * 0.7);
    const boxHeight = 16;
    const boxX = (width - boxWidth) / 2;
    const boxY = height / 2;

    progressBox.fillStyle(0x0d1117, 0.8);
    progressBox.fillRoundedRect(boxX, boxY, boxWidth, boxHeight, 8);
    progressBox.lineStyle(2, 0xf59e0b, 0.6);
    progressBox.strokeRoundedRect(boxX, boxY, boxWidth, boxHeight, 8);

    const loadingText = this.add.text(width / 2, boxY - 24, 'CARGANDO BUGGY...', {
      fontFamily: 'Montserrat, system-ui, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#f59e0b',
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xfbbf24, 1);
      const innerPadding = 3;
      const innerWidth = (boxWidth - innerPadding * 2) * value;
      if (innerWidth > 0) {
        progressBar.fillRoundedRect(boxX + innerPadding, boxY + innerPadding, innerWidth, boxHeight - innerPadding * 2, 5);
      }
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Load assets
    // Beach buggy background (desktop y móvil)
    this.load.image('background', '/assets/images/background.webp');
    this.load.image('background_clean', '/assets/images/background.webp');
    this.load.image('fondomovil', '/assets/images/fondomovil.webp');

    // Title logo
    this.load.image('logo', '/assets/images/logo.webp');

    // Play button
    this.load.image('btn_jugar', '/assets/images/btn_jugar.webp');

    // Sounds: actualmente removidos hasta incorporar los definitivos
  }

  create() {
    this.scene.start('MenuScene');
  }
}
