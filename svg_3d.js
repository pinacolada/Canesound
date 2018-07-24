//returns an array of the index of the path sorted by Z
function sortZ(pathArray) {
    var resultArray = new Array();
    for (var i in pathArray) {
        var j = resultArray.length;
        while (j > 0 && pathArray[resultArray[j-1]].z > pathArray[i].z) {
            //translates to the right
            resultArray[j] = resultArray[j-1];
            j--;
        }
        //only dumps the indice of the path
        resultArray[j] = i;
    }
    return resultArray;
}

function Path(pathId) {
    this.domNode = document.getElementById(pathId);
    this.oldD = this.domNode.getAttribute("d");
    this.z = 0;
}

function PathFromNode(path) {
    this.domNode = path;
    this.oldD = this.domNode.getAttribute("d");
    this.z = 0;
}

function Polyline(polylineId) {
    this.domNode = document.getElementById(polylineId);
    this.oldPoints = this.domNode.getAttribute("points");
    this.z = 0;
}

function Shape(path) {
    this.domNode = path;
    if (path.localName == "path") {
        this.oldD = this.domNode.getAttribute("d");
    } else if (path.localName == "path") {
        this.oldPoints = this.domNode.getAttribute("points");
    }
    this.z = 0;
}

var xySeparation = new RegExp("[, -]");
var figure = new RegExp("[\\d.-]");
var pointSeparation = new RegExp("\\D");
var finalZ = new RegExp("[Zz]");

function transformPath(path, matrixArray) {
    //in coord will be concatenated the numbers found
    var coord = "";
    var x;
    var y;
    // keep the z in an array which will be used to calculate the average z
    var zStore = new Array();
    //get the first char
    var newD = path.oldD.charAt(0);
    for (var i = 1 ; i < path.oldD.length ; i++) {
        var ch = path.oldD.charAt(i);
        //there may be a comma, a space or a minus between x and y coord
        if (x == undefined && coord.length > 0 && xySeparation.test(ch)) {
            x = parseFloat(coord);
            coord = "";
        // if it is a digit, a dot or a minus
        } else if (figure.test(ch)) {
            coord += ch;
        // if it is something else than a figure
        } else if (pointSeparation.test(ch)) {
            //if it is the beginning of the path or there is multiple spaces, coord is empty
            if (coord.length > 0) {
                y = parseFloat(coord);
                //must return newD otherwise not modified
                newD += transformStoreZ(x, y, 0, matrixArray, zStore);
                x = undefined;
                y = undefined;
                coord = "";
            }
            newD += ch;
        }
    }
    //adds the last point if there is no finishing z
    if (!(finalZ.test(path.oldD.charAt(path.oldD.length - 1)))) {
        y = parseFloat(coord);
        newD += transformStoreZ(x, y, 0, matrixArray, zStore);		
    }
    
    //sets the 'z' attribute of the path
    var sum = 0;
    for (var i in zStore) {
        sum += zStore[i];
    }
    path.z = sum/zStore.length;
    
    path.domNode.setAttribute("d", newD);
}


function transformPolyline(polyline, matrixArray) {
    //in coord will be concatenated the numbers found
    var coord = "";
    var x;
    var y;
    // keep the z in an array which will be used to calculate the average z
    var zStore = new Array();
    //get the first char
    var newPoints = path.oldD.charAt(0);
    for (var i = 1; i < polyline.oldPoints.length ; i++) {
        var ch = polyline.oldPoints.charAt(i);
        if (ch == ",") {
            //allow the declaration of 3D points
            if (x == undefined) {
                x = parseFloat(coord);
            } else {
                y = parseFloat(coord);
            }
            coord = "";
        //the point finishes
        } else if (ch == " ") {
            //if it is the beginning of the path or there is multiple spaces, coord is empty
            if (coord.length != 0) {
                y = parseFloat(coord);
                newPoints += transformStoreZ(x, y, 0, matrixArray, zStore);
                x = undefined;
                y = undefined;
                coord = "";
                newPoints += ch;
            }
        // if it is a digit, a comma or a minus
        } else if (ch.match(/\d/) || ch == "." || ch == "-") {
            coord += ch;
        }
    }
    //adds the last point
    y = parseFloat(coord);
    newPoints += transformStoreZ(x, y, 0, matrixArray, zStore);
    
    //sets the 'z' attribute of the polyline
    var sum = 0;
    var i;
    for (i in zStore) {
        sum += zStore[i];
    }
    polyline.z = sum/zStore.length;
    
    polyline.domNode.setAttribute("points", newPoints);
}

function transformStoreZ(x, y, z, matrixArray, zStore) {
    var pt3d = new Array();
    pt3d[0] = x;
    pt3d[1] = y;
    pt3d[2] = z;
    transformPoint(matrixArray, pt3d);
    projectPoint3d(pt3d);
    zStore.push(pt3d[2]);
    return pt3d[0] + "," + pt3d[1];
}

// multiplies by matrix from last to first
function transformPoint(matrixArray, pt3d) {
    //optimization ?
    var newx = 0;
    var newy = 0;
    var newz = 0;
    for (var i = matrixArray.length-1 ; i >= 0 ; i--) {
        var matrix = matrixArray[i];
        //must keep the old values
        newx = pt3d[0]*matrix[0] + pt3d[1]*matrix[1] + pt3d[2]*matrix[2] + matrix[3];
        newy = pt3d[0]*matrix[4] + pt3d[1]*matrix[5] + pt3d[2]*matrix[6] + matrix[7];
        newz = pt3d[0]*matrix[8] + pt3d[1]*matrix[9] + pt3d[2]*matrix[10] + matrix[11];
        pt3d[0] = newx;
        pt3d[1] = newy;
        pt3d[2] = newz;
    }
}

function projectPoint3d(pt3d) {
    pt3d[0] = pt3d[0] * (_focalDistance / (_deformingDistance - pt3d[2])) + _xOrigin;
    pt3d[1] = pt3d[1] * (_focalDistance / (_deformingDistance - pt3d[2])) + _yOrigin;
}


// Sets the specified matrix to a rotation matrix
function setAnglesRotationMatrix(rotx, roty, rotz) {
    // Assuming the angles are in radians
    var cx = Math.cos(rotx);
    var sx = Math.sin(rotx);
    var cy = Math.cos(roty);
    var sy = Math.sin(roty);
    var cz = Math.cos(rotz);
    var sz = Math.sin(rotz);
    
    return setRotationMatrix(cx, sx, cy, sy, cz, sz);
}

function setRotationMatrix(cx, sx, cy, sy, cz, sz) {
    var matrix = new Array();
    matrix[0] = cz * cy;
    matrix[1] = sz * cx * cy - sx * sy;
    matrix[2] = sz * sx * cy + cx * sy;
    matrix[3] = 0;
    
    matrix[4] = -sz;
    matrix[5] = cz * cx;
    matrix[6] = cz * sx;
    matrix[7] = 0;
    
    matrix[8] = -cz * sy;
    matrix[9] = -sz * cx * sy - sx * cy;
    matrix[10] = -sz * sx * sy + cx * cy;
    matrix[11] = 0;
    return matrix;
}

function setTranslationMatrix(x, y, z) {
    var matrix = new Array();
    matrix[0] = 1;
    matrix[1] = 0;
    matrix[2] = 0;
    matrix[3] = x;
    matrix[4] = 0;
    matrix[5] = 1;
    matrix[6] = 0;
    matrix[7] = y;
    matrix[8] = 0;
    matrix[9] = 0;
    matrix[10] = 1;
    matrix[11] = z;
    return matrix;
}