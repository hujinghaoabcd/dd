/**
 * Created by yalong on 7/20/15.
 */
// xm, ym is the new origin
var cos45 = Math.cos(45 * Math.PI / 180);
var sin45 = Math.sin(45 * Math.PI / 180);
var cosN45 = Math.cos(-45 * Math.PI / 180);
var sinN45 = Math.sin(-45 * Math.PI / 180);
function rotateWithCosSin(x, y, xm, ym, cos, sin) {
    var xr = (x - xm) * cos - (y - ym) * sin;
    var yr = (x - xm) * sin + (y - ym) * cos;
    return [xr, yr];
}
function rotate45(x, y, xm, ym) {
    var p = rotateWithCosSin(x, y, xm, ym, cos45, sin45);
    return [p[0] + xm, p[1] + ym];
}
function rotateN45(x, y, xm, ym) {
    var p = rotateWithCosSin(x, y, xm, ym, cosN45, sinN45);
    return [p[0] + xm, p[1] + ym];
}
// ===========================================================
function rotate45ToNewOrigin(x, y, xm, ym) {
    var xr = (x - xm) * sin45 + (y - ym) * cos45;
    var yr = (y - ym) * cos45 - (x - xm) * sin45;
    return [xr, yr];
}
function invertRotate45ToOrigin(x, y, xm, ym) {
    var xr = x * cos45 - y * sin45 + xm;
    var yr = x * sin45 + y * cos45 + ym;
    return [xr, yr];
}
function rotateN45ToNewOrigin(x, y, xm, ym) {
    var xr = (x - xm) * sin45 - (y - ym) * cos45;
    var yr = (x - xm) * sin45 + (y - ym) * cos45;
    return [xr, yr];
}
function invertRotateN45ToOrigin(x, y, xm, ym) {
    var xr = x * sin45 + y * cos45 + xm;
    var yr = y * sin45 - x * cos45 + ym;
    return [xr, yr];
}
var FAKE_ORIGIN_POINT = [0, 0];
function rotateFakeOrigin(x, y) {
    return rotate45ToNewOrigin(x, y, FAKE_ORIGIN_POINT[0], FAKE_ORIGIN_POINT[1]);
}
function invertFakeOrigin(x, y) {
    return invertRotate45ToOrigin(x, y, FAKE_ORIGIN_POINT[0], FAKE_ORIGIN_POINT[1]);
}
function rotateFakeDestination(x, y) {
    return rotateN45ToNewOrigin(x, y, FAKE_ORIGIN_POINT[0], FAKE_ORIGIN_POINT[1]);
}
function invertFakeDestination(x, y) {
    return invertRotateN45ToOrigin(x, y, FAKE_ORIGIN_POINT[0], FAKE_ORIGIN_POINT[1]);
}
//# sourceMappingURL=commonGeometry.js.map