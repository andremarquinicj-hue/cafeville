"use client";

import { useEffect, useRef } from "react";

export default function CafeGame() {
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let game: any;
    let mounted = true;

    (async () => {
      const Phaser = (await import("phaser")).default;
      if (!mounted || !gameRef.current) return;

      class CafeScene extends Phaser.Scene {
        create() {
          const w = 960, h = 540;
          this.cameras.main.setBackgroundColor("#b9d88f");

          const floor = this.add.graphics();
          floor.fillStyle(0xf3d7a0, 1);
          floor.lineStyle(3, 0x7c4f2c, 1);
          floor.fillPoints([
            new Phaser.Geom.Point(480, 55),
            new Phaser.Geom.Point(860, 245),
            new Phaser.Geom.Point(480, 465),
            new Phaser.Geom.Point(100, 245),
          ], true);
          floor.strokePoints([
            new Phaser.Geom.Point(480, 55),
            new Phaser.Geom.Point(860, 245),
            new Phaser.Geom.Point(480, 465),
            new Phaser.Geom.Point(100, 245),
          ], true);

          for (let i = -5; i <= 5; i++) {
            const g = this.add.graphics();
            g.lineStyle(1, 0xd7b77d, .55);
            g.beginPath();
            g.moveTo(100 + Math.abs(i) * 38, 245 + i * 19);
            g.lineTo(480 + i * 38, 465 - Math.abs(i) * 19);
            g.strokePath();
          }

          const shadow = (x:number,y:number) => this.add.ellipse(x,y+20,58,22,0x6d5b48,.20);
          const table = (x:number,y:number) => {
            shadow(x,y);
            this.add.rectangle(x,y,100,58,0x9d6235).setStrokeStyle(3,0x654026);
            this.add.circle(x-55,y,18,0xc75f49); this.add.circle(x+55,y,18,0xc75f49);
            this.add.text(x-17,y-16,"🍽️",{fontSize:"30px"});
          };
          table(330,260); table(610,300); table(485,380);

          const counter = this.add.rectangle(560,145,320,72,0x875331).setStrokeStyle(4,0x54311e);
          this.add.text(430,115,"🍞  🥐  🍕  ☕",{fontSize:"38px"});
          this.add.rectangle(720,210,110,95,0x6d6f72).setStrokeStyle(4,0x44484a);
          this.add.text(680,170,"🔥",{fontSize:"54px"});
          this.add.rectangle(250,165,90,88,0x80868a).setStrokeStyle(4,0x4d5358);
          this.add.text(222,129,"🍳",{fontSize:"52px"});

          const chef = this.add.text(530,185,"👨‍🍳",{fontSize:"56px"}).setOrigin(.5);
          this.tweens.add({ targets: chef, x: 635, duration: 1800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

          const waiter = this.add.text(400,320,"🧑‍💼",{fontSize:"50px"}).setOrigin(.5);
          this.tweens.add({ targets: waiter, x: 580, y: 280, duration: 2500, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

          const customer = this.add.text(170,330,"👩",{fontSize:"48px"}).setOrigin(.5);
          this.tweens.add({ targets: customer, x: 305, y: 285, duration: 3200, yoyo: true, repeat: -1, hold: 2500 });

          this.add.text(30,25,"Seu primeiro CaféVille",{fontFamily:"Arial",fontSize:"28px",fontStyle:"bold",color:"#603813"});
          this.add.text(30,62,"Cozinhe • Sirva • Decore • Faça amigos",{fontFamily:"Arial",fontSize:"17px",color:"#70492b"});
        }
      }

      game = new Phaser.Game({
        type: Phaser.AUTO,
        width: 960,
        height: 540,
        parent: gameRef.current,
        backgroundColor: "#b9d88f",
        scene: CafeScene,
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      });
    })();

    return () => { mounted = false; if (game) game.destroy(true); };
  }, []);

  return <div className="game-frame" ref={gameRef} />;
}
