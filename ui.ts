class UiElement extends Sprite {
    constructor(target: DisplayObjectContainer, name: string, x: number, y: number, w: number, h: number, callback: (e: any) => void) {
        super(name, x, y, w, h)
        target.addChild(this);
    }
}
class Button extends UiElement {
    _txt: string = "";
    constructor(target: DisplayObjectContainer, name: string, public title: string, x: number, y: number, w: number, h: number, callback: (e: Button) => void) {
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
class ColorSelector extends UiElement {
    over: Color;
    selected: Color;
    view: Shape;
    squares: Sprite;
    fill: Fill = new Fill();
    stroke: Stroke = new Stroke();
    alpha: HRange;
    thickness:HRange;
    checkFill: Checkbox;
    checkStroke: Checkbox;
    constructor(target: DisplayObjectContainer, name: string, x: number, y: number, public callback: (e: UiElement) => void, colr: number = 0x666666) {
        super(target, name, x, y, 300, 200, callback);
        const c = 12, col = ["00", "33", "66", "99", "CC", "FF"];
        this.graphics.drawBox(0, 0, this.w, this.h, true, 0x9999FF, 1);
        this.selected = this.over = new Color(colr);
        this.view = new Shape(240, 12);
        this.addChild(this.view);
        this.squares = new Sprite("squares", c, c, c * 18, c * 12);
        this.addChild(this.squares);
        const stage = this.stage as Stage, gr = this.squares.graphics;
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
        new RollPower(this.squares, () => { }, "crosshair");
        this.squares.addEventListener("mousemove", () => {
            this.over = stage.getPixel(stage.stageX, stage.stageY);
            this.show();
        });
        this.squares.addEventListener("mouseup", () => {
            this.selected = this.over;
            if(this.checkFill.checked) {
                this.fill.setTo(this.selected.val, this.alpha.percent);
            } 
            if(this.checkStroke.checked) {
                this.stroke.setTo(this.thickness.percent*10, this.selected.val, this.alpha.percent);
            }
            this.show();
        });

        this.checkFill = new Checkbox(this, "chkFill", 12, 170, "Fond", true, (e:Checkbox)=> this.toogleCheck(e));
        this.checkStroke = new Checkbox(this, "chkStrk", 72, 170, "Bord", false, (e:Checkbox)=> this.toogleCheck(e));

        this.alpha = new HRange(this, "alpha", 140, 160, 60,"alpha", (e:HRange)=> this.setAlpha(e));
        this.alpha.percent = 1.0;
        this.thickness = new HRange(this, "thick", 210, 160, 60, "épaisseur", (e:HRange)=> this.setThickness(e));
        this.thickness.percent = 0.1;

        this.toogleCheck(this.checkFill);
    }
    toogleCheck(e: Checkbox) {
        if(this.checkStroke == undefined || this.checkFill == undefined) return;
        console.log(this.name, e.name, "cliqué", e.checked);
        if (e === this.checkFill) {
            this.checkStroke.setCheck(!(e.checked));
        } else {
            this.checkFill.setCheck(!(e.checked));
        }
        this.thickness.visible = this.checkStroke.checked;
        this.show();
    }
    setThickness(e:HRange) {
        this.stroke.thickness = e.percent*10;
        this.show();
    }
    setAlpha(e:HRange) {
        this.selected.alpha = e.percent;
        if (this.checkFill.checked) {
            this.fill.alpha = this.selected.alpha;
        } else {
            this.stroke.alpha = this.selected.alpha;
        }
        this.show();
    }
    show() {
        const gr = this.view.graphics;
        gr.clear();
        gr.drawBox(0, 0, 50, 24, true, this.over.val, 1);
        gr.drawBox(0, 50, 50, 24, false, this.selected.val, 1);
        gr.write(25, 40, this.over.hex, GlobalFormat);
        gr.write(25, 90, this.selected.hex, GlobalFormat);
        this.callback(this);
    }
}
class Checkbox extends UiElement {
    _txt: string = "";
    checked: boolean;
    constructor(target: DisplayObjectContainer, name: string, x: number, y: number, public msg: string, checked: boolean, public callback: (e:Checkbox) => void) {
        super(target, name, x, y, 24, 24, callback);
        this.addEventListener("click", (c: Checkbox) => {
            c.checked = !c.checked;
            c.draw();
            c.callback(c);
        });
        this.checked = checked;
        this.draw();
    }
    /**
     * Modification sans callback
     * @param bool checked ?
     */
    setCheck(bool:boolean) {
        if(this.checked != bool) {
            this.checked = bool;
            this.draw();          
        }
    }
    draw() {
        let gr = this.graphics;
        gr.clear();
        gr.lineStyle();
        gr.drawBox(0, 0, 24, 24, true, 0x6666FF);
        gr.drawBox(2, 2, 19, 19, false, 0x9999FF);
        if (this.checked) {
            gr.lineStyle(3, 0x009900, 1);
            gr.drawLines(new Point(4, 11), new Point(9, 18), new Point(17, 4));
        } else {
            gr.lineStyle(3, 0xFF0000, 1);
            gr.line(4, 6, 18, 18);
            gr.line(18, 6, 4, 18);
        }
        gr.write(28, 16, this.msg, CheckFormat);
    }
}
class HRange extends UiElement {
    curs: Sprite;
    constructor(target: DisplayObjectContainer, name: string, x: number, y: number, w: number, public msg:string, public callback: (s: HRange) => void) {
        super(target, name, x, y, w, 20, callback);
        this.graphics.beginFill(0x6666DD, 1.0);
        this.graphics.drawRect(0, 0, w, 22);
        this.graphics.drawBox(4, 10, w-8, 2, false, 0x555599, 1.0);// creux, plus sombre que scène
        this.graphics.write(w/2, 34, msg, GlobalFormat);
        let curs: Sprite = new Sprite("curs", 0, 0, 14, 20), gr = curs.graphics;
        gr.drawBox(0, 0, 14, 20, true, 0x666699);
        gr.line(3, 6, 11, 6);
        gr.line(3, 10, 11, 10);
        gr.line(3, 14, 11, 14);
        this.addChild(curs);
        this.curs = curs;
        this.percent = 0.5;        
        new DragPower(curs, new Rectangle(0, 0, this.w, this.h), (curs:Sprite)=> this.callback(this), "pointer");
    }

    get percent(): number {
        return this.curs.x / (this.w - 14);
    }
    set percent(value: number) {
        value = MIN(value, 1);
        value = MAX(value, 0);
        this.curs.x = value * (this.w - 14);
        this.callback(this);
        this.graphics.write(0, -15, value.toFixed(2),GlobalFormat)

    }
}
class HSlider extends UiElement {
    curs: Sprite;
    cursSize: number = 0.25;
    constructor(target: DisplayObjectContainer, name: string, x: number, y: number, w: number, h: number, public callback: (s: HSlider) => void, public showVal: boolean) {
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
class Radio extends UiElement {
    items:RadioItem[] = [];
    index:number = 0;
    constructor(target: DisplayObjectContainer, name: string, x: number, y: number, ver:boolean, public msg: string[], public callback: (e:Radio) => void) {
        super(target, name, x, y, ver ? 80 : msg.length * 80, ver ? msg.length*28:24, callback);
        for(let i = 0; i < msg.length; i++) {
            if(ver) {
                this.items.push(new RadioItem(this, msg[i], 0, i*28, msg[i], i==0, (c)=> this.onCheck(c)));
            } else {
                this.items.push(new RadioItem(this,msg[i], i * 80, 0, msg[i], i==0, (c)=> this.onCheck(c)));
            }
        }
    }
    onCheck(c:RadioItem) {
        this.selected = c;
        this.callback(this);
    }
    get selected():RadioItem {
        return this.items[this.index];
    }
    set selected(c:RadioItem) {
        this.index = this.items.indexOf(c);
        this.items.forEach(i=> i.setCheck(false));
        c.setCheck(true);
    }
}
class RadioItem extends UiElement {
    _txt: string = "";
    checked: boolean;
    constructor(target: Radio, name: string, x: number, y: number, public msg: string, checked: boolean, public callback: (e:RadioItem) => void) {
        super(target, name, x, y, 24, 24, callback);
        this.addEventListener("click", (c: RadioItem) =>  c.callback(c));
        this.checked = checked;
        this.draw();
    }
    /**
     * Modification sans callback
     * @param bool checked ?
     */
    setCheck(bool:boolean) {
        if(this.checked != bool) {
            this.checked = bool;
            this.draw();          
        }
    }
    draw() {
        let gr = this.graphics;
        gr.clear();
        gr.beginFill(0xFFFFFF,1);
        gr.lineStyle(1, 0x000000, 1);
        gr.drawCircle(0, 0, 12);
        gr.beginFill(this.checked ? 0x00FF00: 0x999999, 1);
        gr.lineStyle(1, this.checked ? 0x000000: 0x666666, 1);
        gr.drawCircle(5, 5, 7);
        gr.write(28, 16, this.msg, CheckFormat);
    }
}
class TextField extends Sprite {
    bg: boolean = false;
    bd: boolean = false;
    bgc: number = 0;
    bdc: number = 0;
    bga: number = 1.0;
    bda: number = 1.0;
    graphics: Graphics;
    _txt: string | null = null;
    _fmt: TextFormat = new TextFormat;
    constructor(name:string, x: number = 0, y: number = 0) {
        super(name, x, y, 100, 100);
        this.graphics = new Graphics(this);
    }

    get background(): boolean { return this.bg }
    set background(value: boolean) { this.bg = value;  }
    get border(): boolean { return this.bd }
    set border(value: boolean) { this.bd = value;  }
    get backgroundColor(): number { return this.bgc; }
    set backgroundColor(value: number) { this.bgc = value;  }
    get borderColor(): number { return this.bdc }
    set borderColor(value: number) { this.bdc = value; }
    get text(): string|null { return this._txt; }
    set text(value: string | null) {
        this._txt = value;
    }
}
class TextFormat {
    font: string;
    size: number;
    color: number;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strike: boolean;
    smallCaps: boolean;
    align: string = "left";

    constructor(fontName?: string, size?: number, color?: number, bold?: boolean, italic?: boolean, underline?: boolean, align?: string, strike?: boolean, smallCaps?: boolean) {
        this.font = fontName == undefined ? "Verdana" : fontName;
        this.size = size || 12;
        this.color = color == undefined ? 0x0000FF : color;// 
        this.bold = bold == undefined ? false : bold;
        this.italic = italic == undefined ? false : italic;
        this.underline = underline == undefined ? false : underline;
        this.strike = strike == undefined ? false : strike;
        this.smallCaps = smallCaps == undefined ? false : smallCaps;
        this.align = align == undefined ? "left" : align;
    }
    setTo(f: TextFormat) {
        this.font = f.font;
        this.size = f.size;
        this.color = f.color;
        this.bold = f.bold;
        this.italic = f.italic;
        this.underline = f.underline;
        this.strike = f.strike;
        this.smallCaps = f.smallCaps;
        this.align = f.align;
    }
    get style(): string {
        return this.italic ? "italic " : "";
    }
    get variant(): string {
        return this.smallCaps ? "small-caps " : "";
    }
    get weight(): string {
        return this.bold ? "bold " : "";
    }
    get decoration(): string {
        return this.underline ? "underline " : this.strike ? "line-through " : "";
    }
    get css(): string {
        let t = `${this.size}px ${this.style}${this.variant}${this.weight}${this.decoration}${this.font}`;
        return t;
    }
    applyOn(ctx: CanvasRenderingContext2D): any {
        ctx.textAlign = this.align;
        ctx.fillStyle = new Color(this.color, 1).css;
        ctx.font = this.css;
    }
}
class VSlider extends UiElement {
    curs: Sprite;
    cursSize: number = 0.25;
    constructor(target: DisplayObjectContainer, name: string, x: number, y: number, w: number, h: number, public callback: (s: VSlider) => void, public showVal: boolean) {
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
        this.callback(this);
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