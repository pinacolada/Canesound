"use strict";
// ******************************************************************************************************************************************************************************************************
//                                                      DISPLAY
// ******************************************************************************************************************************************************************************************************
class DisplayObject extends Rectangle {
    constructor(x = 0, y = 0) {
        super(x, y, 0, 0);
        this.name = "";
        this.stage = null;
        this._parent = null;
        this.visible = true;
        this.transform = new Transform(this);
    }
    animate(property, changeValue, max, repeat, done) {
        let c = this;
        if (!(property in c)) {
            throw new Error(c.name + " Propriété inconnue : " + property);
        }
        else {
            console.log(c.name, "propriété ", property, "=", c[property]);
        }
        function change() {
            let val = c[property] + changeValue;
            c[property] = val;
            if (val != max) {
                requestAnimationFrame(change);
                if (repeat instanceof Function)
                    repeat();
            }
            else {
                if (done instanceof Function)
                    done();
            }
        }
        change();
    }
    remove() {
        if (this.parent)
            this.parent.removeChild(this);
    }
    render(ctx) {
    }
    getRect() {
        return new Rectangle(this.x, this.y, this.w, this.h);
    }
    get mouseX() {
        return (this.stage != null ? this.stage.stageX - this.transform.stage.x : 0);
    }
    get mouseY() {
        return (this.stage != null ? this.stage.stageY - this.transform.stage.y : 0);
    }
    get parent() {
        return this._parent;
    }
    hitTestObject(obj) {
        return this.intersects(obj);
    }
    hitTestPoint(p) {
        return this.containsPt(p);
    }
}
class Listener {
    constructor(type, callback) {
        this.type = type;
        this.callback = callback;
        this.type = type;
        this.callback = callback;
    }
    remove(from, type, callback) {
        if (this.type == type && this.callback == callback) {
            from._listeners.splice(from._listeners.indexOf(this), 1);
        }
    }
}
class InteractiveObject extends DisplayObject {
    constructor(x = 0, y = 0) {
        super(x, y);
        this._listeners = [];
    }
    addEventListener(type, callback) {
        this._listeners.push(new Listener(type, callback));
    }
    removeEventListener(type, callback) {
        for (let i = this._listeners.length - 1; i > 0; i--) {
            this._listeners[i].remove(this, type, callback);
        }
    }
    dispatchEvent(type, e) {
        this._listeners.forEach((l) => {
            if (l.type == type) {
                l.callback(this, type, e);
            }
        });
    }
}
class DisplayObjectContainer extends InteractiveObject {
    constructor(x = 0, y = 0) {
        super(x, y);
        this.children = [];
    }
    addChild(d) {
        return this.addChildAt(d, this.children.length);
        // dernier entré et pas deux fois ;)
    }
    addChildAt(d, index) {
        this.removeChild(d);
        if (d instanceof DisplayObject) {
            this.children.splice(index, 0, d);
            d._parent = this;
            d.stage = this.stage;
        }
        return d;
    }
    contains(d) {
        return this.children.includes(d);
    }
    getChildAt(index) {
        return this.children[index];
    }
    getChildByName(name) {
        return this.children.find(d => d.name == name);
    }
    getChildIndex(child) {
        return this.children.indexOf(child);
    }
    removeChild(child) {
        if (child instanceof DisplayObject) {
            if (this.children.includes(child)) {
                this.children.splice(this.children.indexOf(child), 1);
            }
            child._parent = null;
            child.stage = null;
        }
        return child;
    }
    removeChildAt(index) {
        return this.removeChild(this.children[index]);
    }
    removeChildren(begin = 0, end = 0x7FFFFFFF) {
        let tbl = [];
        for (let n = begin; n < this.children.length && n < end; n++)
            tbl.push(this.children[n]);
        tbl.forEach(c => this.removeChild(c));
    }
    setChildIndex(child, index) {
        if (index < 0 || index > this.numChildren - 1)
            return -1;
        let current = this.getChildIndex(child);
        if (current == -1)
            return current;
        this.addChildAt(child, index);
        return index;
    }
    get numChildren() {
        return this.children.length;
    }
}
class Shape extends DisplayObject {
    constructor(x = 0, y = 0) {
        super(x, y);
        this.graphics = new Graphics(this);
    }
    render(ctx) {
        if (!this.visible)
            return;
        this.graphics.applyTo(ctx, this.transform.stage);
    }
}
class Sprite extends DisplayObjectContainer {
    constructor(name, x = 0, y = 0, w, h) {
        super(x, y);
        this.name = name;
        this.graphics = new Graphics(this);
        this.w = w;
        this.h = h;
    }
    toString() {
        return `Sprite("${this.name}", ${this.x}, ${this.y}, ${this.w}, ${this.h});`;
    }
    write(x, y, text, fmt) {
        new GrCmd(this.graphics, 11, new Point(x, y)).write(text, fmt);
    }
    render(ctx) {
        if (!this.visible)
            return;
        this.graphics.applyTo(ctx, this.transform.stage);
        for (let c of this.children)
            c.render(ctx);
    }
}
class RollPower {
    constructor(s, callback, rollOverCursor = "pointer") {
        s.addEventListener("mouseover", () => {
            s.stage.css.cursor = rollOverCursor;
            callback(s, "over");
        });
        s.addEventListener("mouseout", () => {
            s.stage.css.cursor = "auto";
            callback(s, "out");
        });
    }
}
class KeyUpPower {
    constructor(s, callback) {
        this.s = s;
        this.callback = callback;
        window.addEventListener("keyup", (k) => { s.dispatchEvent("keyup", k); });
        s.addEventListener("keyup", (s, t, k) => callback(s, k));
    }
}
class KeyDownPower {
    constructor(s, callback) {
        this.s = s;
        this.callback = callback;
        window.addEventListener("keydown", (k) => { s.dispatchEvent("keydown", k); });
        s.addEventListener("keydown", (s, t, k) => callback(s, k));
    }
}
class DragPower {
    constructor(s, lim, callback, dragCursor = "move") {
        this.s = s;
        this.lim = lim;
        this.callback = callback;
        this.dragCursor = dragCursor;
        let hit = new Point(), stage = s.stage;
        new RollPower(s, resetCursor, "move");
        function startDrag() {
            hit.setPos(stage.stageX - s.x, stage.stageY - s.y);
            stage.css.cursor = dragCursor;
            s.removeEventListener("mousedown", startDrag);
            s.addEventListener("mouseup", stopDrag);
            s.addEventListener("mousemove", drag);
            if (callback)
                callback(s, "startDrag");
            drag();
        }
        function drag() {
            s.setPos(stage.stageX - hit.x, stage.stageY - hit.y);
            if (lim) {
                s.x = Math.min(Math.max(s.x, lim.x), lim.r - s.w);
                s.y = Math.min(Math.max(s.y, lim.y), lim.b - s.h);
            }
            if (callback)
                callback(s, "drag");
        }
        function stopDrag() {
            s.removeEventListener("mousemove", drag);
            s.removeEventListener("mouseup", stopDrag);
            s.addEventListener("mousedown", startDrag);
            if (callback)
                callback(s, "endDrag");
        }
        function resetCursor(s, msg) {
            if (msg === "out") {
                s.removeEventListener("mousemove", drag);
                s.removeEventListener("mouseup", stopDrag);
                s.addEventListener("mousedown", startDrag);
            }
            else {
                s.addEventListener("mousedown", startDrag);
            }
        }
    }
    setPower() {
    }
    removePower() {
    }
}
class Stage extends DisplayObjectContainer {
    constructor(target) {
        super();
        this.bg = 0;
        this.stageX = 0;
        this.stageY = 0;
        this.underMouse = [];
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.css = this.canvas.style;
        document.body.appendChild(this.canvas);
        this.stage = this;
        this.graphics = new Graphics(this);
        this.activate();
        this.render();
    }
    activate() {
        this.canvas.addEventListener("mousedown", m => {
            this.underMouse.forEach((d) => d.dispatchEvent("mousedown", m));
        });
        this.canvas.addEventListener("mouseup", m => {
            this.underMouse.forEach((d) => d.dispatchEvent("mouseup", m));
        });
        this.canvas.addEventListener("click", m => {
            this.underMouse.forEach((d) => d.dispatchEvent("click", m));
        });
        this.canvas.addEventListener("mousemove", m => {
            this.stageX = m.pageX;
            this.stageY = m.pageY;
            this.children.forEach((d) => {
                if (d instanceof InteractiveObject) {
                    findChildUnderMouse(this, d, m);
                }
                ;
                this.underMouse.forEach((d) => d.dispatchEvent("mousemove", m));
            });
        });
        function findChildUnderMouse(stage, d, m) {
            let index = stage.underMouse.indexOf(d), rect = d.transform.stageRect;
            if (rect.containsPos(stage.stageX, stage.stageY)) {
                if (index == -1) {
                    stage.underMouse.push(d);
                    d.dispatchEvent("mouseover", m);
                }
            }
            else {
                if (index > -1) {
                    stage.underMouse.splice(index, 1);
                    d.dispatchEvent("mouseout", m);
                }
            }
            if (d instanceof DisplayObjectContainer) {
                d.children.forEach((child) => {
                    if (child instanceof InteractiveObject) {
                        findChildUnderMouse(stage, child, m);
                    }
                });
            }
        }
    }
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let c of this.children)
            c.render(this.ctx);
        let s = this;
        s.dispatchEvent("enterframe", new CustomEvent("enterframe", { detail: { stage: s } }));
        requestAnimationFrame(e => s.render());
    }
    get backgroundColor() {
        return this.bg;
    }
    set backgroundColor(value) {
        this.bg = value;
        this.css.backgroundColor = new Color(this.bg).css;
    }
    get stageWidth() {
        return this.w;
    }
    set stageWidth(value) {
        this.w = this.canvas.width = value;
    }
    get stageHeight() {
        return this.h;
    }
    set stageHeight(value) {
        this.h = this.canvas.height = value;
    }
}
class Grid extends Sprite {
    constructor(target, name, x, y, w, h) {
        super(name, x, y, w, h);
        this.fmt = new TextFormat("calibri", 11, 0x003333, false, false, false, "center");
        target.addChild(this);
        this.lines = new Shape();
        this.addChild(this.lines);
    }
    drawGrid(numRows, numCols, lineColor, fontName, fontSize, textColor, dx = 2, dy = 2) {
        let gr = this.lines.graphics;
        this.fmt.font = fontName;
        this.fmt.size = fontSize;
        this.fmt.color = textColor;
        gr.clear();
        gr.lineStyle(0.4, lineColor, 1);
        const hor = this.w / numCols;
        const ver = this.h / numRows;
        let px, py;
        for (let c = 0; c <= numCols; c++) {
            px = c * hor;
            gr.line(px, 0, px, this.h);
            this.write(px, dy, c.toString(), this.fmt);
        }
        for (let r = 0; r <= numRows; r++) {
            py = r * ver;
            gr.line(0, py, this.w, py);
            this.write(dx, py + 2, r.toString(), this.fmt);
        }
    }
}
class SpriteNode extends Sprite {
    constructor(target, id, x, y, radius, bg, border, callback) {
        super(id, x, y, radius * 2, radius * 2);
        this.radius = radius;
        target.addChild(this);
        this.setColor(bg, border);
        if (target instanceof Tool) {
            new DragPower(this, null, (e, m) => target.onMobile(e, m));
        }
        else {
            new DragPower(this, null, callback);
        }
    }
    setColor(background, border) {
        this.graphics.clear();
        this.graphics.lineStyle(2, border, 1);
        this.graphics.beginFill(background);
        this.graphics.drawCircle(0, 0, this.radius);
    }
}
class Tool extends SpriteNode {
    constructor(target, toolType, x, y, stroke, callback) {
        super(target, toolType, x, y, Tool.HR, 0xFF0000, 0xFFFFFF, callback);
        this.stroke = stroke;
        this.callback = callback;
        this.pts = [];
        this.selArrow = new Shape(0, 0);
        this.curve = new Shape(5, 5);
        this.addChild(this.curve);
        this.selArrow.graphics.beginFill(0xff00ff, 1);
        this.selArrow.graphics.drawShape(new Point(-8, 0), new Point(-16, -8), new Point(-8, -16), new Point(0, -8), new Point(0, 0));
        this.kdControl = new KeyDownPower(this, this.moveTool);
        this.kuControl = new KeyUpPower(this, this.moveTool);
    }
    rotateNodes(degres) {
        let radians = enRadians(degres);
        this.pts.forEach(p => p.rotateSelf(radians));
        this.onMobile(this.pts[0], "rotated");
    }
    translateNodes(tx, ty) {
        this.pts.forEach(p => p.addSelf(tx, ty));
        this.onMobile(this.pts[0], "translated");
    }
    scaleNodes(factor) {
        this.pts.forEach(p => p.scaleSelf(factor));
        this.onMobile(this.pts[0], "scaled");
    }
    addNode(id, x, y, radius, bg, bdr, push = true) {
        let t = this;
        let sn = new SpriteNode(t, id, x, y, radius, bg, bdr, (n, msg) => t.onMobile(n, msg));
        if (push)
            t.pts.push(sn);
        return sn;
    }
    onMobile(n, msg) {
        // Dessin de l'outil terminé (implémenter pour les autres tools)
    }
    moveTool(s, k) {
        let t = s;
        if (!t.selected)
            return;
        switch (k.key) {
            case "ArrowUp":
                s.y--;
                break;
            case "ArrowDown":
                s.y++;
                break;
            case "ArrowLeft":
                s.x--;
                break;
            case "ArrowRight":
                s.x++;
                break;
        }
    }
    get selected() {
        return this.contains(this.selArrow);
    }
    set selected(value) {
        if (value) {
            this.addChild(this.selArrow);
            this.pts.forEach(p => p.visible = true);
        }
        else {
            this.removeChild(this.selArrow);
            this.pts.forEach(p => p.visible = false);
        }
    }
}
/**
 * largeur de l'outil de dessin
 */
