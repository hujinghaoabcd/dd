/**
 * Created by yalong on 5/25/15.
 */
var Geometry;
(function (Geometry) {
    var Point = (function () {
        function Point(x, y) {
            this.x = x;
            this.y = y;
        }
        return Point;
    }());
    Geometry.Point = Point;
})(Geometry || (Geometry = {}));
//# sourceMappingURL=Point.js.map