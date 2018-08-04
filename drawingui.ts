class SpriteNode extends Sprite {
    constructor(target: DisplayObjectContainer | Tool, id: string, x: number, y: number, public radius: number, bg: number, border: number, callback:any) {
        super(id, x, y, radius * 2, radius * 2);
        target.addChild(this);
        this.setColor(bg, border);
        if (target instanceof Tool) {
            new DragPower(this, null, () => {
                if(target instanceof PolygonTool) target.currNode = this;
                target.onMobile()  
            });
        } else {
            new DragPower(this, null, callback);
        }
    }
    setColor(background: number, border: number) {
        this.graphics.clear();
        this.graphics.lineStyle(2, border, 1);
        this.graphics.beginFill(background);
        this.graphics.drawCircle(0, 0, this.radius);
    }
}
class Tool extends SpriteNode {
    curve: Shape;
    /**
     * largeur de l'outil de dessin
     */
    static SIZE = 50;
    /**
     * rayon de la poignée (handle radius)
     */
    static HR = 5;
    pts: SpriteNode[] = [];
    selArrow: Shape = new Shape(0, 0);
    stroke:Stroke = new Stroke();
    fill:Fill = new Fill();
    constructor(target: DisplayObjectContainer, toolType: string, x: number, y: number, public callback:Function) {
        super(target, toolType, x, y, Tool.HR, 0xFF0000, 0xFFFFFF, callback);
        this.curve = new Shape(5, 5);
        this.addChild(this.curve);
        this.selArrow.graphics.beginFill(0xff00ff, 1);
        this.selArrow.graphics.drawShape(
            new Point(-8, 0), 
            new Point(-16, -8),
            new Point(-8, -16),
            new Point(0, -8), 
            new Point(0, 0))

        new KeyDownPower(this, this.moveTool);
        new KeyUpPower(this, this.moveTool);
        this.setDraw(toolFill, toolStroke);
    }
    setDraw(fill:Fill, stroke:Stroke) {
        this.fill.copy(fill);
        this.stroke.copy(stroke);
    }
    rotateNodes(degres: number) {
        let radians = RAD(degres);
        this.pts.forEach(p => p.rotateSelf(radians));
        this.onMobile();
    }
    translateNodes(tx:number, ty:number) {
        this.pts.forEach(p => p.addSelf(tx, ty));
        this.onMobile();
    }
    scaleNodes(factor: number) {
        this.pts.forEach(p => p.scaleSelf(factor));
        this.onMobile();
    } 
    addNode(id: string, x: number, y: number, radius: number, bg: number, bdr: number, push:boolean=true): SpriteNode {
        let t: Tool = this;
        let sn = new SpriteNode(t, id, x, y, radius, bg, bdr,
            (n: SpriteNode, msg: string) => t.onMobile());
        if(push) t.pts.push(sn);
        return sn;
    }
    onMobile() {
        // Dessin de l'outil terminé (implémenter pour les autres tools)
    }
    moveTool(s: InteractiveObject, k: KeyboardEvent) {
        let t = s as Tool;
        if (!t.selected) return;
        switch (k.key) {
            case "ArrowUp": t.y--; break;
            case "ArrowDown": t.y++; break;
            case "ArrowLeft": t.x--; break;
            case "ArrowRight": t.x++; break;
        }
    }
    get selected(): boolean {
        return this.contains(this.selArrow);
    }
    set selected(value: boolean) {
        if (value) {
            this.addChild(this.selArrow);
            this.pts.forEach(p=>p.visible=true);
        } else {
            this.removeChild(this.selArrow);
            this.pts.forEach(p => p.visible = false);
        }
    }
}
class LineTool extends Tool {
    sb: SpriteNode;
    constructor(target: DisplayObjectContainer, x: number, y: number, callback: Function) {
        super(target, "Line", x, y, callback);
        this.sb = this.addNode("b", Tool.SIZE, Tool.SIZE, Tool.HR, 0x00FF00, 0xFFFFFF);
        this.onMobile();
    }
    onMobile() {
        const s = this.stroke, g = this.curve.graphics;
        g.clear();
        g.lineStyle(s.thickness, s.color, s.alpha);
        g.line(0, 0, this.sb.x, this.sb.y);
        if (this.callback instanceof Function) this.callback(this);
    }
}
class CurveTool extends Tool {
    sb: SpriteNode;
    sc: SpriteNode;
    constructor(target: DisplayObjectContainer, x: number, y: number, callback: Function) {
        super(target, "Curve", x, y, callback);
        this.sb = this.addNode("b", Tool.SIZE, 0, Tool.HR, 0x0000FF, 0x999999);
        this.sc = this.addNode("c", 0, Tool.SIZE, Tool.HR, 0x00FF00, 0xFFFFFF);
        this.onMobile();
    }
    onMobile() {
        const s = this.stroke, g = this.curve.graphics;
        g.clear();
        g.lineStyle(s.thickness, s.color, s.alpha);
        g.curve(0, 0, this.sb.x, this.sb.y, this.sc.x, this.sc.y);
        if (this.callback instanceof Function) this.callback(this);
    }
}
class CubicTool extends Tool {
    sb: SpriteNode;
    sc: SpriteNode;
    sd: SpriteNode;
    constructor(target: DisplayObjectContainer, x: number, y: number, callback: Function) {
        super(target, "Cubic", x, y, callback);
        this.sb = this.addNode("b", Tool.SIZE, 0, Tool.HR, 0x0000FF, 0x999999);
        this.sc = this.addNode("c", Tool.SIZE, Tool.SIZE, Tool.HR, 0x0000FF, 0x999999);
        this.sd = this.addNode("d", 0, Tool.SIZE, Tool.HR, 0x00FF00, 0xFFFFFF);
        this.onMobile();
    }
    onMobile() {
        const s = this.stroke, g = this.curve.graphics;
        g.clear();
        g.lineStyle(s.thickness, s.color, s.alpha);
        g.cubicCurve(0, 0, this.sb.x, this.sb.y, this.sc.x, this.sc.y, this.sd.x, this.sd.y);
        if (this.callback instanceof Function) this.callback(this);
    }
}
class RectTool extends Tool {
    sb: SpriteNode;
    constructor(target: DisplayObjectContainer, x: number, y: number, callback: Function) {
        super(target, "Rect", x, y, callback);
        this.sb = this.addNode("b", Tool.SIZE, Tool.SIZE, Tool.HR, 0x00FF00, 0xFFFFFF);
        this.onMobile();
    }
    onMobile() {
        const s = this.stroke, f = this.fill, g = this.curve.graphics;
        g.clear();
        this.sb.x = MAX(this.sb.x, 10);
        this.sb.y = MAX(this.sb.y, 10);
        g.beginFill(f.color, f.alpha);
        g.lineStyle(s.thickness, s.color, s.alpha);
        g.drawRect(0, 0, this.sb.x, this.sb.y);
        if (this.callback instanceof Function) this.callback(this);
    }
}
class CircleTool extends Tool {
    sb: SpriteNode;
    constructor(target: DisplayObjectContainer, x: number, y: number, callback: Function) {
        super(target, "Circle", x, y, callback);
        this.sb = this.addNode("b", Tool.SIZE, Tool.SIZE, Tool.HR, 0x00FF00, 0xFFFFFF);
        this.onMobile();
    }
    onMobile() {
        const s = this.stroke, f = this.fill, g = this.curve.graphics;
        g.clear();
        this.sb.x = MAX(this.sb.x, 10);
        this.sb.y = MAX(this.sb.y, 10);
        g.beginFill(f.color, f.alpha);
        g.lineStyle(s.thickness, s.color, s.alpha);
        g.drawCircle(0, 0, this.sb.x / 2);
        // this.sb.y = this.sb.x;
        if (this.callback instanceof Function) this.callback(this);
    }
}
class EllipseTool extends Tool {
    sb: SpriteNode;
    constructor(target: DisplayObjectContainer, x: number, y: number, callback: Function) {
        super(target, "Ellipse", x, y, callback);
        this.sb = this.addNode("b", Tool.SIZE * 1, Tool.SIZE * 0.7, Tool.HR, 0x00FF00, 0xFFFFFF);
        this.onMobile();
    }
    onMobile() {
        const s = this.stroke, f = this.fill, g = this.curve.graphics;
        this.sb.x = MAX(this.sb.x, 10);
        this.sb.y = MAX(this.sb.y, 10);
        g.clear();
        g.beginFill(f.color, f.alpha);
        g.lineStyle(s.thickness, s.color, s.alpha);
        g.drawEllipse(0, 0, this.sb.x / 2, this.sb.y / 2);
        if (this.callback instanceof Function) this.callback(this);
    }
}
class PolygonTool extends Tool {
    currentIndex: number = 1;
    constructor(target: DisplayObjectContainer, x: number, y: number, callback: Function, line:boolean=false) {
        super(target, line ? "Polyline" : "Polygon", x, y, callback);
        let pts = [new Point(Tool.SIZE, 0), new Point(Tool.SIZE, Tool.SIZE), new Point(Tool.SIZE / 2, Tool.SIZE / 2), new Point(0, Tool.SIZE)];
        for (let p of pts) this.createSpriteNode(p);
        this.onMobile();
        new KeyDownPower(this, this.onKeyboard);
    }
    onMobile(n?:any) {
        const s = this.stroke, f = this.fill, g = this.curve.graphics;
        g.clear();
        g.beginFill(f.color, f.alpha);
        g.lineStyle(s.thickness, s.color, s.alpha);
        (this instanceof PolylineTool) ?
            g.drawLines(new Point(0, 0), ...this.pts) :
            g.drawShape(new Point(0, 0), ...this.pts) ;
        if(n instanceof SpriteNode) this.currNode = n;    
        if (this.callback instanceof Function) this.callback(this);
    }
    createSpriteNode(p: Point): SpriteNode {
        let n = this.addNode("n_", p.x, p.y, Tool.HR, 0x999999, 0xffffff, false);
        this.pts.splice(this.currentIndex + 1, 0, n);
        this.currNode = n;
        return n;
    }
    onKeyboard(i: InteractiveObject, k: KeyboardEvent) {
        let p = i as PolygonTool;
        if (!p.selected) return;
        k.preventDefault();
        k.stopPropagation();
        k.stopImmediatePropagation();
        switch (k.key) {
            case "*": p.trans.sz += 0.1; p.scaleNodes(p.trans.sz); break;
            case "/": p.trans.sz -= 0.1; p.scaleNodes(p.trans.sz); break;
            case "-": p.delCurrNode(); break;
            case "+": p.createNode(); break;            
            case "7": p.rotateNodes(-1); break; 
            case "8": p.translateNodes(0,-1); break;
            case "9": p.rotateNodes(1); break;
            case "4": p.translateNodes(-1,0); break;
            case "6": p.translateNodes(1,0); break;
            case "1": p.choosePrev(); break;
            case "2": p.translateNodes(0, 1); break;
            case "3": p.chooseNext(); break;
        }
        p.onMobile();
    }
    choosePrev() {
        if (this.currentIndex > 0) this.currNode = this.pts[this.currentIndex -1];
    }
    chooseNext() {
        if (this.currentIndex < this.last) this.currNode = this.pts[this.currentIndex+1];
    }
    createNode() {
        let index = this.currentIndex;
        if (index < this.last) {
            this.createSpriteNode(this.currNode.interpolTo(this.pts[index + 1], 0.5));
        } else {
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
        this.onMobile();
    }
    get currNode() {
        return this.pts[this.currentIndex];
    }
    set currNode(value: SpriteNode) {
        let prev = this.currNode;
        if (prev != null) prev.setColor(0x999999, 0xffffff);// gris ancien
        this.currentIndex = this.pts.indexOf(value);
        this.currNode.setColor(0xFFFF00, 0xffff00);// jaune nouveau
    }
    get last() {
        return this.pts.length - 1;
    }
}
class PolylineTool extends PolygonTool {
    constructor(target: DisplayObjectContainer, x: number, y: number, callback: Function) {
        super(target, x, y, callback, true);// couleur -1 = pas de remplissage...
    }
}