Tool.SIZE = 50;
/**
 * rayon de la poignée (handle radius)
 */
Tool.HR = 5;
class LineTool extends Tool {
    constructor(target, x, y, stroke, callback) {
        super(target, "Line", x, y, stroke, callback);
        this.sb = this.addNode("b", Tool.SIZE, Tool.SIZE, Tool.HR, 0x00FF00, 0xFFFFFF);
        this.onMobile(this.sb);
    }
    onMobile(n, m = "") {
        const s = this.stroke, g = this.curve.graphics;
        g.clear();
        g.lineStyle(s.thickness, s.color, s.alpha);
        g.line(0, 0, this.sb.x, this.sb.y);
        if (this.callback instanceof Function)
            this.callback(this);
    }
}
class CurveTool extends Tool {
    constructor(target, x, y, stroke, callback) {
        super(target, "Curve", x, y, stroke, callback);
        this.sb = this.addNode("b", Tool.SIZE, 0, Tool.HR, 0x0000FF, 0x999999);
        this.sc = this.addNode("c", 0, Tool.SIZE, Tool.HR, 0x00FF00, 0xFFFFFF);
        this.onMobile(this.sc);
    }
    onMobile(n, m = "") {
        const s = this.stroke, g = this.curve.graphics;
        g.clear();
        g.lineStyle(s.thickness, s.color, s.alpha);
        g.curve(0, 0, this.sb.x, this.sb.y, this.sc.x, this.sc.y);
        if (this.callback instanceof Function)
            this.callback(this);
    }
}
class CubicTool extends Tool {
    constructor(target, x, y, stroke, callback) {
        super(target, "Cubic", x, y, stroke, callback);
        this.sb = this.addNode("b", Tool.SIZE, 0, Tool.HR, 0x0000FF, 0x999999);
        this.sc = this.addNode("c", Tool.SIZE, Tool.SIZE, Tool.HR, 0x0000FF, 0x999999);
        this.sd = this.addNode("d", 0, Tool.SIZE, Tool.HR, 0x00FF00, 0xFFFFFF);
        this.onMobile(this.sd);
    }
    onMobile(n, m = "") {
        const s = this.stroke, g = this.curve.graphics;
        g.clear();
        g.lineStyle(s.thickness, s.color, s.alpha);
        g.cubicCurve(0, 0, this.sb.x, this.sb.y, this.sc.x, this.sc.y, this.sd.x, this.sd.y);
        if (this.callback instanceof Function)
            this.callback(this);
    }
}
class RectTool extends Tool {
    constructor(target, x, y, fill, stroke, callback) {
        super(target, "Rect", x, y, stroke, callback);
        this.fill = fill;
        this.sb = this.addNode("b", Tool.SIZE, Tool.SIZE, Tool.HR, 0x00FF00, 0xFFFFFF);
        this.onMobile(this.sb);
    }
    onMobile(n, m = "") {
        const s = this.stroke, f = this.fill, g = this.curve.graphics;
        g.clear();
        this.sb.x = MAX(this.sb.x, 10);
        this.sb.y = MAX(this.sb.y, 10);
        g.beginFill(f.color, f.alpha);
        g.lineStyle(s.thickness, s.color, s.alpha);
        g.drawRect(0, 0, this.sb.x, this.sb.y);
        if (this.callback instanceof Function)
            this.callback(this);
    }
}
class CircleTool extends Tool {
    constructor(target, x, y, fill, stroke, callback) {
        super(target, "Circle", x, y, stroke, callback);
        this.fill = fill;
        this.sb = this.addNode("b", Tool.SIZE, Tool.SIZE, Tool.HR, 0x00FF00, 0xFFFFFF);
        this.onMobile(this.sb);
    }
    onMobile(sn, msg = "") {
        const s = this.stroke, f = this.fill, g = this.curve.graphics;
        g.clear();
        this.sb.x = MAX(this.sb.x, 10);
        this.sb.y = MAX(this.sb.y, 10);
        g.beginFill(f.color, f.alpha);
        g.lineStyle(s.thickness, s.color, s.alpha);
        g.drawCircle(0, 0, this.sb.x / 2);
        if (msg == "endDrag")
            this.sb.y = this.sb.x;
        if (this.callback instanceof Function)
            this.callback(this);
    }
}
class EllipseTool extends Tool {
    constructor(target, x, y, fill, stroke, callback) {
        super(target, "Ellipse", x, y, stroke, callback);
        this.fill = fill;
        this.sb = this.addNode("b", Tool.SIZE * 1, Tool.SIZE * 0.7, Tool.HR, 0x00FF00, 0xFFFFFF);
        this.onMobile(this.sb);
    }
    onMobile(sn, msg = "") {
        const s = this.stroke, f = this.fill, g = this.curve.graphics;
        this.sb.x = MAX(this.sb.x, 10);
        this.sb.y = MAX(this.sb.y, 10);
        g.clear();
        g.beginFill(f.color, f.alpha);
        g.lineStyle(s.thickness, s.color, s.alpha);
        g.drawEllipse(0, 0, this.sb.x / 2, this.sb.y / 2);
        if (this.callback instanceof Function)
            this.callback(this);
    }
}
class PolygonTool extends Tool {
    constructor(target, x, y, fill, stroke, callback) {
        super(target, (fill.color == -1 ? "Polyline" : "Polygon"), x, y, stroke, callback);
        this.fill = fill;
        this.currentIndex = 1;
        let pts = [new Point(Tool.SIZE, 0), new Point(Tool.SIZE, Tool.SIZE), new Point(Tool.SIZE / 2, Tool.SIZE / 2), new Point(0, Tool.SIZE)];
        for (let p of pts)
            this.createSpriteNode(p);
        this.onMobile(this.pts[this.last]);
        new KeyDownPower(this, this.onKeyboard);
    }
    onMobile(sn, msg = "") {
        const s = this.stroke, f = this.fill, g = this.curve.graphics;
        g.clear();
        g.beginFill(f.color, f.alpha);
        g.lineStyle(s.thickness, s.color, s.alpha);
        g.drawShape(new Point(0, 0), ...this.pts);
        this.currNode = sn;
        if (this.callback instanceof Function)
            this.callback(this);
    }
    createSpriteNode(p) {
        let n = this.addNode("n_", p.x, p.y, Tool.HR, 0x999999, 0xffffff, false);
        this.pts.splice(this.currentIndex + 1, 0, n);
        this.currNode = n;
        return n;
    }
    onKeyboard(i, k) {
        let p = i;
        if (!p.selected)
            return;
        k.preventDefault();
        k.stopPropagation();
        k.stopImmediatePropagation();
        switch (k.key) {
            case "4":
                p.currNode.x--;
                break;
            case "6":
                p.currNode.x++;
                break;
            case "8":
                p.currNode.y--;
                break;
            case "2":
                p.currNode.y++;
                break;
            case "9":
                p.rotateNodes(1);
                break;
            case "7":
                p.rotateNodes(-1);
                break;
            case "1":
                p.choosePrev();
                break;
            case "3":
                p.chooseNext();
                break;
            case "-":
                p.delCurrNode();
                break;
            case "+":
                p.createNode();
                break;
        }
        p.onMobile(p.currNode);
    }
    choosePrev() {
        if (this.currentIndex > 0)
            this.currNode = this.pts[this.currentIndex - 1];
    }
    chooseNext() {
        if (this.currentIndex < this.last)
            this.currNode = this.pts[this.currentIndex + 1];
    }
    createNode() {
        let index = this.currentIndex;
        if (index < this.last) {
            this.createSpriteNode(this.currNode.interpolTo(this.pts[index + 1], 0.5));
        }
        else {
            this.createSpriteNode(this.currNode.interpolTo(new Point(0, 0), 0.5));
        }
    }
    delCurrNode() {
        let index = this.currentIndex;
        if (this.pts.length > 1) {
            this.currNode.remove();
            this.pts.splice(index, 1);
            this.currNode = this.pts[MIN(index, this.last)];
        }
        this.onMobile(this.currNode);
    }
    get currNode() {
        return this.pts[this.currentIndex];
    }
    set currNode(value) {
        let prev = this.currNode;
        // if (prev === value) return;
        if (prev != null)
            prev.setColor(0x999999, 0xffffff); // gris ancien
        this.currentIndex = this.pts.indexOf(value);
        this.currNode.setColor(0xFFFF00, 0xffff00); // jaune nouveau
    }
    get last() {
        return this.pts.length - 1;
    }
}
class PolylineTool extends PolygonTool {
    constructor(target, x, y, stroke, callback) {
        super(target, x, y, new Fill(-1), stroke, callback); // couleur -1 = pas de remplissage...
    }
}
class Button extends Sprite {
    constructor(target, name, title, x, y, w, h, callback) {
        super(name, x, y, w, h);
        this.title = title;
        this._txt = "";
        target.addChild(this);
        this.text = title;
        new RollPower(this, this.onMouse, "pointer");
        this.onMouse(this, "out");
        this.addEventListener("click", () => callback(this));
    }
    onMouse(b, msg) {
        b.graphics.clear();
        b.graphics.drawBox(0, 0, b.w, b.h, true, msg === "out" ? 0x9999FF : 0x6666FF);
        b.graphics.write(b.w / 2, (b.h / 2) + 4, b.title, GlobalFormat);
    }
    get text() {
        return this._txt;
    }
    set text(value) {
        this._txt = value;
    }
}
class HSlider extends Sprite {
    constructor(target, name, x, y, w, h, showVal) {
        super(name, x, y, w, h);
        this.showVal = showVal;
        this.cursSize = 0.15;
        this.graphics.drawBox(0, 0, w, h, false, 0x555599, 1.0); // creux, plus sombre que scène
        target.addChild(this);
        let curs = new Sprite("curs", 0, 0, this.cursSize * w, h);
        this.addChild(curs);
        new DragPower(curs, new Rectangle(0, 0, this.w, this.h), () => this._draw(), "pointer");
        this.curs = curs;
        this.pourcent = 0.5;
    }
    _draw() {
        let curs = this.curs, h = this.h, w = this.w, v = this.pourcent * 100;
        curs.graphics.clear();
        curs.graphics.drawBox(1, 1, curs.w - 2, h - 2, true, 0x666699); // bombé, plus clair que scène
        if (this.showVal)
            curs.write(curs.w / 2, (h / 2) + 4, v.toFixed(0) + "%", GlobalFormat);
    }
    get pourcent() {
        return this.curs.x / (this.w - this.curs.w);
    }
    set pourcent(value) {
        value = MIN(value, 1);
        value = MAX(value, 0);
        this.curs.x = value * (this.w - this.curs.w);
        this._draw();
    }
}
class VSlider extends Sprite {
    constructor(target, name, x, y, w, h, showVal) {
        super(name, x, y, w, h);
        this.showVal = showVal;
        this.cursSize = 0.25;
        this.graphics.drawBox(0, 0, w, h, false, 0x555599, 1.0);
        target.addChild(this);
        let curs = new Sprite("curs", 0, 0, w, this.cursSize * h);
        this.addChild(curs);
        new DragPower(curs, new Rectangle(0, 0, this.w, this.h), () => this._draw(), "pointer");
        this.curs = curs;
        this.pourcent = .5;
    }
    _draw() {
        let curs = this.curs, h = this.h, w = this.w, v = this.pourcent * 100;
        curs.graphics.clear();
        curs.graphics.drawBox(1, 1, w - 2, curs.h - 2, true, 0x777799);
        if (this.showVal)
            curs.write(w / 2, (curs.h / 2) + 4, v.toFixed(0) + "%", GlobalFormat);
    }
    get pourcent() {
        return this.curs.y / (this.h - this.curs.h);
    }
    set pourcent(value) {
        value = MIN(value, 1.0);
        value = MAX(value, 0.0);
        this.curs.y = value * (this.h - this.curs.h);
        this._draw();
    }
}
