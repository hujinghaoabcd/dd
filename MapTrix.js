///<reference path="./lib/d3.d.ts"/>
///<reference path="./lib/colorbrewer.d.ts"/>
///<reference path="Point.ts"/>
///<reference path="utilities.ts"/>
///<reference path="LineMap.ts"/>
///<reference path="ODData.ts"/>
///<reference path="Matrix.ts"/>
///<reference path="Scales.ts"/>
///<reference path="BoundaryMapper.ts"/>
///<reference path="LeaderOptimizer.ts"/>
///<reference path="Connector.ts"/>
var conicConformal = d3.geo.conicConformal;
var selection = d3.selection;
var MapTrix = (function () {
    function MapTrix(position, width, height, data, originMapData, originGeoData, originAbbrData, originProjector, destinationMapData, destinationGeoData, destinationAbbrData, destinationProjector, leftMatrixMargin, downMatrixMargin, arrowOffsetX, arrowOffsetY, textMargin) {
        this.position = position;
        this.width = width;
        this.height = height;
        this.data = data;
        this.originMapData = originMapData;
        this.originGeoData = originGeoData;
        this.originAbbrData = originAbbrData;
        this.originProjector = originProjector;
        this.destinationMapData = destinationMapData;
        this.destinationGeoData = destinationGeoData;
        this.destinationAbbrData = destinationAbbrData;
        this.destinationProjector = destinationProjector;
        this.leftMatrixMargin = leftMatrixMargin;
        this.downMatrixMargin = downMatrixMargin;
        this.arrowOffsetX = arrowOffsetX;
        this.arrowOffsetY = arrowOffsetY;
        this.textMargin = textMargin;
        this.TEXT_MARGIN = 70;
        this.LEFT_MARGIN = 20;
        this.MATRIX_MAP_LEFT_MARGIN = 130;
        this.MATRIX_MAP_DOWN_MARGIN = 80;
        this.MAP_MARGIN = 0;
        this.LENGEND_MARGIN = 100;
        this.ANGLE = 45;
        this.ARROW_OFFSET_X = 0;
        this.ARROW_OFFSET_Y = 0;
        this.LABEL_MATRIX_ROTATE = 25;
        this.MATRIX_BORDER = 0;
        this.SMALLEST_RADIUS = 3;
        this.GRAY_DOT_IN_MATRIX = [240, 80];
        this.COLOR_DOT_IN_MATRIX = colorbrewer["YlOrRd"]["5"];
        this.GRAY_IN_MAP = [200, 40];
        this.COLOR_IN_MAP = colorbrewer["YlOrRd"]["5"];
        this.IS_COLOR = true;
        this.IS_LOG = false;
        this.IS_SAME_SCALE = false;
        this.IS_DOT_MATRIX_UNIT = true;
        this.IS_CIRCLE_IN_MATRIX = false;
        this.IS_MAP_COLOR = false;
        this.IS_MAP_THEMATIC = false;
        this.IS_HALF_MATRIX = false;
        this.IS_LEGEND = false;
        this.fullOrder = null;
        // for au
        //textAdjust = 10;
        //textAdjustX = 14;
        //LegendAdjust = 30;
        //maxFontSize = 30;
        //fontInMap = 20;
        //BIGGEST_RADIUS = 20;
        //private BAR_CHART_MARGIN = 70;
        // for nz
        //textAdjust = 8;
        //textAdjustX = 10;
        //LegendAdjust = 10;
        //maxFontSize = 15;
        //fontInMap = 12;
        //BIGGEST_RADIUS = 10;
        //private BAR_CHART_MARGIN = 50;
        // for usa
        this.textAdjust = 3;
        this.textAdjustX = 0;
        this.LegendAdjust = -150;
        this.maxFontSize = 20;
        this.fontInMap = 12;
        this.BIGGEST_RADIUS = 10;
        this.BAR_CHART_MARGIN = 50;
        // for de
        //textAdjust = -12;
        //textAdjustX = -18;
        //LegendAdjust = 10;
        //maxFontSize = 15;
        //fontInMap = 12;
        //BIGGEST_RADIUS = 10;
        //private BAR_CHART_MARGIN = 50;
        // for uk
        //textAdjust = 10;
        //textAdjustX = 30;
        //LegendAdjust = -150;
        this.scalerUnit = 1;
        this.MIN_BAR_HEIGHT = 0;
        this.MIN_LEADER_THICKNESS = 1;
        this.MAX_LEADER_THICKNESS = 4;
        this.isGray = false;
        this.dotUnitColor = 100;
        this.lineFunction = d3.svg.line()
            .x(function (d) { return d["x"]; })
            .y(function (d) { return d["y"]; })
            .interpolate("linear");
        this.leaders = [];
        this.barCharts = [];
        this.dotsOnMap = [];
        this.labelsOnMap = [];
        //labelsOnMatrix = [];
        this.FAKE_BAR_CHART_COLOR = "#C8C8C8";
        this.initial = true;
        if (leftMatrixMargin) {
            this.MATRIX_MAP_LEFT_MARGIN = leftMatrixMargin;
        }
        if (downMatrixMargin) {
            this.MATRIX_MAP_DOWN_MARGIN = downMatrixMargin;
        }
        if (arrowOffsetX) {
            this.ARROW_OFFSET_X = arrowOffsetX;
        }
        if (arrowOffsetY) {
            this.ARROW_OFFSET_Y = arrowOffsetY;
        }
        if (textMargin) {
            this.TEXT_MARGIN = textMargin;
        }
        if (!this.IS_LEGEND) {
            this.LENGEND_MARGIN = 0;
        }
        var mapTrix = this;
        mapTrix.width = mapTrix.width * 20 / 24;
        mapTrix.height = mapTrix.height - this.LENGEND_MARGIN;
        var tempHeight = (mapTrix.width - mapTrix.LEFT_MARGIN - mapTrix.MATRIX_MAP_LEFT_MARGIN) / 1.82;
        mapTrix.height = Math.min(mapTrix.height, tempHeight);
        var halfHeight = (mapTrix.height - this.MAP_MARGIN) / 2;
        var halfWidth = (mapTrix.width - mapTrix.LEFT_MARGIN) / 2;
        mapTrix.position.y += mapTrix.MAP_MARGIN / 2;
        // Load GeoInfo, latitude and longitude
        var oGeo = new GeoInfoHelper(originGeoData);
        var oPosition = new Geometry.Point(mapTrix.position.x + mapTrix.LEFT_MARGIN, mapTrix.position.y);
        this.originMap = new LineMap(originMapData, oGeo, oPosition, halfWidth, halfHeight, mapTrix.originProjector, true);
        var dGeo = new GeoInfoHelper(destinationGeoData);
        var dPosition = new Geometry.Point(mapTrix.originMap.position.x, mapTrix.originMap.position.y + halfHeight + mapTrix.MAP_MARGIN);
        this.destinationMap = new LineMap(destinationMapData, dGeo, dPosition, halfWidth, halfHeight, mapTrix.destinationProjector, false);
        this.scales = new Scales(this.data, this.IS_LOG, this.IS_SAME_SCALE, this.COLOR_IN_MAP, [this.SMALLEST_RADIUS, this.BIGGEST_RADIUS], [this.MIN_BAR_HEIGHT, this.BAR_CHART_MARGIN], this.COLOR_DOT_IN_MATRIX, [this.MIN_LEADER_THICKNESS, this.MAX_LEADER_THICKNESS], [180, 0]);
    }
    MapTrix.prototype.drawCircle = function (point, r, color, svgContainer) {
        return svgContainer.append("circle")
            .attr("cx", point.x)
            .attr("cy", point.y)
            .attr("r", r)
            .style("fill", color);
    };
    MapTrix.prototype.mapGroups2Matrix = function (map, matrix, isRotated, start, totalQuantity, pre, abbrMap, direction, groupsOfNames, barDirection, leaderExtends) {
        var sortedNames = [];
        var step = matrix.squareUnit;
        if (!isRotated) {
            step = matrix.unit;
        }
        var thisLeaders = [];
        for (var i = 0; i < groupsOfNames.length; i++) {
            var names = groupsOfNames[i];
            var connector = new Connector(map, names, new Geometry.Point(start.x, start.y), step, direction, this.ANGLE);
            start.y += (step * names.length);
            start.y += matrix.groupBorder / Math.sqrt(2) * 2;
            connector.calculateLeaderLine();
            connector.optimizeSites();
            connector.sortSites();
            sortedNames.push(connector.sortedNames);
            var thisResult = this.processConnector(connector, totalQuantity, pre, abbrMap, barDirection);
            this.dotsOnMap = this.dotsOnMap.concat(thisResult["circles"]);
            this.labelsOnMap = this.labelsOnMap.concat(thisResult["texts"]);
            thisLeaders = thisLeaders.concat(thisResult["leaders"]);
            this.barCharts = this.barCharts.concat(thisResult["barCharts"]);
        }
        for (var i = 0; i < thisLeaders.length; i++) {
            var thisLeader = thisLeaders[i];
            thisLeader["points"].push(leaderExtends[i]);
        }
        this.leaders = this.leaders.concat(thisLeaders);
        return sortedNames;
    };
    MapTrix.prototype.processConnector = function (connector, totalQuantity, pre, abbrMap, barDirection // 1 for right, -1 for left.
        ) {
        var result = {
            "circles": [],
            "texts": [],
            "leaders": [],
            "barCharts": []
        };
        var fakeBarY = this.matrix.squareWidth * barDirection;
        var leaderResult = connector.leaderResult;
        var sites = connector.sites;
        for (var i = 0; i < sites.length; i++) {
            var site = sites[i];
            var name = connector.site2Name.get(site);
            var siteInfo = leaderResult.site2Leader.get(site);
            var leader = siteInfo.leader;
            var endPoint = siteInfo.label;
            var abbr = abbrMap[name];
            var totalV = totalQuantity[name];
            var geoName = pre + "-" + abbr;
            var className = pre + " " + geoName;
            var barH = this.scales.barChartScale(totalV) * barDirection;
            var r = this.scales.dotMapScale(totalV);
            // var c = this.scales.colorMapScale(totalV);
            var thickness = this.scales.leaderThicknessScale(totalV);
            var totalGray = this.scales.totalGrayScale(totalV);
            result["circles"].push({
                "class": className,
                "name": geoName,
                "position": site,
                "r": r,
                "c": totalGray
            });
            result["texts"].push({
                "x": site.x - r,
                "y": site.y + 2,
                "text": abbr,
                "name": geoName,
                "class": className,
                "font-size": this.fontInMap + "px"
            });
            result["leaders"].push({
                "class": className,
                "name": geoName,
                "thickness": thickness,
                "points": [leader.start, leader.bend, leader.end],
                "c": totalGray
            });
            result["barCharts"].push({
                "x1": endPoint.x,
                "y1": endPoint.y,
                "x2": endPoint.x + barH,
                "y2": endPoint.y,
                "class": className + " bar",
                "name": geoName
            });
        }
        return result;
    };
    MapTrix.prototype.getColorString = function (input) {
        return this.get_color_string(input, this.IS_COLOR);
    };
    MapTrix.prototype.getMapColorString = function (input) {
        return this.get_color_string(input, this.IS_MAP_COLOR);
    };
    MapTrix.prototype.get_color_string = function (input, is_color) {
        if (is_color) {
            return input;
        }
        else {
            return d3.rgb(input, input, input).toString();
        }
    };
    MapTrix.prototype.drawBarChartLegend = function (svgContainer, x, y, rightV, leftV, leftC, rightC, leftT, rightT, fontS) {
        svgContainer.append("line")
            .attr({
            "x1": x,
            "y1": y,
            "x2": x + rightV,
            "y2": y
        })
            .style("stroke", leftC)
            .style("stroke-width", Math.floor(this.LENGEND_MARGIN / 4));
        svgContainer.append("line")
            .attr({
            "x1": x,
            "y1": y,
            "x2": x - leftV,
            "y2": y
        })
            .style("stroke", rightC)
            .style("stroke-width", Math.floor(this.LENGEND_MARGIN / 4));
        svgContainer.append("text")
            .attr("font-family", "sans-serif")
            .attr("transform", "translate(" +
            (x - this.BAR_CHART_MARGIN - 2) + "," +
            (y + fontS / 2) + ")")
            .attr("font-size", fontS + "px")
            .attr("fill", "black")
            .attr("text-anchor", "end")
            .text(leftT);
        svgContainer.append("text")
            .attr("font-family", "sans-serif")
            .attr("transform", "translate(" +
            (x + this.BAR_CHART_MARGIN + 2) + "," +
            (y + fontS / 2) + ")")
            .attr("font-size", fontS + "px")
            .attr("fill", "black")
            .attr("text-anchor", "start")
            .text(rightT);
    };
    MapTrix.prototype.drawComparisonLines = function (svgContainer) {
        var num = 2;
        var step = this.BAR_CHART_MARGIN / num;
        var halfHeight = this.matrix.height * Math.sqrt(2) / 2;
        for (var i = -num; i <= num; i++) {
            var needDraw = false;
            var firstPart, secondPart;
            if (i < 0) {
                firstPart = "comparison-line line-transparent";
                secondPart = "comparison-line";
                needDraw = true;
            }
            else if (i > 0) {
                firstPart = "comparison-line";
                secondPart = "comparison-line line-transparent";
                needDraw = true;
            }
            else {
            }
            if (needDraw) {
                svgContainer.append("line")
                    .attr("x1", this.barChartX + step * i)
                    .attr("y1", this.barChartY)
                    .attr("x2", this.barChartX + step * i)
                    .attr("y2", this.barChartY + halfHeight)
                    .attr("class", firstPart);
                svgContainer.append("line")
                    .attr("x1", this.barChartX + step * i)
                    .attr("y1", this.barChartY + halfHeight)
                    .attr("x2", this.barChartX + step * i)
                    .attr("y2", this.barChartY + halfHeight * 2)
                    .attr("class", secondPart);
            }
        }
    };
    MapTrix.prototype.writeText = function (content, x, y, rotate, className, svgContainer, otherAttr) {
        svgContainer.append("text")
            .attr("transform", "translate(" +
            (x) + "," +
            (y) + ")rotate(" + rotate + ")")
            .attr("class", className)
            .attr(otherAttr)
            .text(content);
    };
    MapTrix.prototype.removeConnections = function (svgContainer) {
        svgContainer.selectAll(".map").remove();
        svgContainer.selectAll(".always").remove();
        svgContainer.selectAll(".matrix").remove();
        this.dotsOnMap = [];
        this.labelsOnMap = [];
        this.leaders = [];
        this.barCharts = [];
    };
    MapTrix.prototype.drawAggregation = function (svgContainer, originInputs, destinationInputs) {
        if (originInputs.length == 1 && destinationInputs.length == 1) {
            return;
        }
        var amounts = [];
        var small = Number.POSITIVE_INFINITY;
        var large = Number.NEGATIVE_INFINITY;
        for (var i = 0; i < originInputs.length; i++) {
            var origins = originInputs[i];
            var thisOrigins = [];
            for (var j = 0; j < destinationInputs.length; j++) {
                var destinations = destinationInputs[j];
                var aggregation = this.data.queryRegion2region(origins, destinations);
                if (aggregation < small) {
                    small = aggregation;
                }
                if (aggregation > large) {
                    large = aggregation;
                }
                thisOrigins.push(aggregation);
            }
            amounts.push(thisOrigins);
        }
        var thisScale = d3.scale.linear();
        setColorRange(thisScale, colorbrewer["Blues"]["5"], small, large);
        var smallMargin = this.matrix.squareUnit;
        var largeMargin = smallMargin + this.matrix.squareBorder * 2;
        var originIndex = 0;
        for (var i = 0; i < originInputs.length; i++) {
            if (i != 0) {
                originIndex += originInputs[i - 1].length;
            }
            var deIndex = 0;
            for (var j = 0; j < destinationInputs.length; j++) {
                if (j != 0) {
                    deIndex += destinationInputs[j - 1].length;
                }
                var thisAggregation = amounts[i][j];
                var c = thisScale(thisAggregation);
                var topCell = this.matrix.getCell(originIndex, deIndex);
                var bottomCell = this.matrix.getCell(originIndex + originInputs[i].length - 1, deIndex + destinationInputs[j].length - 1);
                var leftCell = this.matrix.getCell(originIndex + originInputs[i].length - 1, deIndex);
                var rightCell = this.matrix.getCell(originIndex, deIndex + destinationInputs[j].length - 1);
                svgContainer.append("path")
                    .attr("class", "matrix")
                    .attr("d", this.lineFunction([
                    {
                        x: topCell.center.x,
                        y: topCell.center.y - smallMargin
                    },
                    {
                        x: leftCell.center.x - smallMargin,
                        y: leftCell.center.y
                    },
                    {
                        x: bottomCell.center.x,
                        y: bottomCell.center.y + smallMargin
                    },
                    {
                        x: rightCell.center.x + smallMargin,
                        y: rightCell.center.y
                    }
                ]))
                    .style("fill", "white")
                    .style("stroke", "black");
                svgContainer.append("path")
                    .attr("class", "matrix")
                    .attr("d", this.lineFunction([
                    {
                        x: topCell.center.x,
                        y: topCell.center.y - largeMargin
                    },
                    {
                        x: leftCell.center.x - largeMargin,
                        y: leftCell.center.y
                    },
                    {
                        x: bottomCell.center.x,
                        y: bottomCell.center.y + largeMargin
                    },
                    {
                        x: rightCell.center.x + largeMargin,
                        y: rightCell.center.y
                    }
                ]))
                    .style("fill", c)
                    .style("stroke", "black");
            }
        }
    };
    MapTrix.prototype.highlightMaps = function (svgContainer, names) {
        var mapTrix = this;
        changeClasses(svgContainer, ".map", ["un-highlight"], ["highlight"]);
        names.forEach(function (ele, index, arrat) {
            var thisAbbr = mapTrix.originAbbrData[ele];
            changeClasses(svgContainer, ".map.out-" + thisAbbr, ["highlight"], ["un-highlight"]);
            changeClasses(svgContainer, ".map.in-" + thisAbbr, ["highlight"], ["un-highlight"]);
        });
    };
    ;
    MapTrix.prototype.draw = function (svgContainer, originInputs, destinationInputs, onMatrixHover, onMatrixOut, onMatrixClick, onMapHover, onMapOut, onMapClick) {
        var thisMapTrix = this;
        thisMapTrix.currentNames = d3.merge(originInputs);
        //for(var i = 0; i < originInputs.length; i++){
        //    thisMapTrix.currentNames = thisMapTrix.currentNames.concat(originInputs[i]);
        //}
        this.writeText("Outflow", this.position.x + 20, this.originMap.position.y + this.originMap.mapHeight / 2, -90, "main-text text-title always", svgContainer);
        this.writeText("Inflow", this.position.x + 20, this.destinationMap.position.y + this.destinationMap.mapHeight / 2, -90, "main-text text-title always", svgContainer);
        this.originMap.draw(svgContainer, onMapHover, onMapOut, onMapClick, null, this.originAbbrData);
        this.destinationMap.draw(svgContainer, onMapHover, onMapOut, onMapClick, null, this.destinationAbbrData);
        this.highlightMaps(svgContainer, this.currentNames);
        var getAvgRanking = function (inputNames) {
            var sum = 0;
            for (var i = 0; i < inputNames.length; i++) {
                sum += thisMapTrix.fullOrder.indexOf(inputNames[i]);
            }
            return sum / inputNames.length;
        };
        if (thisMapTrix.fullOrder != null) {
            originInputs.sort(function (a, b) {
                return getAvgRanking(a) - getAvgRanking(b);
            });
            destinationInputs.sort(function (a, b) {
                return getAvgRanking(a) - getAvgRanking(b);
            });
        }
        //svgContainer.append("rect")
        //    .attr({
        //        "x": thisMapTrix.originMap.position.x,
        //        "y": thisMapTrix.originMap.position.y,
        //        "width": thisMapTrix.originMap.mapWidth,
        //        "height": thisMapTrix.originMap.mapHeight,
        //        "fill": "none",
        //        "stroke": "black"
        //    });
        //
        //svgContainer.append("rect")
        //    .attr({
        //        "x": thisMapTrix.destinationMap.position.x,
        //        "y": thisMapTrix.destinationMap.position.y,
        //        "width": thisMapTrix.destinationMap.mapWidth,
        //        "height": thisMapTrix.destinationMap.mapHeight,
        //        "fill": "none",
        //        "stroke": "black"
        //    });
        var matrixPosition = new Geometry.Point(this.originMap.position.x + this.originMap.mapWidth + this.MATRIX_MAP_LEFT_MARGIN - 20, this.originMap.position.y);
        this.matrix = new Geometry.Matrix(matrixPosition, this.width, this.height - this.MAP_MARGIN, originInputs, destinationInputs);
        // this.matrix.draw(svgContainer);
        var originExtend = [];
        var destinationExtend = [];
        var shouldOffset = 0;
        if (originInputs.length > 1) {
            shouldOffset = 1;
        }
        var tempOffset = (this.matrix.unit / 2 + this.matrix.groupBorder * shouldOffset) / Math.sqrt(2);
        for (var i = 0; i < this.matrix.rowNum; i++) {
            var originCell = this.matrix.getCell(i, 0);
            var destinationCell = this.matrix.getCell(this.matrix.rowNum - 1, i);
            originExtend.push({
                "x": originCell.center.x - tempOffset,
                "y": originCell.center.y - tempOffset
            });
            destinationExtend.push({
                "x": destinationCell.center.x - tempOffset,
                "y": destinationCell.center.y + tempOffset
            });
        }
        var originSorted = this.mapGroups2Matrix(this.originMap, this.matrix, true, new Geometry.Point(this.matrix.leftTop[0] - this.matrix.squareHeight - this.BAR_CHART_MARGIN, this.matrix.leftTop[1] + tempOffset), this.data.originQuantity, "out", this.originAbbrData, Direction.Right, originInputs, 1, originExtend);
        if (this.fullOrder == null) {
            this.fullOrder = originSorted[0].slice();
        }
        var destinationSorted = this.mapGroups2Matrix(this.destinationMap, this.matrix, true, new Geometry.Point(this.matrix.leftBottom[0] - this.BAR_CHART_MARGIN, this.matrix.leftBottom[1] + tempOffset), this.data.destinationQuantity, "in", this.destinationAbbrData, Direction.Right, destinationInputs, -1, destinationExtend);
        var updateVis = function (classes, data, matchFunc, removeDelay, removeDuration, eleType, eleInitial, updateFunc) {
            var selectionString = multiClassString(classes);
            var classString = "";
            classes.forEach(function (ele, index, array) {
                classString += ele;
                classString += " ";
            });
            classString = classString.slice(0, -1);
            var elements = svgContainer.selectAll(selectionString)
                .data(data, matchFunc);
            elements
                .exit()
                .transition()
                .delay(removeDelay)
                .duration(removeDuration)
                .remove();
            elements.enter()
                .append(eleType)
                .attr("class", classString)
                .attr(eleInitial);
            elements = svgContainer.selectAll(selectionString)
                .data(data, matchFunc);
            elements.moveToFront();
            return updateFunc(elements);
        };
        var returnRaw = function (d) {
            return d;
        };
        var returnName = function (d) {
            return d["name"];
        };
        var tempBorder = 0;
        if (originInputs.length > 1) {
            tempBorder = thisMapTrix.matrix.squareBorder;
        }
        var updateOutMatrixText = function (selection) {
            return selection.transition().delay(200)
                .attr("transform", function (d, i) {
                var thisCell = thisMapTrix.matrix.getCell(i, thisMapTrix.matrix.columnNum - 1);
                var fontSize = Math.min(thisMapTrix.matrix.unit, thisMapTrix.maxFontSize);
                return "translate(" +
                    (thisCell.center.x + thisMapTrix.matrix.squareUnit / 2 + tempBorder + thisMapTrix.MATRIX_BORDER) + "," +
                    (thisCell.center.y + thisMapTrix.matrix.squareUnit / 2 + tempBorder + fontSize / 2 +
                        thisMapTrix.MATRIX_BORDER * Math.tan(thisMapTrix.LABEL_MATRIX_ROTATE / 180 * Math.PI)) +
                    ")rotate(" + thisMapTrix.LABEL_MATRIX_ROTATE + ")";
            })
                .attr("class", function (d) {
                var abbr = thisMapTrix.originAbbrData[d];
                return "out-" + abbr + " out text-matrix main-text";
            })
                .attr("font-size", function () {
                return Math.min(thisMapTrix.matrix.unit, thisMapTrix.maxFontSize);
            })
                .attr("fill", function (d, i) {
                var totalV = thisMapTrix.data.originQuantity[d];
                var tempGray = thisMapTrix.scales.totalGrayScale(totalV);
                return d3.rgb(tempGray, tempGray, tempGray);
            }).text(function (d) {
                return thisMapTrix.originAbbrData[d];
            });
        };
        var originFull = [];
        originSorted.forEach(function (ele, index, array) {
            originFull = originFull.concat(ele);
        });
        updateVis(["out", "text-matrix"], originFull, returnRaw, 0, 100, "text", {
            "transform": "translate(" + (thisMapTrix.position.x + thisMapTrix.width) + "," +
                (thisMapTrix.position.y + thisMapTrix.height) + ")"
        }, updateOutMatrixText);
        var updateInMatrixText = function (selection) {
            return selection.transition().delay(200)
                .attr("transform", function (d, i) {
                var thisCell = thisMapTrix.matrix.getCell(0, i);
                var fontSize = Math.min(thisMapTrix.matrix.unit, thisMapTrix.maxFontSize);
                var temp = 2;
                if (thisMapTrix.matrix.unit > 15) {
                    temp = 5;
                }
                return "translate(" +
                    (thisCell.center.x + thisMapTrix.matrix.squareUnit / 2 + tempBorder + thisMapTrix.MATRIX_BORDER + temp) + "," +
                    (thisCell.center.y - thisMapTrix.matrix.squareUnit / 2 - tempBorder + fontSize / 2 - temp +
                        thisMapTrix.MATRIX_BORDER * Math.tan(thisMapTrix.LABEL_MATRIX_ROTATE / 180 * Math.PI)) +
                    ")rotate(" + -thisMapTrix.LABEL_MATRIX_ROTATE + ")";
            })
                .attr("class", function (d) {
                var abbr = thisMapTrix.originAbbrData[d];
                return "in-" + abbr + " in text-matrix main-text";
            })
                .attr("font-size", function () {
                return Math.min(thisMapTrix.matrix.unit, thisMapTrix.maxFontSize);
            })
                .attr("fill", function (d, i) {
                var totalV = thisMapTrix.data.destinationQuantity[d];
                var tempGray = thisMapTrix.scales.totalGrayScale(totalV);
                return d3.rgb(tempGray, tempGray, tempGray);
            }).attr("class", function (d) {
                return "in main-text text-matrix " + "in-" + thisMapTrix.originAbbrData[d];
            })
                .text(function (d) {
                return thisMapTrix.originAbbrData[d];
            });
        };
        var desFull = [];
        destinationSorted.forEach(function (ele, index, array) {
            desFull = desFull.concat(ele);
        });
        updateVis(["in", "text-matrix"], desFull, returnRaw, 0, 100, "text", {
            "transform": "translate(" + (thisMapTrix.position.x + thisMapTrix.width) + "," +
                (thisMapTrix.position.y) + ")"
        }, updateInMatrixText);
        var updateCirclesOnMap = function (selection) {
            selection.on('mouseover', function (d, i) {
                onMapHover(d["name"]);
            })
                .on('mouseout', function (d, i) {
                onMapOut(d["name"]);
            })
                .on('click', function (d, i) {
                onMapClick(d["name"]);
            });
            return selection.transition().delay(0).duration(0)
                .attr("cx", function (d) { return d.position.x; })
                .attr("cy", function (d) { return d.position.y; })
                .attr("r", function (d) { return d.r; })
                .attr("fill", function (d) { return d3.rgb(d["c"], d["c"], d["c"]); })
                .attr("class", function (d) { return "map-dot " + d["class"]; });
        };
        updateVis(["map-dot"], this.dotsOnMap, returnName, 0, 100, "circle", {}, updateCirclesOnMap);
        var updateLablesOnMap = function (selection) {
            selection.on('mouseover', function (d, i) {
                onMapHover(d["name"]);
            })
                .on('mouseout', function (d, i) {
                onMapOut(d["name"]);
            })
                .on('click', function (d, i) {
                onMapClick(d["name"]);
            });
            return selection.transition().delay(0).duration(0)
                .attr("transform", function (d) {
                return "translate(" + (d["x"]) + "," + ([d["y"]]) + ")";
            })
                .attr("class", function (d) {
                return "main-text text-map " + d["class"];
            })
                .attr("font-size", function (d) { return d["font-size"]; })
                .text(function (d) { return d["text"]; });
        };
        updateVis(["text-map"], this.labelsOnMap, returnName, 0, 100, "text", {}, updateLablesOnMap);
        var updateLeaderLines = function (selection) {
            return selection.transition().delay(500).duration(500)
                .attr("d", function (d) {
                return thisMapTrix.lineFunction(d["points"]);
            })
                .attr("stroke-width", function (d) {
                return d["thickness"];
            })
                .attr("stroke", function (d) { return d3.rgb(d["c"], d["c"], d["c"]); })
                .attr("class", function (d, i) {
                var className = d["class"];
                return className + " leader-line un-clicked-leader";
            });
        };
        updateVis(["leader-line"], this.leaders, returnName, 0, 200, "path", {}, updateLeaderLines);
        var updateBarChart = function (selection) {
            selection.on('mouseover', function (d, i) {
                onMapHover(d["name"]);
            })
                .on('mouseout', function (d, i) {
                onMapOut(d["name"]);
            })
                .on('click', function (d, i) {
                onMapClick(d["name"]);
            });
            return selection.attr("opacity", 1)
                .transition().delay(500).duration(500)
                .attr("x1", function (d) { return d["x1"]; })
                .attr("y1", function (d) { return d["y1"]; })
                .attr("x2", function (d) { return d["x2"]; })
                .attr("y2", function (d) { return d["y2"]; })
                .attr("class", function (d) { return d["class"]; })
                .attr("stroke", function (d) { return d["color"]; })
                .attr("stroke-width", Math.floor(thisMapTrix.matrix.squareUnit * 0.95));
        };
        //updateVis(["bar"], this.barCharts, returnName,
        //    0, 200,
        //    "line", {},
        //    updateBarChart
        //);
        //this.originMap.drawBoxes(svgContainer);
        //this.destinationMap.drawBoxes(svgContainer);
        // draw comparison lines
        // this.drawComparisonLines(svgContainer);
        var origins = [];
        var destinations = [];
        for (var i = 0; i < originSorted.length; i++) {
            origins = origins.concat(originSorted[i]);
        }
        for (var i = 0; i < destinationSorted.length; i++) {
            destinations = destinations.concat(destinationSorted[i]);
        }
        // Draw dots
        //var origins = originSorted[0];
        //var destinations = destinationSorted[0];
        function drawTriangle(p, value, isUp) {
            if (!value) {
                return;
            }
            var c, r;
            c = thisMapTrix.scales.colorMapScale(value);
            var tc;
            if (thisMapTrix.IS_DOT_MATRIX_UNIT) {
                r = thisMapTrix.matrix.maximumRadius;
            }
            else {
            }
            var tempPoints = [];
            var tempR = r * Math.sqrt(2);
            tempPoints[0] = {
                x: p.center.x - tempR,
                y: p.center.y
            };
            tempPoints[1] = {
                x: p.center.x + tempR,
                y: p.center.y
            };
            if (isUp) {
                tempPoints[2] = {
                    x: p.center.x,
                    y: p.center.y - tempR
                };
            }
            else {
                tempPoints[2] = {
                    x: p.center.x,
                    y: p.center.y + tempR
                };
            }
            tc = svgContainer.append("path")
                .attr("d", thisMapTrix.lineFunction(tempPoints));
            tc.style("fill", thisMapTrix.getColorString(c));
        }
        var topPoint = {
            x: this.matrix.centerPoint.x,
            y: this.matrix.centerPoint.y - this.matrix.width / Math.sqrt(2)
        };
        var bottomPoint = {
            x: this.matrix.centerPoint.x,
            y: this.matrix.centerPoint.y + this.matrix.width / Math.sqrt(2)
        };
        var leftPoint = {
            x: this.matrix.centerPoint.x - this.matrix.width / Math.sqrt(2),
            y: this.matrix.centerPoint.y
        };
        // draw the content in od matrix
        var odMatrix = [];
        var cellTemp = this.matrix.squareUnit / 2;
        if (this.IS_HALF_MATRIX) {
            for (var i = 0; i < origins.length; i++) {
                var origin = origins[i];
                for (var j = i; j < destinations.length; j++) {
                    var destination = destinations[j];
                    var cell = this.matrix.cells[j][i];
                    if (origin != destination) {
                        var oValue = this.data.query(origin, destination);
                        var dValue = this.data.query(destination, origin);
                        drawTriangle(cell, oValue, true);
                        drawTriangle(cell, dValue, false);
                        cell.draw(svgContainer);
                    }
                    else {
                        var classString = "matrix-border line-color-one";
                        if (this.isGray) {
                            classString = "matrix-border line-color-two";
                        }
                        this.isGray = !this.isGray;
                        svgContainer.append("line")
                            .attr({
                            x1: cell.center.x,
                            y1: cell.center.y,
                            x2: cell.center.x - cellTemp,
                            y2: cell.center.y - cellTemp,
                            "class": classString
                        });
                        svgContainer.append("line")
                            .attr({
                            x1: cell.center.x,
                            y1: cell.center.y,
                            x2: cell.center.x - cellTemp,
                            y2: cell.center.y + cellTemp,
                            "class": classString
                        });
                    }
                }
            }
        }
        else {
            for (var i = 0; i < origins.length; i++) {
                var origin = origins[i];
                for (var j = 0; j < destinations.length; j++) {
                    var destination = destinations[j];
                    var position = this.matrix.cells[i][j];
                    var tempPoints = [];
                    var tempR = this.matrix.maximumRadius * Math.sqrt(2);
                    tempPoints[0] = {
                        x: position.center.x,
                        y: position.center.y - tempR
                    };
                    tempPoints[1] = {
                        x: position.center.x + tempR,
                        y: position.center.y
                    };
                    tempPoints[2] = {
                        x: position.center.x,
                        y: position.center.y + tempR
                    };
                    tempPoints[3] = {
                        x: position.center.x - tempR,
                        y: position.center.y
                    };
                    tempPoints[4] = tempPoints[0];
                    var orAbbr = this.originAbbrData[origin];
                    var deAbbr = this.destinationAbbrData[destination];
                    var value = this.data.query(origin, destination);
                    if (value) {
                        var tc, r;
                        var c = thisMapTrix.scales.colorMatrixScale(value);
                        if (this.IS_DOT_MATRIX_UNIT) {
                            r = this.matrix.maximumRadius;
                        }
                        else {
                        }
                        if (this.IS_CIRCLE_IN_MATRIX) {
                            tc = svgContainer.append("circle")
                                .attr("cx", position.center.x)
                                .attr("cy", position.center.y)
                                .attr("r", r);
                        }
                        else {
                            odMatrix.push({
                                "points": tempPoints,
                                "color": this.getColorString(c),
                                "name": "out-" + orAbbr + " in-" + deAbbr
                            });
                        }
                    }
                    else {
                        //
                        odMatrix.push({
                            "points": tempPoints,
                            "color": "white",
                            "name": "out-" + orAbbr + " in-" + deAbbr
                        });
                    }
                }
            }
        }
        this.drawAggregation(svgContainer, originInputs, destinationInputs);
        var updateOdMatrix = function (selection) {
            selection.on('mouseover', function (d, i) {
                onMatrixHover(d["name"]);
            })
                .on('mouseout', function (d, i) {
                onMatrixOut(d["name"]);
            })
                .on('click', function (d, i) {
                onMatrixClick(d["name"]);
            });
            return selection
                .style("fill", function (d) { return d["color"]; })
                .attr("class", function (d) { return "matrix-cell " + d["name"]; })
                .transition().delay(1000).duration(1000)
                .attr("d", function (d) { return thisMapTrix.lineFunction(d["points"]); });
        };
        updateVis(["matrix-cell"], odMatrix, returnName, 0, 400, "path", {}, updateOdMatrix);
        // this.matrix.draw(svgContainer);
        // draw a line cross the matrix
        //svgContainer.append("line")
        //    .attr({
        //            x1: topPoint.x,
        //            y1: topPoint.y,
        //            x2: bottomPoint.x,
        //            y2: bottomPoint.y,
        //            "class": "matrix-line always"
        //        }
        //    );
        // draw the border of matrix to indicate alternation of colors
        //var perUnit = cellTemp * 2;
        //var tempGray = this.isGray;
        //for(var i = 1; i < this.data.origins.length + 1; i++){
        //    var cTemp = "matrix-border line-color-one";
        //    if(tempGray){
        //        cTemp = "matrix-border line-color-two";
        //    }
        //    tempGray = !tempGray;
        //    var tempAbbr = this.originAbbrData[origins[i-1]];
        //
        //
        //    svgContainer.append("line")
        //        .attr({
        //            x1: topPoint.x - perUnit * (i-1),
        //            y1: topPoint.y + perUnit * (i-1),
        //            x2: topPoint.x - perUnit * i,
        //            y2: topPoint.y + perUnit * i,
        //            "class": cTemp + " out out-" + tempAbbr
        //        }
        //    );
        //    svgContainer.append("line")
        //        .attr({
        //            x1: leftPoint.x + perUnit * (i-1),
        //            y1: leftPoint.y + perUnit * (i-1),
        //            x2: leftPoint.x + perUnit * i,
        //            y2: leftPoint.y + perUnit * i,
        //            "class": cTemp + " in in-" + tempAbbr
        //        }
        //    );
        //
        //    if(!this.IS_HALF_MATRIX) {
        //        svgContainer.append("line")
        //            .attr({
        //                x1: topPoint.x + perUnit * (i - 1),
        //                y1: topPoint.y + perUnit * (i - 1),
        //                x2: topPoint.x + perUnit * i,
        //                y2: topPoint.y + perUnit * i,
        //                "class": cTemp + " in in-" + tempAbbr
        //            }
        //        );
        //
        //        svgContainer.append("line")
        //            .attr({
        //                x1: leftPoint.x + this.matrix.height * Math.sqrt(2) - perUnit * (i - 1),
        //                y1: leftPoint.y + perUnit * (i - 1),
        //                x2: leftPoint.x + this.matrix.height * Math.sqrt(2) - perUnit * i,
        //                y2: leftPoint.y + perUnit * i,
        //                "class": cTemp + " out out-" + tempAbbr
        //            }
        //        );
        //    }
        //}
        // draw the border of matrix to indicate alternation of colors
        //if(this.IS_HALF_MATRIX){
        //    var tempGray = this.isGray;
        //    for(var i = 1; i < this.data.origins.length + 1; i++) {
        //        var cTemp = "matrix-border";
        //        if(tempGray){
        //            cTemp = "matrix-border-gray";
        //        }
        //        tempGray = !tempGray;
        //        var tempUnit = perUnit * 2;
        //
        //        svgContainer.append("line")
        //            .attr({
        //                x1: topPoint.x,
        //                y1: topPoint.y + tempUnit * (i-1),
        //                x2: topPoint.x,
        //                y2: topPoint.y + tempUnit * i,
        //                "class": cTemp
        //            }
        //        );
        //    }
        //}
    };
    return MapTrix;
}());
//# sourceMappingURL=MapTrix.js.map