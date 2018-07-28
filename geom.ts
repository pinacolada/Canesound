// ******************************************************************************************************************************************************************************************************

// GEOM : Col (couleur) Point Rectangle Matrix Matrix3D Transform 

// ******************************************************************************************************************************************************************************************************

const MIN = Math.min, MAX = Math.max, PI = Math.PI;
const enRadians = (degres: number) => PI * degres / 180;
const enDegres = (radians: number) => {let d = 180 * radians / PI; return d > 0 ? d : d + 360 };

class Color {
    constructor(public val: number = 0, public alpha: number = 1.0) {
    }
    static FromCss(csstext: string | null): Color {
        csstext = csstext || "rgba(0,0,0,1)";
        let [r, g, b] = csstext.split("(")[1].split(",").map(t => parseInt(t));
        return new Color(r << 16 | g << 8 | b, 1);
    }
    get css(): string {
        return "rgba(" + this.rgba.join(",") + ")";
    }
    get rgb(): Uint8ClampedArray {
        return new Uint8ClampedArray([this.val >> 16 & 0xff, this.val >> 8 & 0xff, this.val & 0xff]);
    }
    get rgba(): Float32Array {
        return new Float32Array([this.val >> 16 & 0xff, this.val >> 8 & 0xff, this.val & 0xff, this.alpha]);
    }
    get r(): number {
        return this.rgb[0];
    }
    get g(): number {
        return this.rgb[1];
    }
    get b(): number {
        return this.rgb[2];
    }
}
class Point {
    constructor(public x: number = 0, public y: number = 0) { }

    setPos(x: number, y: number) { this.x = x; this.y = y; }
    polar(dist: number, angle: number): Point {
        return new Point(this.x + Math.cos(angle) * dist, this.y + Math.sin(angle) * dist);
    }
    /**
    * Renvoie la distance entre pt1 et pt2.
    * @param pt1 premier point 
    * @param pt2 second point
    */
    static Distance(pt1: Point, pt2: Point): number {
        let x = pt1.x - pt2.x, y = pt1.y - pt2.y;
        return Math.sqrt(x * x + y * y);
    }
    /**
    * Détermine la position d'un point placé entre deux points. 
    * @param pt1  premier point 
    * @param pt2  second point
    * @param f pourcentage entre 0 (premier point) et 1(second point)
    */
    static Interpolate(pt1: Point, pt2: Point, f: number): Point {
        return new Point(pt2.x + (pt1.x - pt2.x) * f, pt2.y + (pt1.y - pt2.y) * f);
    }
    /**
     * Convertit une paire de coordonnées polaires en coordonnées cartésiennes.
     * @param len   distance
     * @param rad   angle en radians
     */
    static Polar(len: number, rad: number): Point {
        return new Point(len * Math.cos(rad), len * Math.sin(rad));
    }
    /**
    * La longueur du segment de ligne de (0,0) à ce point.
    */
    get length(): number {
        let x = this.x * this.x, y = this.y * this.y;
        return Math.sqrt(x + y);
    }
    /**
     * Crée un point résultant de l'addition de ce point et de deux valeurs
     * @param x valeur horizontale
     * @param y valeur verticale
     */
    add(x: number, y: number): Point {
        return new Point(this.x + x, this.y + y);
    }
    /**
     * Crée un point résultant de l'addition de ce point et d'un autre
     * @param p l'autre Point 
     */
    addPoint(p: Point): Point {
        return new Point(this.x + p.x, this.y + p.y);
    }
    /**
     * Ajoute des valeurs à ce point
     * @param x valeur horizontale
     * @param y valeur verticale 
     */
    addSelf(x: number, y: number): void {
        this.x += x;
        this.y += y;
    }
    /**
     * Ajoute les valeurs d'un autre point à ce point
     * @param p l'autre Point à ajouter
     */
    addSelfPoint(p: Point): void {
        this.x += p.x;
        this.y += p.y;
    }
    scaleSelf(factor: number):void {
        this.x *= factor;
        this.y *= factor;
    }
    /**
     * Distance entre ce Point et un autre
     * @param p l'autre Point
     */
    distTo(p: Point): number {
        return Point.Distance(this, p);
    }
    interpolTo(p: Point, pourcent: number): Point {
        return Point.Interpolate(this, p, pourcent);
    }
    polarTo(len: number, rad: number): Point {
        return Point.Polar(len, rad).addPoint(this);
    }
    rotateSelf(radians: number) {
        const sin_a = Math.sin(radians), cos_a = Math.cos(radians);
        const x = this.x * cos_a - this.y * sin_a;    // xP2 = xP1 * cos a - yP1 * sin a
        const y = this.x * sin_a + this.y * cos_a;    // YP2 = xP1 * sin a + yP1 * cos a
        this.x = x, this.y = y;
    }
    /**
     * Angle en radians avec un autre Point
     * @param p l'autre Point
     */
    angleRadians(p: Point): number {
        let [x1, y1, x2, y2] = [this.x, this.y, p.x, p.y];
        return Math.atan2(y2 - y1, x2 - x1);
    }
    /**
     * Angle en degrés avec un autre Point
     * @param p l'autre Point
     */
    angleDegres(p: Point) {
        return enDegres(this.angleRadians(p));
    }
    toString() {
        return "(x:" + this.x + "-y:" + this.y + ")";
    }
}
class Rectangle extends Point {
    constructor(x: number = 0, y: number = 0, public w: number = 0, public h: number = 0) {
        super(x, y);
    }
    setRect(x: number, y: number, w: number, h: number) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
    toString() {
        return super.toString() + "-(w:" + this.w + "-h:" + this.h + ")";
    }
    get topLeft(): Point {
        return new Point(this.x, this.y);
    }
    get bottomRight(): Point {
        return new Point(this.r, this.b);
    }
    get r(): number {
        return this.x + this.w;
    }
    get b(): number {
        return this.y + this.h;
    }
    containsPos(x: number, y: number): boolean {
        return this.x <= x && this.y <= y && this.r >= x && this.b >= y;
    }
    containsPt(p: Point): boolean {
        return this.x <= p.x && this.y <= p.y && this.r >= p.x && this.b >= p.y;
    }
    containsRec(alt: Rectangle): boolean {
        return this.containsPt(alt.topLeft) && this.containsPt(alt.bottomRight);
    }
    intersects(alt: Rectangle) {
        if (MAX(this.x, alt.x) < MIN(this.r, alt.r)) return false;
        return (MAX(this.y, alt.y) >= MIN(this.b, alt.b));
    }
    union(alt: Rectangle): Rectangle {
        let mi: Point = new Point(MIN(this.x, alt.x), MIN(this.y, alt.y));
        let ma: Point = new Point(MAX(this.r, alt.r), MAX(this.b, alt.b));
        return new Rectangle(mi.x, mi.y, ma.x - mi.x, ma.y - mi.y);
    }
}

class Transform {
    _stageRect = new Rectangle();
    size: Point = new Point(1, 1);
    constructor(public obj: DisplayObject) { }
    get stageRect(): Rectangle {
        this.findStage();
        return new Rectangle(this.stage.x, this.stage.y, this.obj.w, this.obj.h);
    }
    /**
     * Position relative à la scène des Points de l'objet
     */
    get stage(): Point {
        this.findStage();
        return this._stageRect.topLeft;
    }
    findStage() {
        let o = this.obj;
        this._stageRect.setRect(o.x, o.y, o.w, o.h);
        let previous = o.parent;
        while (previous != null && previous != o.stage) {
            this._stageRect.addSelf(previous.x, previous.y);
            previous = previous.parent;
        }
    }
}

