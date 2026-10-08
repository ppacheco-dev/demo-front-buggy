import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.scale;

    // 1. Fondo (Scene background)
    this.bg = this.add.image(width / 2, height / 2, 'background');
    this.bg.setOrigin(0.5, 0.5);

    // 2. Logo BUGGY
    this.logo = this.add.image(width / 2, height * 0.24, 'logo');
    this.logo.setOrigin(0.5, 0.5);

    // Animación sutil de levitación para el logo
    this.logoTween = this.tweens.add({
      targets: this.logo,
      y: '-=10',
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 3. Botón JUGAR
    this.btnPlay = this.add.image(width / 2, height * 0.86, 'btn_jugar');
    this.btnPlay.setOrigin(0.5, 0.5);
    this.btnPlay.setInteractive({ useHandCursor: true });

    // Configuración de escalas iniciales
    this.applyResponsiveLayout(width, height);

    // Animación de pulso continuo en el botón
    this.startBtnPulse();

    // Eventos interactivos del botón JUGAR
    this.btnPlay.on('pointerover', () => {
      this.stopBtnPulse();
      this.tweens.add({
        targets: this.btnPlay,
        scaleX: this.btnBaseScale * 1.08,
        scaleY: this.btnBaseScale * 1.08,
        duration: 160,
        ease: 'Quad.easeOut',
      });
      this.btnPlay.setTint(0xfff5cc);
    });

    this.btnPlay.on('pointerout', () => {
      this.btnPlay.clearTint();
      this.tweens.add({
        targets: this.btnPlay,
        scaleX: this.btnBaseScale,
        scaleY: this.btnBaseScale,
        duration: 160,
        ease: 'Quad.easeOut',
        onComplete: () => this.startBtnPulse(),
      });
    });

    this.btnPlay.on('pointerdown', () => {
      this.tweens.add({
        targets: this.btnPlay,
        scaleX: this.btnBaseScale * 0.94,
        scaleY: this.btnBaseScale * 0.94,
        duration: 80,
        ease: 'Quad.easeInOut',
      });
    });

    this.btnPlay.on('pointerup', () => {
      this.tweens.add({
        targets: this.btnPlay,
        scaleX: this.btnBaseScale * 1.08,
        scaleY: this.btnBaseScale * 1.08,
        duration: 120,
        ease: 'Back.easeOut',
      });

      // Notificar a la app React que se presionó Jugar
      window.dispatchEvent(
        new CustomEvent('game:play-clicked', {
          detail: {
            timestamp: Date.now(),
          },
        })
      );
    });

    // Escuchar redimensionamiento de pantalla
    this.scale.on('resize', this.handleResize, this);

    // Sincronización de audio con la interfaz React
    this.setupAudioListeners();

    // Sincronización de cambio de pantalla (menu vs selection)
    this.setupScreenListeners();

    // Notificar a React que el juego visual está listo
    window.dispatchEvent(new CustomEvent('game:visual-ready'));
  }

  startBtnPulse() {
    if (this.btnPulseTween) {
      this.btnPulseTween.stop();
    }
    this.btnPulseTween = this.tweens.add({
      targets: this.btnPlay,
      scaleX: this.btnBaseScale * 1.04,
      scaleY: this.btnBaseScale * 1.04,
      duration: 850,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  stopBtnPulse() {
    if (this.btnPulseTween) {
      this.btnPulseTween.stop();
    }
  }

  playClickSound() {
    // Sonido temporalmente desactivado a la espera de los audios definitivos
    try {
      if (this.sound && this.cache.audio.exists('click')) {
        const isMuted = this.game.registry.get('soundMuted');
        if (!isMuted) {
          const sfxVolume = (this.game.registry.get('effectsVolume') ?? 100) / 100;
          this.sound.play('click', { volume: sfxVolume * 0.8 });
        }
      }
    } catch (e) {
      console.warn('[Phaser] Audio play warning:', e);
    }
  }

  applyResponsiveLayout(width, height) {
    const isPortrait = height > width;

    // 1. Fondo: cubre toda la ventana sin deformarse
    if (this.bg && this.bg.width && this.bg.height) {
      const scaleX = width / this.bg.width;
      const scaleY = height / this.bg.height;
      const bgScale = Math.max(scaleX, scaleY);
      this.bg.setPosition(width / 2, height / 2);
      this.bg.setScale(bgScale);
    }

    // 2. Logo: centrado en la parte superior (protagonismo ampliado)
    if (this.logo && this.logo.width) {
      const maxLogoW = isPortrait ? width * 1.05 : Math.min(width * 0.90, 1080);
      const baseLogoScale = maxLogoW / this.logo.width;
      const logoScale = isPortrait ? baseLogoScale * 1.35 : baseLogoScale * 1.42;
      const logoY = isPortrait ? height * 0.23 : height * 0.26;

      this.logo.setPosition(width / 2, logoY);
      this.logo.setScale(logoScale);
    }

    // 3. Botón JUGAR: centrado en la parte inferior (escala media óptima ~430px)
    if (this.btnPlay && this.btnPlay.width) {
      const maxBtnW = isPortrait ? Math.min(width * 0.76, 360) : Math.min(width * 0.38, 430);
      this.btnBaseScale = maxBtnW / this.btnPlay.width;
      const btnY = isPortrait ? height * 0.85 : height * 0.86;

      this.btnPlay.setPosition(width / 2, btnY);
      this.btnPlay.setScale(this.btnBaseScale);
    }
  }

  handleResize(gameSize) {
    const { width, height } = gameSize;
    this.applyResponsiveLayout(width, height);
    this.startBtnPulse();
  }

  setupAudioListeners() {
    this.audioToggleHandler = (event) => {
      const { muted } = event.detail;
      this.game.registry.set('soundMuted', muted);
      if (this.sound) {
        this.sound.mute = muted;
      }
    };

    this.audioVolumeHandler = (event) => {
      const { music, effects } = event.detail;
      this.game.registry.set('musicVolume', music);
      this.game.registry.set('effectsVolume', effects);
    };

    window.addEventListener('game:audio-toggle', this.audioToggleHandler);
    window.addEventListener('game:audio-volume', this.audioVolumeHandler);

    this.events.once('shutdown', () => {
      window.removeEventListener('game:audio-toggle', this.audioToggleHandler);
      window.removeEventListener('game:audio-volume', this.audioVolumeHandler);
    });
  }

  setupScreenListeners() {
    this.screenChangeHandler = (event) => {
      const screen = event.detail?.screen || 'menu';
      const isMenu = screen === 'menu';

      if (this.logo) {
        this.tweens.add({
          targets: this.logo,
          alpha: isMenu ? 1 : 0,
          duration: 200,
          onComplete: () => {
            if (this.logo) this.logo.setVisible(isMenu);
          },
        });
      }

      if (this.btnPlay) {
        this.tweens.add({
          targets: this.btnPlay,
          alpha: isMenu ? 1 : 0,
          duration: 200,
          onComplete: () => {
            if (this.btnPlay) {
              this.btnPlay.setVisible(isMenu);
              if (isMenu) {
                this.btnPlay.setScale(this.btnBaseScale);
                this.startBtnPulse();
              } else {
                this.stopBtnPulse();
              }
            }
          },
        });
      }
    };

    window.addEventListener('game:screen-change', this.screenChangeHandler);

    this.events.once('shutdown', () => {
      window.removeEventListener('game:screen-change', this.screenChangeHandler);
    });
  }
}
