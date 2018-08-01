// ******************************************************************************************************************************************************************************************************

//                                                      DISPLAY

// ******************************************************************************************************************************************************************************************************

class DisplayObject extends Rectangle {
    name: string = "";
    stage: Stage | null = null;
    _parent: DisplayObjectContainer | null = null;
    visible: boolean = true;
    trans: Transform;
    constructor(x: number = 0, y: number = 0) {
        super(x, y, 0, 0);
        this.trans = new Transform(this);
    }
    animate(property: string, changeValue: number, max: number, repeat?: Function | null, done?: Function | null) {
        let c = this;
        if (!(property in c)) {
            throw new Error(c.name + " Propriété inconnue : " + property);
        } else {
            console.log(c.name, "propriété ", property, "=", c[property])
        }
        function change() {
            let val = c[property] + changeValue;
            c[property] = val;
            if (val != max) {
                requestAnimationFrame(change);
                if (repeat instanceof Function) repeat();
            } else {
                if (done instanceof Function) done();
            }
        }
        change();
    }
    remove() {
        if (this.parent) this.parent.removeChild(this);
    }
    render(ctx: CanvasRenderingContext2D) {
    }
    getRect() {
        return new Rectangle(this.x, this.y, this.w, this.h);
    }
    get mouseX() {
        return (this.stage != null ? this.stage.stageX - this.trans.stage.x : 0);
    }
    get mouseY() {
        return (this.stage != null ? this.stage.stageY - this.trans.stage.y : 0);
    }
    get parent(): DisplayObjectContainer | null {
        return this._parent;
    }
    hitTestObject(obj: DisplayObject): boolean {
        return this.intersects(obj);
    }
    hitTestPoint(p: Point): boolean {
        return this.containsPt(p);
    }
}
class Listener {
    constructor(public type: string, public callback: Function) {
        this.type = type;
        this.callback = callback;
    }
    remove(from: InteractiveObject, type: string, callback: Function) {
        if (this.type == type && this.callback == callback) {
            from._listeners.splice(from._listeners.indexOf(this), 1);
        }
    }
}
class InteractiveObject extends DisplayObject {
    _listeners: Listener[] = [];
    constructor(x: number = 0, y: number = 0) {
        super(x, y);
    }
    addEventListener(type: string, callback: Function) {
        this._listeners.push(new Listener(type, callback));
    }
    removeEventListener(type: string, callback: Function) {
        for (let i = this._listeners.length - 1; i > 0; i--) {
            this._listeners[i].remove(this, type, callback);
        }
    }
    dispatchEvent(type: string, e: Event) {
        this._listeners.forEach((l) => {
            if (l.type == type) {
                l.callback(this, type, e);
            }
        });
    }
}
class DisplayObjectContainer extends InteractiveObject {
    children: DisplayObject[];
    constructor(x: number = 0, y: number = 0) {
        super(x, y);
        this.children = [];
    }
    addChild(d: DisplayObject) {
        return this.addChildAt(d, this.children.length);
        // dernier entré et pas deux fois ;)
    }
    addChildAt(d: DisplayObject, index: number) {
        this.removeChild(d);
        if (d instanceof DisplayObject) {
            this.children.splice(index, 0, d);
            d._parent = this;
            d.stage = this.stage;
        }
        return d;
    }
    contains(d: DisplayObject) {
        return this.children.includes(d);
    }
    getChildAt(index: number) {
        return this.children[index];
    }
    getChildByName(name: string) {
        return this.children.find(d => d.name == name);
    }
    getChildIndex(child: DisplayObject) {
        return this.children.indexOf(child);
    }
    removeChild(child: DisplayObject) {
        if (child instanceof DisplayObject) {
            if (this.children.includes(child)) {
                this.children.splice(this.children.indexOf(child), 1);
            }
            child._parent = null;
            child.stage = null;
        }
        return child;
    }
    removeChildAt(index: number) {
        return this.removeChild(this.children[index]);
    }
    removeChildren(begin: number = 0, end: number = 0x7FFFFFFF) {
        let tbl = [];
        for (let n = begin; n < this.children.length && n < end; n++)
            tbl.push(this.children[n]);
        tbl.forEach(c => this.removeChild(c));
    }
    setChildIndex(child: DisplayObject, index: number) {
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
    graphics: Graphics;
    constructor(x: number = 0, y: number = 0) {
        super(x, y);
        this.graphics = new Graphics(this);
    }
    render(ctx: CanvasRenderingContext2D) {
        if (this.visible) this.graphics.applyTo(ctx, this.trans.stage);
    }
}
class Sprite extends DisplayObjectContainer {
    graphics: Graphics;
    constructor(name: string, x: number = 0, y: number = 0, w: number, h: number) {
        super(x, y);
        this.name = name;
        this.graphics = new Graphics(this);
        this.w = w;
        this.h = h;
    }
    toString(): string {
        return `Sprite("${this.name}", ${this.x}, ${this.y}, ${this.w}, ${this.h});`
    }
    write(x: number, y: number, text: string, fmt: TextFormat) {
        new GrCmd(this.graphics, 11, new Point(x, y)).write(text, fmt);
    }
    render(ctx: CanvasRenderingContext2D) {
        if (this.visible) {
            this.graphics.applyTo(ctx, this.trans.stage);
            for (let c of this.children) c.render(ctx);
        }
    }
}
class RollPower {
    constructor(s: InteractiveObject, callback: (i: DisplayObject, s: string) => void, cursorType: string = "pointer") {
        s.addEventListener("mouseover", () => {
            (s.stage as Stage).css.cursor = cursorType;
            callback(s, "over");
        });
        s.addEventListener("mouseout", () => {
            (s.stage as Stage).css.cursor = "auto";
            callback(s, "out")
        })
    }
}
class KeyUpPower {
    constructor(public s: InteractiveObject, public callback: (s: InteractiveObject, k: KeyboardEvent) => void) {
        window.addEventListener("keyup", (k: KeyboardEvent) => { s.dispatchEvent("keyup", k); });
        s.addEventListener("keyup", (s: InteractiveObject, t: string, k: KeyboardEvent) => callback(s, k))
    }
}
class KeyDownPower {
    constructor(public s: InteractiveObject, public callback: (s: InteractiveObject, k: KeyboardEvent) => void) {
        window.addEventListener("keydown", (k: KeyboardEvent) => { s.dispatchEvent("keydown", k); });
        s.addEventListener("keydown", (s: InteractiveObject, t: string, k: KeyboardEvent) => callback(s, k))
    }
}
class MovePower {
    constructor(public s: Sprite, public callback: (s: Sprite, x: number, y: number) => void, cursorType: string) {
        const stage = s.stage as Stage
        new RollPower(s, resetCursor, cursorType);
        function move() {
            callback(s, stage.stageX, stage.stageY);
        }
        function resetCursor(s: any, msg: string) {
            if (msg === "out") {
                s.removeEventListener("mousemove", move);
            } else {
                s.addEventListener("mousemove", move);
            }
        }
    }
}
class DragPower {
    constructor(public s: Sprite, public lim: Rectangle | null, public callback: (s: Sprite, msg: string) => void | Function, public dragCursor: string = "move") {
        let hit = new Point(), stage = s.stage as Stage;
        new RollPower(s, resetCursor, dragCursor);
        function startDrag() {
            hit.setPos(stage.stageX - s.x, stage.stageY - s.y);
            stage.css.cursor = dragCursor;
            s.removeEventListener("mousedown", startDrag);
            s.addEventListener("mouseup", stopDrag);
            s.addEventListener("mousemove", drag);
            callback(s, "startDrag");
            drag();
        }
        function drag() {
            s.setPos(stage.stageX - hit.x, stage.stageY - hit.y);
            if (lim) {
                s.x = Math.min(Math.max(s.x, lim.x), lim.r - s.w);
                s.y = Math.min(Math.max(s.y, lim.y), lim.b - s.h);
            }
            callback(s, "drag");
        }
        function stopDrag() {
            s.removeEventListener("mousemove", drag);
            s.removeEventListener("mouseup", stopDrag);
            s.addEventListener("mousedown", startDrag);
            callback(s, "endDrag");
        }
        function resetCursor(s: any, msg: string) {
            if (msg === "out") {
                s.removeEventListener("mousemove", drag);
                s.removeEventListener("mouseup", stopDrag);
                s.addEventListener("mousedown", startDrag);
            } else {
                s.addEventListener("mousedown", startDrag);
            }
        }
    }
}
class Stage extends DisplayObjectContainer {
    /**
     * éléments interactifs trouvés sous la souris
     */
    underMouse: InteractiveObject[];
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    css: CSSStyleDeclaration;
    bg: number = 0;
    graphics: Graphics;
    stageX: number = 0;
    stageY: number = 0;
    constructor(target: HTMLElement) {
        super();
        this.underMouse = [];
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
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
            if (m.pageX === this.stageX && m.pageY === this.stageY) return;
            this.stageX = m.pageX;
            this.stageY = m.pageY;
            this.children.forEach((d) => {
                if (d instanceof InteractiveObject) {
                    findChildUnderMouse(this, d, m);
                };
                this.underMouse.forEach((d) => d.dispatchEvent("mousemove", m));
            })
        });
        function findChildUnderMouse(stage: Stage, d: InteractiveObject, m: MouseEvent) {
            let index = stage.underMouse.indexOf(d), rect = d.trans.stageRect;
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
    getPixel(x: number, y: number): Color {
        let c = this.ctx.getImageData(x, y, 1, 1).data
        return Color.FromRgba(c[0], c[1], c[2], c[3]);
    }
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let c of this.children) c.render(this.ctx);
        let s: Stage = this;
        s.dispatchEvent("enterframe", new CustomEvent("enterframe", { detail: { stage: s } }));
        requestAnimationFrame(e => s.render());
    }
    get backgroundColor(): number {
        return this.bg;
    }
    set backgroundColor(value: number) {
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
    fmt: TextFormat = new TextFormat("calibri", 11, 0x003333, false, false, false, "center");
    lines: Shape;
    constructor(target: DisplayObjectContainer, name: string, x: number, y: number, w: number, h: number) {
        super(name, x, y, w, h);
        target.addChild(this);
        this.lines = new Shape();
        this.addChild(this.lines);
    }
    drawGrid(numRows: number, numCols: number, lineColor: number, fontName: string, fontSize: number, textColor: number, dx: number = 2, dy: number = 2) {
        let gr = this.lines.graphics;
        this.fmt.font = fontName;
        this.fmt.size = fontSize;
        this.fmt.color = textColor;
        gr.clear();
        gr.lineStyle(0.4, lineColor, 1);
        const hor = this.w / numCols;
        const ver = this.h / numRows;
        let px: number, py: number;
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
class UiElement extends Sprite {
    constructor(target:DisplayObjectContainer, name:string, x:number, y:number, w:number, h:number, callback:(e:UiElement)=>void) {
        super(name, x, y, w, h)
        target.addChild(this);
    }
}
class Button extends UiElement {
    _txt: string = "";
    constructor(target: DisplayObjectContainer, name: string, public title: string, x: number, y: number, w: number, h: number, callback: (e:UiElement) => void) {
        super(target, name, x, y, w, h, callback);
        this.text = title;
        new RollPower(this, this.onMouse, "pointer");
        this.onMouse(this, "out");
        this.addEventListener("click", () => callback(this));
    }
    onMouse(b: any, msg: string) {
        b.graphics.clear();
        b.graphics.drawBox(0, 0, b.w, b.h, true, msg === "out" ? 0x9999FF : 0x6666FF);
        b.graphics.write(b.w / 2, (b.h / 2) + 4, b.title, GlobalFormat);
    }
    get text(): string {
        return this._txt;
    }
    set text(value: string) {
        this._txt = value;
    }
}
class HRange extends UiElement {
        curs: Sprite;
        constructor(target: DisplayObjectContainer, name: string, x: number, y: number, w:number, public callback: (s: UiElement) => void) {
            super(target, name, x, y, w, 20, callback);
            this.graphics.drawBox(0, 10, w, 2, false, 0x555599, 1.0);// creux, plus sombre que scène
            let curs: Sprite = new Sprite("curs", 0, 0, 12, 20), gr = curs.graphics;
            gr.drawBox(0, 0, 14, 20, true, 0x666699);
            gr.line(3, 6, 11, 6);
            gr.line(3, 10, 11, 10);
            gr.line(3, 14, 11, 14);
            this.addChild(curs);
            new DragPower(curs, new Rectangle(0, 0, this.w, this.h), () => this.callback(this), "pointer");
            this.curs = curs;
            this.percent = 1.0;
        }
        get percent(): number {
            return this.curs.x / (this.w - 14);
        }
        set percent(value: number) {
            value = MIN(value, 1);
            value = MAX(value, 0);
            this.curs.x = value * (this.w - 14);
            this.callback(this);
        }
}
class HSlider extends UiElement {
    curs: Sprite;
    cursSize: number = 0.25;
    constructor(target: DisplayObjectContainer, name: string, x: number, y: number, w: number, h: number, public callback: (s: UiElement) => void, public showVal: boolean) {
        super(target, name, x, y, w, h, callback);
        this.graphics.drawBox(0, 0, w, h, false, 0x555599, 1.0);// creux, plus sombre que scène
        let curs: Sprite = new Sprite("curs", 0, 0, this.cursSize * w, h);
        this.addChild(curs);
        new DragPower(curs, new Rectangle(0, 0, this.w, this.h), () => this._draw(), "pointer");
        this.curs = curs;
        this.percent = 0.5;
    }
    _draw() {
        let curs = this.curs, h = this.h, w = this.w, v = this.percent * 100;
        curs.w = this.cursSize * w;
        curs.graphics.clear();
        curs.graphics.drawBox(1, 1, curs.w - 2, h - 2, true, 0x666699);// bombé, plus clair que scène
        if (this.showVal) curs.write(curs.w / 2, (h / 2) + 4, v.toFixed(0) + "%", GlobalFormat);
        this.callback(this);
    }
    get percent(): number {
        return this.curs.x / (this.w - this.curs.w);
    }
    set percent(value: number) {
        value = MIN(value, 1);
        value = MAX(value, 0);
        this.curs.x = value * (this.w - this.curs.w);
        this._draw();
    }
}

class VSlider extends UiElement {
    curs: Sprite;
    cursSize: number = 0.25;
    constructor(target: DisplayObjectContainer, name: string, x: number, y: number, w: number, h: number, public callback: (s: UiElement) => void, public showVal: boolean) {
        super(target, name, x, y, w, h, callback);
        this.graphics.drawBox(0, 0, w, h, false, 0x555599, 1.0);
        let curs: Sprite = new Sprite("curs", 0, 0, w, this.cursSize * h);
        this.addChild(curs);
        new DragPower(curs, new Rectangle(0, 0, this.w, this.h), () => this._draw(), "pointer");
        this.curs = curs;
        this.pourcent = .5;
    }
    _draw() {
        let curs = this.curs, h = this.h, w = this.w, v = this.pourcent * 100;
        curs.h = this.cursSize * h;
        curs.graphics.clear();
        curs.graphics.drawBox(1, 1, w - 2, curs.h - 2, true, 0x777799);
        if (this.showVal) curs.write(w / 2, (curs.h / 2) + 4, v.toFixed(0) + "%", GlobalFormat);
    }
    get pourcent(): number {
        return this.curs.y / (this.h - this.curs.h);
    }
    set pourcent(value: number) {
        value = MIN(value, 1.0);
        value = MAX(value, 0.0);
        this.curs.y = value * (this.h - this.curs.h);
        this._draw();
    }
}
class ColorSelector extends UiElement {
    overColor: Color;
    selectedColor: Color;
    view: Shape;
    select: Sprite;
    alpha: number = 1.0;
    fill:Fill = new Fill();
    stroke:Stroke = new Stroke();

    constructor(target: DisplayObjectContainer, name: string, x: number, y: number, public callback:(e:UiElement)=>void, colr: number = 0x666666) {
        super(target, name, x, y, 300, 200, callback);
        const c = 12, col = ["00", "33", "66", "99", "CC", "FF"];
        this.graphics.drawBox(0, 0, this.w, this.h, true, 0x9999FF, 1);
        this.selectedColor = this.overColor = new Color(colr);
        this.view = new Shape(240, 12);
        this.addChild(this.view);
        this.select = new Sprite("select", c, c, c * 18, c * 12);
        this.addChild(this.select);
        let alphaSlid = new HRange(this, "alpha", 240, c * 11, 50, (al:UiElement)=>{
            this.alpha = (al as HRange).percent;
        });
        alphaSlid.percent = 1.0;

        const stage = this.stage as Stage, gr = this.select.graphics;
        let px = 0, py = 0, nc = 0, t = "";
        for (let r = 0; r < 6; r++) {
            for (let g = 0; g < 6; g++) {
                for (let b = 0; b < 6; b++) {
                    t = col[r] + col[g] + col[b];
                    gr.beginFill(parseInt(t, 16), 1);
                    gr.drawRect(px, py, c, c);
                    px += c, nc++; if (nc == 18) nc = 0, px = 0, py += c;
                }
            }
        }
        new RollPower(this.select, () => { }, "crosshair");
        this.select.addEventListener("mousemove", () => {
            this.overColor = stage.getPixel(stage.stageX, stage.stageY);
            this.show();
        });
        this.select.addEventListener("mouseup", () => {
            this.selectedColor = this.overColor;
            this.fill.color = this.selectedColor.val;
            this.fill.alpha = this.selectedColor.alpha;
            this.show();
        });
        this.show();
    }
    show() {
        const gr = this.view.graphics;
        gr.clear();
        gr.drawBox(0, 0, 50, 24, true, this.overColor.val, this.alpha);
        gr.write(0, 50, this.overColor.hex, GlobalFormat);
        gr.drawBox(0, 75, 50, 24, false, this.selectedColor.val, this.alpha);
        gr.write(25, 100, this.selectedColor.hex, GlobalFormat);
        this.callback(this);
    }
}