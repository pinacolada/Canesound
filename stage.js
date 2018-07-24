"use strict";
const stage = new Stage(document.body);
stage.stageWidth = 800;
stage.stageHeight = 600;
stage.backgroundColor = 0x666699;
stage.x = 10;
stage.y = 10;
let s = new Sprite();
s.name = "carré";
s.x = 210;
s.y = 50;
s.w = 200;
s.h = 150;
stage.addChild(s);
s.graphics.lineStyle(2, 0x33, 1);
s.graphics.beginFill(0x990000, 1.0);
s.graphics.drawRect(0, 0, 200, 150);
let s2 = new Sprite();
s2.name = "polyCourbe";
stage.addChild(s2);
s2.x = 20;
s2.y = 320;
s2.w = 320;
s2.h = 200;
let p1 = new Pt(0, 0), p2 = new Pt(320, 0), p3 = new Pt(320, 200), p4 = new Pt(200, 200);
let p5 = new Pt(250, 150), p6 = new Pt(200, 50), p7 = new Pt(295, 50), p8 = new Pt(260, 20);
s2.graphics.lineStyle(0xFFFFFF, 1, 3);
s2.graphics.drawPath(p1, p2, p3, p4, p5, p6, p7, p8);
s2.graphics.lineStyle(5, 0xFF00FF, 1);
s2.graphics.cubicCurve(20, 20, 100, 0, 80, 50, 190, 190);
setSpriteDrag(s);
s2.addEventListener("mouseover", onSprite);
s2.addEventListener("mousemove", onSprite);
s2.addEventListener("mouseout", onSprite);
s2.addEventListener("click", onSprite);
function onSprite(s, event) {
    if (event == "mouseover")
        stage.css.cursor = "pointer";
    if (event == "mouseout")
        stage.css.cursor = "auto";
    if (event == "click") {
        s.x += s.mouse.x - (s.w / 2);
        s.y += s.mouse.y - (s.h / 2);
        stage.render();
        console.log(s.name, s.x, s.y);
    }
}
function setSpriteDrag(s) {
    s.addEventListener("mousedown", startDrag);
    let hit = new Pt(), stage = s.stage;
    function startDrag() {
        hit.setTo(stage.mouse.x - s.x, stage.mouse.y - s.y);
        s.removeEventListener("mousedown", startDrag);
        s.addEventListener("mousemove", drag);
        s.addEventListener("mouseup", stopDrag);
        console.log("On bouge !", s.x, s.y);
    }
    function drag() {
        s.setTo(stage.mouse.x - hit.x, stage.mouse.y - hit.y);
    }
    function stopDrag() {
        s.removeEventListener("mousemove", drag);
        s.removeEventListener("mouseup", stopDrag);
        s.addEventListener("mousedown", startDrag);
        console.log("On lâche !", s.x, s.y);
    }
}
