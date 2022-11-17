/**
 * Created by yalong on 5/25/15.
 */
/// <reference path="commonGeometry.ts"/>
/// <reference path="Point.ts"/>
/// <reference path="Cell.ts"/>
var Geometry;
(function (Geometry) {
    var Matrix = (function () {
        function Matrix(position, width, height, rowGroups, columnGroups) {
            this.position = position;
            this.width = width;
            this.height = height;
            this.rowGroups = rowGroups;
            this.columnGroups = columnGroups;
            this.cells = [];
            this.groupBorder = 10;
            this.rowNum = 0;
            this.columnNum = 0;
            var rowBorderCount = 0;
            var columnBorderCount = 0;
            var rowGapIndex = [];
            var columnGapIndex = [];
            this.squareBorder = this.groupBorder / Math.sqrt(2);
            if (rowGroups.length == 1) {
                this.rowNum = rowGroups[0].length;
            }
            else {
                var index = 0;
                for (var i = 0; i < rowGroups.length; i++) {
                    var thisLength = rowGroups[i].length;
                    this.rowNum += thisLength;
                    rowBorderCount += 2;
                    index += thisLength;
                    rowGapIndex.push(index);
                }
            }
            if (columnGroups.length == 1) {
                this.columnNum = columnGroups[0].length;
            }
            else {
                var index = 0;
                for (var i = 0; i < columnGroups.length; i++) {
                    var thisLength = columnGroups[i].length;
                    this.columnNum += thisLength;
                    columnBorderCount += 2;
                    index += thisLength;
                    columnGapIndex.push(index);
                }
            }
            //var fakeRowNum = this.rowNum + rowBorderCount;
            var orUnit = (this.height / 2 * Math.sqrt(2) - this.groupBorder * rowBorderCount) / this.rowNum;
            var desUnit = (this.width / 2 * Math.sqrt(2) - this.groupBorder * rowBorderCount) / this.columnNum;
            this.unit = Math.min(orUnit, desUnit);
            this.squareUnit = this.unit / Math.sqrt(2);
            this.position.y = this.position.y + (this.height - this.unit * this.rowNum - this.groupBorder * rowBorderCount) / 2 - 10;
            this.height = this.unit * this.rowNum + this.groupBorder * rowBorderCount;
            this.width = this.unit * this.rowNum + this.groupBorder * rowBorderCount;
            this.squareWidth = this.width / Math.sqrt(2);
            this.squareHeight = this.height / Math.sqrt(2);
            this.maximumRadius = this.unit / 2;
            this.rotate = function (x, y) {
                return rotate45(x, y, this.centerPoint.x, this.centerPoint.y);
            };
            this.centerPoint = new Geometry.Point(this.position.x + this.width / 2, this.position.y + this.height / 2);
            var rowGap = 0;
            if (rowBorderCount != 0) {
                rowGap += 1;
            }
            for (var i = 0; i < this.rowNum; i++) {
                this.cells[i] = [];
                if (rowGapIndex.indexOf(i) >= 0) {
                    rowGap += 2;
                }
                var columnGap = 0;
                if (columnBorderCount != 0) {
                    columnGap += 1;
                }
                for (var j = 0; j < this.columnNum; j++) {
                    if (columnGapIndex.indexOf(j) >= 0) {
                        columnGap += 2;
                    }
                    var p = [position.x + this.unit * (j + 0.5) + columnGap * this.groupBorder,
                        position.y + this.unit * (i + 0.5) + rowGap * this.groupBorder];
                    p = this.rotate(p[0], p[1]);
                    this.cells[i][j] = new Geometry.Cell(new Geometry.Point(p[0], p[1]), this.unit, this.unit);
                }
            }
            this.leftTop = this.rotate(this.position.x, this.position.y);
            this.leftBottom = this.rotate(this.position.x, this.position.y + this.height);
        }
        Matrix.prototype.getCell = function (rowIndex, columnIndex) {
            return (this.cells[rowIndex])[columnIndex];
        };
        Matrix.prototype.draw = function (svgContainer) {
            // not rotated
            //for(var i = 0; i < this.rowNum + 1; i++){
            //    svgContainer.append('line')
            //        .attr('x1', this.position.x)
            //        .attr('y1', this.position.y + i * this.perHeight)
            //        .attr('x2', this.position.x + this.width)
            //        .attr('y2', this.position.y + i * this.perHeight)
            //        .attr('stroke', "black")
            //        .attr('stroke-width', 0.3);
            //}
            //
            //for(var i = 0; i < this.columnNum + 1; i++){
            //    svgContainer.append('line')
            //        .attr('x1', this.position.x + i * this.perWidth)
            //        .attr('y1', this.position.y)
            //        .attr('x2', this.position.x + i * this.perWidth)
            //        .attr('y2', this.position.y + this.height)
            //        .attr('stroke', "black")
            //        .attr('stroke-width', 0.3);
            //}
            //for(var i = 0; i < this.rowNum; i++){
            //    var startP = this.rotate(this.position.x,
            //        this.position.y + (i) * this.unit);
            //    var endP = this.rotate(this.position.x + this.width,
            //        this.position.y + (i) * this.unit);
            //
            //    svgContainer.append('line')
            //        .attr('x1', startP[0])
            //        .attr('y1', startP[1])
            //        .attr('x2', endP[0])
            //        .attr('y2', endP[1])
            //        .attr('class', "matrix-line")
            //}
            //
            //for(var i = 1; i < this.columnNum + 1; i++){
            //    var startP = this.rotate(this.position.x + (i) * this.unit,
            //        this.position.y);
            //    var endP = this.rotate(this.position.x + (i) * this.unit,
            //        this.position.y + this.height);
            //
            //
            //    svgContainer.append('line')
            //        .attr('x1', startP[0])
            //        .attr('y1', startP[1])
            //        .attr('x2', endP[0])
            //        .attr('y2', endP[1])
            //        .attr('class', "matrix-line")
            //}
            for (var i = 0; i < this.rowNum; i++) {
                for (var j = 0; j < this.columnNum; j++) {
                    this.cells[i][j].draw(svgContainer);
                }
            }
        };
        return Matrix;
    }());
    Geometry.Matrix = Matrix;
})(Geometry || (Geometry = {}));
//window.onload = function(e){
//    var preferWidth = window.innerWidth - 30;
//    var preferHeight = window.innerHeight - 70;
//
//    var svgContainer = d3.select('svg')
//        .attr('width', preferWidth)
//        .attr('height', preferHeight);
//
//    var matrix = new Geometry.Matrix(new Geometry.Point(0,0), 500, 500, 3, 2);
//    matrix.draw(svgContainer);
//};
//# sourceMappingURL=Matrix.js.map