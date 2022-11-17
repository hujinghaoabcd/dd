/**
 * Created by yalong on 5/26/15.
 */
/// <reference path="Point.ts"/>
function toRad(degree) {
    return degree * Math.PI / 180;
}
function getDistance(lat1, long1, lat2, long2) {
    var x1 = lat2 - lat1;
    var dLat = toRad(x1);
    var x2 = long2 - long1;
    var dLon = toRad(x2);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
var MapProjector = (function () {
    function MapProjector(leftBottom, range, leftBottomLat, leftBottomLong, latRange, longRange) {
        this.leftBottom = leftBottom;
        this.range = range;
        this.leftBottomLat = leftBottomLat;
        this.leftBottomLong = leftBottomLong;
        this.xRange = getDistance(leftBottomLat, leftBottomLong, leftBottomLat, leftBottomLong + longRange);
        this.yRange = getDistance(leftBottomLat, leftBottomLong, leftBottomLat + latRange, leftBottomLong);
    }
    MapProjector.prototype.getMap2DPosition = function (lat, long) {
        var diffLat = lat - this.leftBottomLat;
        var diffLong = long - this.leftBottomLong;
        function check(value, add) {
            if (value < 0) {
                value += add;
            }
            return value;
        }
        diffLat = check(diffLat, 180);
        diffLong = check(diffLong, 360);
        var diffX = getDistance(this.leftBottomLat, this.leftBottomLong, this.leftBottomLat, this.leftBottomLong + diffLong);
        var diffY = getDistance(this.leftBottomLat, this.leftBottomLong, this.leftBottomLat + diffLat, this.leftBottomLong);
        var resultX = this.leftBottom.x + this.range.x * diffX / this.xRange;
        var resultY = this.leftBottom.y + this.range.y * diffY / this.yRange;
        return new Geometry.Point(resultX, resultY);
    };
    return MapProjector;
}());
//# sourceMappingURL=MapProjector.js.map