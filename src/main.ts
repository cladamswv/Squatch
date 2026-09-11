import './style.css';
import { SquatchCrossingGame } from './game';

const canvas=document.getElementById('game-canvas') as HTMLCanvasElement | null;
const uiRoot=document.getElementById('ui-root') as HTMLElement | null;
if(!canvas||!uiRoot) throw new Error('Squatch Crossing boot elements are missing.');

new SquatchCrossingGame(canvas,uiRoot);
