
// ******************************************************************************************************************************************************************************************************

// GRAPHICS GrCmd - Fill - Stroke - Gradient - Graphics

// ******************************************************************************************************************************************************************************************************
class Fill {
    constructor(public color: number = -1, public alpha: number = 1.0) {
    }
    copy(f: Fill) {
        this.setTo(f.color, f.alpha);
    }
    setTo(color: number, alpha: number) {
        this.color = color;
        this.alpha = alpha;
    }
    applyOn(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = new Color(this.color, this.alpha).css;
    }
    get style(): string {
        return new Color(this.color, this.alpha).css;
    }
}
class Stroke {
    constructor(public thickness: number = 1.0, public color: number = -1, public alpha: number = 1.0) {

    }
    applyOn(ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = new Color(this.color, this.alpha).css;
        ctx.lineWidth = this.thickness;
    }
    copy(s: Stroke) {
        this.setTo(s.thickness, s.color, s.alpha);
    }
    setTo(thickness: number, color: number, alpha: number) {
        this.thickness = thickness;
        this.color = color;
        this.alpha = alpha;
    }
    get style(): string {
        return new Color(this.color, this.alpha).css;
    }
}
class GrCmd {
    pts: Point[];
    fill: Fill = new Fill();
    stroke: Stroke = new Stroke();
    text: string = "";
    textformat: TextFormat = new TextFormat();
    constructor(public graphics: Graphics, public cmd: number, ...pts: Point[]) {
        this.pts = [...pts];
        this.fill.copy(graphics.fill);
        this.stroke.copy(graphics.stroke);
        this.graphics.commands.push(this);
    }
    write(t: string, fmt: TextFormat) {
        this.text = t;
        this.textformat = fmt;
    }
}
class Graphics {
    commands!: GrCmd[];
    pos: Point = new Point;
    fill: Fill = new Fill;
    stroke: Stroke = new Stroke;
    constructor(public obj: DisplayObject) {
        this.clear();
    }
    applyTo(ctx: CanvasRenderingContext2D, tr: Point) {
        if(this.obj.visible==false) this.commands=[];
        for (let c of this.commands) {
            let pt = c.pts;
            let [x0, y0, p1, p2, p3] = [tr.x + pt[0].x, tr.y + pt[0].y, pt[1], pt[2], pt[3]];
            ctx.beginPath();
            switch (c.cmd) {
                case 0:
                    ctx.moveTo(x0, y0);
                    break;
                case 1:
                    ctx.fillStyle = c.fill.style;
                    ctx.fillRect(x0, y0, 1, 1);
                    break;
                case 2:
                    ctx.moveTo(x0, y0);
                    ctx.lineTo(tr.x + pt[1].x, tr.y + pt[1].y);
                    break;
                case 3:
                    ctx.moveTo(x0, y0);
                    ctx.quadraticCurveTo(tr.x + p1.x, tr.y + p1.y, tr.x + p2.x, tr.y + p2.y);
                    break;
                case 4:
                    ctx.moveTo(tr.x + pt[0].x, tr.y + + pt[0].y);
                    ctx.bezierCurveTo(tr.x + p1.x, tr.y + p1.y, tr.x + p2.x, tr.y + p2.y, tr.x + p3.x, tr.y + p3.y)
                    break;
                case 5:
                    ctx.ellipse(x0 + p1.x, y0 + p1.x, p1.x, p1.x, 0, 0, Math.PI * 2);
                    break;
                case 6:
                    ctx.rect(x0, y0, p1.x, p1.y);
                    break;
                case 7:
                    ctx.ellipse(x0 + p1.x, y0 + p1.y, p1.x, p1.y, 0, 0, Math.PI * 2);
                    break;
                case 8:// todo : round rectangle 
                    break;
                case 9:// polygone ouvert
                    ctx.moveTo(x0, y0);
                    for (let i = 1; i < pt.length; i++) ctx.lineTo(tr.x + pt[i].x, tr.y + pt[i].y);
                    break;
                case 10:
                    ctx.moveTo(x0, y0);
                    for (let i = 1; i < pt.length; i++) ctx.lineTo(tr.x + pt[i].x, tr.y + pt[i].y);
                    ctx.closePath();// trace la dernière ligne : polygone fermé
                case 11:// texte 
                    c.textformat.applyOn(ctx);
                    ctx.fillText(c.text, x0, y0);
                    break;

            }
            if (c.fill.color > -1) {
                c.fill.applyOn(ctx);
                ctx.fill();
            }
            if (c.stroke.color > -1) {
                c.stroke.applyOn(ctx);
                ctx.stroke();
            }
        }
    }
    clear() {
        this.commands = [];
    }
    setPos(x: number, y: number) {
        this.pos.x = x;
        this.pos.y = y;
    }
    moveTo(x: number, y: number) {
        new GrCmd(this, 0, new Point(x, y));
    }
    plot(x: number, y: number, color: number, alpha: number = 1) {
        this.beginFill(color, alpha);
        new GrCmd(this, 1, new Point(x, y));
    }
    beginFill(color: number = -1, alpha: number = 1.0) {
        this.fill.setTo(color, alpha);
    }
    lineStyle(thickness: number = 1.0, borderColor: number = -1, borderAlpha: number = 1.0) {
        this.stroke.setTo(thickness, borderColor, borderAlpha);
    }
    line(x1: number, y1: number, x2: number, y2: number) {
        new GrCmd(this, 2, new Point(x1, y1), new Point(x2, y2));
    }
    lineTo(x: number, y: number) {
        new GrCmd(this, 2, this.pos, new Point(x, y));
    }
    curve(x1: number, y1: number, xa: number, ya: number, x2: number, y2: number) {
        new GrCmd(this, 3, new Point(x1, y1), new Point(xa, ya), new Point(x2, y2));
    }
    curveTo(x1: number, y1: number, xa: number, ya: number, x2: number, y2: number) {
        new GrCmd(this, 3, this.pos, new Point(xa, ya), new Point(x2, y2));
    }
    cubicCurve(x1: number, y1: number, xa1: number, ya1: number, xa2: number, ya2: number, x2: number, y2: number) {
        new GrCmd(this, 4, new Point(x1, y1), new Point(xa1, ya1), new Point(xa2, ya2), new Point(x2, y2));
    }
    cubicCurveTo(xa1: number, ya1: number, xa2: number, ya2: number, x2: number, y2: number = 1) {
        new GrCmd(this, 4, this.pos, new Point(xa1, ya1), new Point(xa2, ya2), new Point(x2, y2));
    }
    drawCircle(x: number, y: number, radius: number) {
        new GrCmd(this, 5, new Point(x, y), new Point(radius, radius));
    }
    drawRect(x: number, y: number, w: number, h: number) {
        new GrCmd(this, 6, new Point(x, y), new Point(w, h));
    }
    drawEllipse(x: number, y: number, w: number, h: number) {
        new GrCmd(this, 7, new Point(x, y), new Point(w, h));
    }
    drawRoundRect(x: number, y: number, w: number, h: number, xradius: number, yradius: number) {
        new GrCmd(this, 8, new Point(x, y), new Point(w, h), new Point(xradius, yradius));
    }
    drawPath(...pts: Point[]) {
        new GrCmd(this, 9, ...pts);
    }
    drawShape(...pts: Point[]) {
        new GrCmd(this, 10, ...pts);
    }
    drawBox(x: number, y: number, w: number, h: number, up: boolean = true, bgColor: number, bgAlpha: number = 1.0) {
        let [topLeft, topRight, bottomRight, bottomLeft] = [
            new Point(x, y),
            new Point(x + w, y),
            new Point(x + w, y + h),
            new Point(x, y + h)];
        const d = up ? 1 : 0;
        this.beginFill(bgColor, bgAlpha);
        this.drawRect(topLeft.x, topLeft.y, w, h);
        this.lineStyle(1, up ? 0xffffff : 0, 1);
        this.line(topLeft.x+d, topLeft.y, topRight.x, topRight.y);// haut
        this.line(topRight.x, topRight.y, bottomRight.x, bottomRight.y-d);// droite
        this.lineStyle(1, up ? 0x000000 : 0xFFFFFF, 1);
        this.line(topLeft.x, topLeft.y+d, bottomLeft.x, bottomLeft.y);// gauche
        this.line(bottomLeft.x, bottomLeft.y, bottomRight.x-d, bottomRight.y); // bas
    }
    write(x: number, y: number, text: string, fmt: TextFormat) {
        new GrCmd(this, 11, new Point(x, y)).write(text, fmt);
    }
}
