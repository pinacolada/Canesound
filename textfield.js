"use strict";
class TextField extends Sprite {
    constructor(name, x = 0, y = 0) {
        super(name, x, y, 100, 100);
        this.bg = false;
        this.bd = false;
        this.bgc = 0;
        this.bdc = 0;
        this.bga = 1.0;
        this.bda = 1.0;
        this._txt = null;
        this._fmt = new TextFormat;
        this.graphics = new Graphics(this);
    }
    get background() { return this.bg; }
    set background(value) { this.bg = value; }
    get border() { return this.bd; }
    set border(value) { this.bd = value; }
    get backgroundColor() { return this.bgc; }
    set backgroundColor(value) { this.bgc = value; }
    get borderColor() { return this.bdc; }
    set borderColor(value) { this.bdc = value; }
    get text() { return this._txt; }
    set text(value) {
        this._txt = value;
    }
}
class TextFormat {
    constructor(fontName, size, color, bold, italic, underline, align, strike, smallCaps) {
        this.align = "left";
        this.font = fontName == undefined ? "Verdana" : fontName;
        this.size = size || 12;
        this.color = color == undefined ? 0x0000FF : color; // 
        this.bold = bold == undefined ? false : bold;
        this.italic = italic == undefined ? false : italic;
        this.underline = underline == undefined ? false : underline;
        this.strike = strike == undefined ? false : strike;
        this.smallCaps = smallCaps == undefined ? false : smallCaps;
        this.align = align == undefined ? "left" : align;
    }
    setTo(f) {
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
    get style() {
        return this.italic ? "italic " : "";
    }
    get variant() {
        return this.smallCaps ? "small-caps " : "";
    }
    get weight() {
        return this.bold ? "bold " : "";
    }
    get decoration() {
        return this.underline ? "underline " : this.strike ? "line-through" : "";
    }
    get css() {
        let t = `${this.size}px ${this.style}${this.variant}${this.weight}${this.decoration}${this.font}`;
        return t;
    }
    applyOn(ctx) {
        ctx.textAlign = this.align;
        ctx.fillStyle = new Color(this.color, 1).css;
        ctx.font = this.css;
    }
}
