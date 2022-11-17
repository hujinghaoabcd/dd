/**
 * Created by yalong on 5/25/15.
 */
/// <reference path="Point.ts"/>
/// <reference path="./lib/d3.d.ts"/>
var Geometry;
(function (Geometry) {
    var Cell = (function () {
        function Cell(position, width, height) {
            this.position = position;
            this.width = width;
            this.height = height;
            this.lineFunction = d3.svg.line()
                .interpolate("linear");
            //this.center = new Geometry.Point(position.x + width / 2, position.y + height / 2);
            this.center = position;
        }
        Cell.prototype.draw = function (svgContainer) {
            var tempPoints = [];
            var tempR = this.width / 2 * Math.sqrt(2);
            tempPoints[0] = {
                x: this.center.x,
                y: this.center.y - tempR
            };
            tempPoints[1] = {
                x: this.center.x + tempR,
                y: this.center.y
            };
            tempPoints[2] = {
                x: this.center.x,
                y: this.center.y + tempR
            };
            tempPoints[3] = {
                x: this.center.x - tempR,
                y: this.center.y
            };
            svgContainer.append("path")
                .attr("d", this.lineFunction(tempPoints))
                .attr("class", "matrix-line");
            //svgContainer.append('rect')
            //    .attr('x', this.position.x)
            //    .attr('y', this.position.y)
            //    .attr('width', this.width)
            //    .attr('height', this.height)
            //    .attr('fill', 'none')
            //    .attr('stroke', 'black')
            //    .attr('stroke-width', 0.1);
        };
        return Cell;
    }());
    Geometry.Cell = Cell;
})(Geometry || (Geometry = {}));
//# sourceMappingURL=Cell.js.map