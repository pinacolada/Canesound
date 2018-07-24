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
        return this.underline ? "underline " : this.strike ? "line-through" : "";
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