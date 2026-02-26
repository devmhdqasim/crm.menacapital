/**
 * MP3 Encoder wrapper for lamejs.
 *
 * The lamejs npm package has broken CJS requires that fail with Vite/ESM bundlers.
 * We load the pre-bundled lame.min.js as raw text and execute it to get Mp3Encoder.
 */
import lameSource from 'lamejs/lame.min.js?raw';

const fn = new Function(lameSource + '\nreturn lamejs;');
const lamejs = fn();

export const Mp3Encoder = lamejs.Mp3Encoder;
