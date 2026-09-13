// Original, quiet music synthesized locally. Started only after the player's gesture.
export class CafeAudio {
 private context:AudioContext|null=null;private timer:ReturnType<typeof setInterval>|null=null;private n=0;
 start(){if(this.timer)return;this.context=new AudioContext();void this.context.resume();const notes=[261.63,329.63,392,329.63,293.66,349.23,440,349.23,220,261.63,329.63,261.63,196,246.94,293.66,246.94];
 const play=()=>{if(!this.context)return;const c=this.context,o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=notes[this.n++%notes.length];g.gain.setValueAtTime(0,c.currentTime);g.gain.linearRampToValueAtTime(.024,c.currentTime+.03);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.55);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.6);};play();this.timer=setInterval(play,420);}
 stop(){if(this.timer)clearInterval(this.timer);this.timer=null;void this.context?.close();this.context=null;}
}
