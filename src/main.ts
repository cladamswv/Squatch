import './style.css';
import { SquatchCrossingGame } from './game';

const boot=document.getElementById('boot-status') as HTMLElement | null;

function messageOf(value:unknown):string {
  if (value instanceof Error) return value.message || value.name;
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value); } catch { return String(value); }
}

function escapeHtml(text:string):string {
  const map:Record<string,string>={'<':'&lt;','>':'&gt;','&':'&amp;'};
  return text.replace(/[<>&]/g,c=>map[c] ?? c);
}

function fatal(value:unknown) {
  const text=messageOf(value);
  console.error('Squatch Crossing boot error:',value);
  if (boot) {
    boot.classList.add('failed');
    boot.innerHTML=`<strong>Squatch Crossing couldn't start.</strong><span>${escapeHtml(text)}</span><small>Take a screenshot of this message and send it to Lori.</small>`;
  }
}

window.addEventListener('error',e=>fatal(e.error ?? e.message));
window.addEventListener('unhandledrejection',e=>fatal(e.reason));

requestAnimationFrame(()=>{
  try {
    const canvas=document.getElementById('game-canvas') as HTMLCanvasElement | null;
    const uiRoot=document.getElementById('ui-root') as HTMLElement | null;
    if(!canvas||!uiRoot) throw new Error('Boot elements are missing from index.html.');
    new SquatchCrossingGame(canvas,uiRoot);
    if (boot) {
      boot.classList.add('ready');
      setTimeout(()=>boot.remove(),450);
    }
  } catch (err) {
    fatal(err);
  }
});
