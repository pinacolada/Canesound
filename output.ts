const toolLineStyle = new Stroke(2, 0xFFFF00, 0.5);
const toolFillStyle = new Fill(0x336699, 0.5);
const GlobalFormat = new TextFormat("calibri", 14, 0x0000ff, false, false, false, "center");

const stage = new Stage(document.body);
stage.stageWidth = 1024;
stage.stageHeight = 800;
stage.backgroundColor = 0x666699;

const grid = new Grid(stage, "grille", 100, 30, 16 * 30, 16 * 30);
grid.visible = false;// bug !?
grid.drawGrid(16, 16, 0x00ffff, "Calibri", 10, 0x003333, -9, -2);

let rot = new HSlider(stage, "Rotation", grid.x, grid.b + 5, grid.w, 30, true);
let transX = new HSlider(stage, "Trans X", grid.r + 35, grid.b-20, 100, 20, false);
let transY = new VSlider(stage, "Trans Y", grid.r + 5, grid.b - 100, 20, 100, false);

let currentTool: Tool;
let draw: Tool[] = [];
let tools: Tool[];

const mgLeft = grid.x - 75, mgTop = grid.y, ecart = 70;
tools = [
    new LineTool(stage, mgLeft, mgTop + ecart * 0, toolLineStyle, showCurrentTool),
    new CurveTool(stage, mgLeft, mgTop + ecart * 1, toolLineStyle, showCurrentTool),
    new CubicTool(stage, mgLeft, mgTop + ecart * 2, toolLineStyle, showCurrentTool),
    new RectTool(stage, mgLeft, mgTop + ecart * 3, toolFillStyle, toolLineStyle, showCurrentTool),
    new CircleTool(stage, mgLeft, mgTop + ecart * 4,toolFillStyle, toolLineStyle, showCurrentTool),
    new EllipseTool(stage, mgLeft, mgTop + ecart * 5, toolFillStyle, toolLineStyle, showCurrentTool),
    new PolylineTool(stage, mgLeft, mgTop + ecart * 6, toolLineStyle, showCurrentTool),
    new PolygonTool(stage, mgLeft, mgTop + ecart * 7, toolFillStyle, toolLineStyle, showCurrentTool)
];

let btnLeft = 600, btnTop = 30, btnWidth = 100, btnHeight = 30;
let cmds = ["Clear", "Line", "Curve", "Cubic", "Rect", "Circle", "Ellipse", "Polyline", "Polygon"];
let frcmds = ["Effacer", "Ligne", "Courbe 1pt", "Courbe 2pts", "Rectangle", "Cercle", "Ellipse", "Segments", "Polygone"];
cmds.forEach((c, i) => new Button(stage, c, frcmds[i], btnLeft, btnTop + (btnHeight * i), btnWidth, btnHeight - 2, btnCmd));

let numPad = ["", "/ Scale-","* Scale+","- Del Pt",
    "R°z -",     "T_y -",  "R°z +",  "+ Add Pt",
    "T_x -",     "__" ,  "T_x +", "+ Add Pt",
    "Prev",     "T_y +",  "Next",   "__"]   
numPad.forEach((c, i) =>
    new Button(stage, c, c, btnLeft + 110 + (i % 4 * 60), btnTop + Math.floor(i / 4) * 50, 55, 35, onNumPad));

function onNumPad(b: Button) {
    let p = currentTool as PolygonTool;
    if (!(p instanceof PolygonTool)) return;

    switch (b.name) {
        case "/ Scale-": p.scaleNodes(1.00-(1.00/10.00)); break;
        case "* Scale+": p.scaleNodes(1.00+(1.00/10.00)); break;
        case "R°z -": p.rotateNodes(-5) ; break;
        case "T_y -": p.translateNodes(0, -5) ;break;
        case "R°z +": p.rotateNodes(5) ;break;
        case "- Del Pt": p.delCurrNode(); break;
        case "T_x -": p.translateNodes(-5, 0);break;
        case "T_x +": p.translateNodes(5, 0); break;
        case "+ Add Pt":p.createNode(); break;
        case "Prev": p.choosePrev(); break;
        case "T_y +": p.translateNodes(0, 5); break;
        case "Next": p.chooseNext(); break;
    }    
}
function btnCmd(b: Button) {
    let next = currentTool ? currentTool.addPoint(currentTool.pts[0]).add(40,0) : grid.topLeft;
    switch (b.name) {
        case "Clear": draw.forEach(t => t.remove()); draw = []; break;  
        case "Line": draw.push( new LineTool(stage, next.x, next.y, toolLineStyle, showCurrentTool) ); break;
        case "Curve": draw.push( new CurveTool(stage, next.x, next.y, toolLineStyle, showCurrentTool) );break;
        case "Cubic": draw.push( new CubicTool(stage, next.x, next.y, toolLineStyle, showCurrentTool) );break;
        case "Rect": draw.push( new RectTool(stage, next.x, next.y, toolFillStyle, toolLineStyle, showCurrentTool) );break;
        case "Circle": draw.push( new CircleTool(stage, next.x, next.y, toolFillStyle, toolLineStyle, showCurrentTool) );break;
        case "Ellipse": draw.push( new EllipseTool(stage, next.x, next.y, toolFillStyle, toolLineStyle, showCurrentTool) );break;
        case "Polyline": draw.push( new PolylineTool(stage, next.x, next.y, toolLineStyle, showCurrentTool) );break;
        case "Polygon": draw.push( new PolygonTool(stage, next.x, next.y, toolFillStyle, toolLineStyle, showCurrentTool) ); break;
        case "Load": ; break;
        case "Save": ; break;
    }
}
function showCurrentTool(t: Tool) {
    if (currentTool === t) return;
    if (currentTool !== undefined) currentTool.selected = false;
    currentTool = t;
    currentTool.selected = true;
    // if (tools && tools.includes(currentTool)) return;
}

grid.addEventListener("click", () => addPointToGrid(grid));
function addPointToGrid(g: Grid) {
    let stage = g.stage as Stage, tool = currentTool;
    if (stage.css.cursor !== "auto") return;
    if (tool instanceof PolylineTool || tool instanceof PolygonTool) {
        let zero = new Point(0,0), m = new Point(tool.mouseX, tool.mouseY);
        if (tool.pts.find((p) => p.distTo(m) < 20)) return;
        let sn = tool.createSpriteNode(m);
        tool.onMobile(sn);
    }
}




