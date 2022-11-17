///<reference path="./lib/d3.d.ts"/>
/**
 * Created by yalong on 8/12/2015.
 */
function setColorRange(scale, range, sValue, lValue) {
    var cLength = range.length;
    var tempUnit = (lValue - sValue) / (cLength - 1);
    var tempDomain = [];
    for (var i = 0; i < cLength; i++) {
        tempDomain.push(sValue + i * tempUnit);
    }
    scale.domain(tempDomain)
        .range(range).interpolate(d3.interpolateHsl);
}
function drawColorLegend(svg, scale, x, y, width, height, isVertical) {
    if (isVertical === void 0) { isVertical = true; }
    var range = scale.range();
    var tempDomain = height;
    if (!isVertical) {
        tempDomain = width;
    }
    var tempScale = d3.scale.linear();
    setColorRange(tempScale, range, 0, tempDomain);
    var tempData = d3.range(tempDomain);
    if (isVertical) {
        svg.append("g")
            .selectAll("rect")
            .data(tempData)
            .enter().append("rect")
            .attr({
            width: width,
            height: 1,
            x: x,
            y: function (d, i) {
                return y + i * 1;
            },
            fill: function (d, i) {
                return tempScale(tempDomain + 1 - d);
            }
        });
    }
    else {
        svg.append("g")
            .selectAll("rect")
            .data(tempData)
            .enter().append("rect")
            .attr({
            width: 1,
            height: height,
            x: function (d, i) {
                return x + i * 1;
            },
            y: y,
            fill: function (d, i) {
                return tempScale(d);
            }
        });
    }
}
function drawCircleLegend(svg, scale, biggest, smallest, x, y, width, height, colors) {
    var bR = scale(biggest);
    var sR = scale(smallest);
    var rangeUnit = (bR - sR) / (colors.length - 1);
    var heightUnit = height / (colors.length - 1);
    colors.forEach(function (ele, index, array) {
        svg.append("circle")
            .attr({
            "cx": x + width / 2,
            "cy": y + heightUnit * index,
            "r": bR - rangeUnit * index,
            "fill": ele
        });
    });
}
var Scales = (function () {
    function Scales(data, isLog, isSame, colorMapRange, dotMapRange, barChartRange, colorMatrixRange, leaderThicknessRange, totalGrayRange, mapUnit, matrixUnit) {
        if (mapUnit === void 0) { mapUnit = 1; }
        if (matrixUnit === void 0) { matrixUnit = 1; }
        this.data = data;
        this.isLog = isLog;
        this.isSame = isSame;
        this.colorMapRange = colorMapRange;
        this.dotMapRange = dotMapRange;
        this.barChartRange = barChartRange;
        this.colorMatrixRange = colorMatrixRange;
        this.leaderThicknessRange = leaderThicknessRange;
        this.totalGrayRange = totalGrayRange;
        this.mapUnit = mapUnit;
        this.matrixUnit = matrixUnit;
        if (this.isLog) {
            this.colorMapScale = d3.scale.log().base(Math.E);
            this.dotMapScale = d3.scale.log().base(Math.E);
            this.barChartScale = d3.scale.log().base(Math.E);
            this.colorMatrixScale = d3.scale.log().base(Math.E);
            this.leaderThicknessScale = d3.scale.log().base(Math.E);
            this.totalGrayScale = d3.scale.log().base(Math.E);
        }
        else {
            this.colorMapScale = d3.scale.linear();
            this.dotMapScale = d3.scale.linear();
            this.barChartScale = d3.scale.linear();
            this.colorMatrixScale = d3.scale.linear();
            this.leaderThicknessScale = d3.scale.linear();
            this.totalGrayScale = d3.scale.linear();
        }
        var sMapValue, lMapValue, sMatrixValue, lMatrixValue;
        if (this.isSame) {
            sMapValue = this.data.minFlow;
            lMapValue = this.data.maxAll;
            sMatrixValue = this.data.minFlow;
            lMatrixValue = this.data.maxAll;
        }
        else {
            sMapValue = Math.min(this.data.minOrigin, this.data.minDes);
            lMapValue = Math.max(this.data.maxOrigin, this.data.maxDes);
            sMatrixValue = this.data.minFlow;
            lMatrixValue = this.data.maxFlow;
        }
        sMapValue = Math.floor(sMapValue / this.mapUnit) * this.mapUnit;
        lMapValue = Math.ceil(lMapValue / this.mapUnit) * this.mapUnit;
        sMatrixValue = Math.floor(sMatrixValue / this.matrixUnit) * this.matrixUnit;
        lMatrixValue = Math.ceil(lMatrixValue / this.matrixUnit) * this.matrixUnit;
        // setColorRange(this.colorMapScale, this.colorMapRange, sMapValue, lMapValue);
        // this.dotMapScale.domain([sMapValue, lMapValue]).range(dotMapRange);
        // this.barChartScale.domain([sMapValue, lMapValue]).range(barChartRange);
        // this.leaderThicknessScale.domain([sMapValue, lMapValue]).range(leaderThicknessRange);
        // this.totalGrayScale.domain([sMapValue, lMapValue]).range(totalGrayRange);
        sMapValue = 0;
        lMapValue = 570000;
        sMatrixValue = 0;
        lMatrixValue = 70000;
        setColorRange(this.colorMapScale, this.colorMapRange, sMapValue, lMapValue);
        this.dotMapScale.domain([sMapValue, lMapValue]).range(dotMapRange);
        this.barChartScale.domain([sMapValue, lMapValue]).range(barChartRange);
        this.leaderThicknessScale.domain([sMapValue, lMapValue]).range(leaderThicknessRange);
        this.totalGrayScale.domain([sMapValue, lMapValue]).range(totalGrayRange);
        setColorRange(this.colorMatrixScale, this.colorMatrixRange, sMatrixValue, lMatrixValue);
    }
    return Scales;
}());
//# sourceMappingURL=Scales.js.map