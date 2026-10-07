import Phaser from 'phaser';
import BootScene from '../scenes/BootScene';
import MenuScene from '../scenes/MenuScene';

export function createPhaserConfig(parentElement) {
  return {
    type: Phaser.AUTO,
    transparent: true,
    parent: parentElement,
    width: parentElement.clientWidth || window.innerWidth,
    height: parentElement.clientHeight || window.innerHeight,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.NO_CENTER,
    },
    physics: {
      default: 'arcade',
      arcade: { debug: false },
    },
    scene: [BootScene, MenuScene],
  };
}
