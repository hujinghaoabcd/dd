///<reference path="./lib/d3.d.ts"/>
///<reference path="./lib/colorbrewer.d.ts"/>
///<reference path="Scales.ts"/>
///<reference path="ODData.ts"/>
///<reference path="GeoInfoHelper.ts"/>
///<reference path="Point.ts"/>
///<reference path="MapProjector.ts"/>
///<reference path="LineMap.ts"/>
///<reference path="MapTrix.ts"/>
///<reference path="commonData.ts"/>
///<reference path="utilities.ts"/>
var mapTrix;
var svgContainer;
var odData;
var preferWidth;
var preferHeight;
var ORIGIN_BASE = "us";
var DESTINATION_BASE = "us";
var is_control_key_down = false;
var groupIndex = -1;
var groupColors = colorbrewer.Accent[5];
var groupSelected = false;
window.onload = function () {
    //preferWidth = window.innerWidth - 370; // for au
    //preferWidth = window.innerWidth - 570; // for nz
    //preferWidth = window.innerWidth - 300; // for usa
    //preferWidth = window.innerWidth - 590; // for usa
    preferWidth = window.innerWidth;
    preferHeight = window.innerHeight - 100;
    //preferWidth *= 2;
    //preferHeight *= 2;
    svgContainer = d3.select('#vis')
        .attr('width', preferWidth)
        .attr('height', preferHeight);
    var dataFileString = DATA_URL + ORIGIN_BASE + "2" + DESTINATION_BASE + ".csv";
    loadData(dataFileString);
    //var i = 8;
    //var name = "matrix_" + i + "_" + ORIGIN_BASE +"_easy";
    //var name = "matrix_" + i + "_" + ORIGIN_BASE +"_medium";
    //var name = "matrix_" + i + "_" + ORIGIN_BASE +"_hard";
    //document.title = name;
    //loadData(DATA_URL + ORIGIN_BASE + "/" + name + ".csv");
};
function loadData(filename) {
    queue()
        .defer(d3.csv, filename)
        .await(function (error, data) {
        var odData = new ODData(data);
        onDataLoad(odData);
    });
}
function onDataLoad(d) {
    odData = d;
    var originMap = GEO_DATA_URL + ORIGIN_BASE + "Map.json";
    var originGeo = GEO_DATA_URL + ORIGIN_BASE + "Geo.json";
    var originAbbr = GEO_DATA_URL + ORIGIN_BASE + "Abbr.json";
    var desMap = GEO_DATA_URL + DESTINATION_BASE + "Map.json";
    var desGeo = GEO_DATA_URL + DESTINATION_BASE + "Geo.json";
    var desAbbr = GEO_DATA_URL + ORIGIN_BASE + "Abbr.json";
    var abbr2Full = {};
    var originProjector = projectocDict[ORIGIN_BASE];
    var desProjector = projectocDict[DESTINATION_BASE];
    var hovered = [];
    var clicked = [];
    var groups = [];
    var flowScale = d3.scale.linear()
        .domain([odData.minFlow, odData.maxFlow])
        .range([0.5, 5]);
    var changeThisClasses = function (selectorString, trueClasses, falseClasses) {
        changeClasses(svgContainer, selectorString, trueClasses, falseClasses);
    };
    var highlightHovered = function () {
        if (hovered.length == 0) {
            return;
        }
        hovered.forEach(function (ele, index, array) {
            changeThisClasses("." + ele, ["highlight"], ["un-highlight"]);
        });
    };
    var highlightClicked = function (existed) {
        if (existed != null && existed.length != 0) {
            existed.forEach(function (ele, index, array) {
                changeThisClasses("." + ele, ["highlight"], ["un-highlight"]);
                changeThisClasses(multiClassString([ele, "leader-line"]), ["un-clicked-leader"], ["clicked-leader"]);
                changeThisClasses(multiClassString([ele, "map"]), ["un-clicked-map"], ["clicked-map"]);
                svgContainer.selectAll(multiClassString([ele, "main-text"]))
                    .style("fill", "black");
            });
        }
        if (clicked.length == 0) {
            return;
        }
        clicked.forEach(function (ele, index, array) {
            changeThisClasses("." + ele, ["highlight"], ["un-highlight"]);
            changeThisClasses(multiClassString([ele, "leader-line"]), ["clicked-leader"], ["un-clicked-leader"]);
            changeThisClasses(multiClassString([ele, "map"]), ["clicked-map"], ["un-clicked-map"]);
            svgContainer.selectAll(multiClassString([ele, "main-text"]))
                .style("fill", "red");
        });
        changeThisClasses("." + "always", ["highlight"], ["un-highlight"]);
    };
    var hideFilteredMaps = function () {
        var allNames = odData.origins;
        allNames.forEach(function (ele, index, array) {
            if (mapTrix.currentNames.indexOf(ele) == -1) {
                changeThisClasses(multiClassString(["out-" + mapTrix.originAbbrData[ele], "map"]), ["un-highlight"], ["highlight"]);
                changeThisClasses(multiClassString(["in-" + mapTrix.destinationAbbrData[ele], "map"]), ["un-highlight"], ["highlight"]);
            }
        });
        changeThisClasses("." + "always", ["highlight"], ["un-highlight"]);
    };
    var clickNames = function (names) {
        var existed = addToArrayRemoveIfExist(names, clicked);
        changeThisClasses("*", ["un-highlight"], ["highlight"]);
        changeThisClasses(".text-map", ["highlight"], ["un-highlight"]);
        highlightClicked(existed);
        highlightGroups();
        changeThisClasses("." + "always", ["highlight"], ["un-highlight"]);
    };
    var hoverNames = function (names) {
        addToArray(names, hovered);
        changeThisClasses("*", ["un-highlight"], ["highlight"]);
        changeThisClasses(".text-map", ["highlight"], ["un-highlight"]);
        highlightHovered();
        highlightClicked(null);
        highlightGroups();
        changeThisClasses("." + "always", ["highlight"], ["un-highlight"]);
    };
    var outNames = function (names) {
        removeFromArray(names, hovered);
        // highlight all if no clicked
        if (clicked.length + groups.length == 0) {
            changeThisClasses("*", ["highlight"], ["un-highlight"]);
            hideFilteredMaps();
        }
        else {
            // must make un-hovered un-highlight; otherwise, when the mouse goes out of the matrix
            // the last hovered elements will still remain highlight when the un
            names.forEach(function (ele, index, array) {
                changeThisClasses("." + ele, ["un-highlight"], ["highlight"]);
            });
            highlightClicked(null);
            highlightGroups();
        }
        changeThisClasses("." + "always", ["highlight"], ["un-highlight"]);
    };
    var onMatrixClick = function (name) {
        var names = name.split(" ");
        clickNames(names);
        changeThisClasses("." + "always", ["highlight"], ["un-highlight"]);
    };
    var onMatrixHover = function (name) {
        var names = name.split(" ");
        hoverNames(names);
        changeThisClasses("." + "always", ["highlight"], ["un-highlight"]);
    };
    var onMatrixOut = function (name) {
        var names = name.split(" ");
        outNames(names);
        changeThisClasses("." + "always", ["highlight"], ["un-highlight"]);
    };
    var onMapHover = function (name) {
        var allInfo = name.split("-");
        var direction = allInfo[0];
        var locationAbbr = allInfo[1];
        var locationFull = abbr2Full[locationAbbr];
        if (mapTrix.currentNames.indexOf(locationFull) == -1) {
            return;
        }
        var names = mapTrix.currentNames;
        var resumeGroup = "out";
        var baseQuery = odData.originQuantity;
        var abbrMap = mapTrix.originAbbrData;
        if (direction == "out") {
            resumeGroup = "in";
            baseQuery = odData.destinationQuantity;
            abbrMap = mapTrix.destinationAbbrData;
        }
        hoverNames([name]);
        changeThisClasses("." + resumeGroup, ["highlight"], ["un-highlight"]);
        hideFilteredMaps();
        changeThisClasses("defs", ["highlight"], ["un-highlight"]);
        changeThisClasses("#arrow-head-one", ["highlight"], ["un-highlight"]);
        changeThisClasses("#arrow-path", ["highlight"], ["un-highlight"]);
        changeThisClasses(multiClassString([resumeGroup, "leader-line"]), ["un-highlight"], ["highlight"]);
        changeThisClasses(multiClassString([resumeGroup, "text-matrix"]), ["highlight"], ["un-highlight"]);
        changeThisClasses(multiClassString([resumeGroup, "bar"]), ["un-highlight"], ["highlight"]);
        changeThisClasses("." + "always", ["highlight"], ["un-highlight"]);
        var thisCircle = svgContainer.select(multiClassString([
            "map-dot",
            resumeGroup + "-" + locationAbbr
        ]));
        var thisCenterX = parseFloat(thisCircle.attr("cx"));
        var thisCenterY = parseFloat(thisCircle.attr("cy"));
        var thisR = parseFloat(thisCircle.attr("r"));
        for (var i = 0; i < names.length; i++) {
            var nameS = names[i];
            var nameAbbr = abbrMap[nameS];
            var origin = nameS;
            var destination = locationFull;
            var originAbbrS = nameAbbr;
            var destinationAbbrS = locationAbbr;
            if (direction == "out") {
                origin = locationFull;
                destination = nameS;
                originAbbrS = locationAbbr;
                destinationAbbrS = nameAbbr;
            }
            var odQuantity = odData.query(origin, destination);
            var baseQuantity = baseQuery[nameS];
            var rate = odQuantity / baseQuantity;
            if (baseQuantity == 0) {
                rate = 0;
            }
            var circle = svgContainer.select(multiClassString([
                "map-dot",
                resumeGroup + "-" + nameAbbr
            ]));
            var cx = parseFloat(circle.attr("cx"));
            var cy = parseFloat(circle.attr("cy"));
            var r = parseFloat(circle.attr("r"));
            var arc = d3.svg.arc()
                .innerRadius(0)
                .outerRadius(r)
                .startAngle(0)
                .endAngle(Math.PI * 2 * rate);
            svgContainer.append("path")
                .attr("class", "pie " + resumeGroup)
                .attr("transform", "translate(" + cx + "," + cy + ")")
                .attr("d", arc);
            // draw dynamic percentage
            //var classString = multiClassString([
            //    "bar",
            //    resumeGroup + "-" + nameAbbr
            //]);
            //var thisBar = svgContainer.select(classString);
            //var thisAttr = thisBar.datum();
            //var thickness = thisBar.attr("stroke-width");
            //svgContainer.append("line")
            //    .attr(thisAttr)
            //    .attr("x2", thisAttr["x1"])
            //    .attr("stroke-width", thickness)
            //    .attr("class", resumeGroup + " bar-dynamic")
            //    .transition()
            //    .attr("x2", function(d){
            //        var tempHeight = thisAttr["x2"] - thisAttr["x1"];
            //        return thisAttr["x1"] + tempHeight * rate;
            //    });
            //
            //// draw bar charts opacity
            //classString = multiClassString([
            //    "bar",
            //    resumeGroup + "-" + nameAbbr
            //]);
            //svgContainer.select(classString)
            //    .transition()
            //    .attr("opacity", 0.3);
            var cellString = multiClassString([
                "matrix-cell",
                "out-" + originAbbrS,
                "in-" + destinationAbbrS
            ]);
            var thisColor = svgContainer.select(cellString).style("fill");
            var mapPartString = multiClassString([
                "map", resumeGroup + "-" + nameAbbr
            ]);
            svgContainer.select(mapPartString)
                .style("fill", thisColor);
            if (odQuantity != 0) {
                var inputs = [];
                if (direction == "out") {
                    inputs = [
                        thisCenterX, thisCenterY, cx, cy, thisR, r
                    ];
                }
                else {
                    inputs = [
                        cx, cy, thisCenterX, thisCenterY, r, thisR
                    ];
                }
                var thickness = flowScale(odQuantity);
                var flowLine = shortenLine(inputs[0], inputs[1], inputs[2], inputs[3], inputs[4], inputs[5]);
                svgContainer.append("line")
                    .attr({
                    "x1": flowLine[0],
                    "y1": flowLine[1],
                    "x2": flowLine[2],
                    "y2": flowLine[3],
                    "class": "flow-line",
                    "marker-end": "url(#arrow-head-one)"
                })
                    .style({
                    "stroke-width": thickness
                });
            }
        }
    };
    var onMapOut = function (name) {
        svgContainer.selectAll(".pie")
            .remove();
        svgContainer.selectAll(".flow-line")
            .remove();
        var allInfo = name.split("-");
        var direction = allInfo[0];
        var resume = "in";
        if (direction == "in") {
            resume = "out";
        }
        //var classString = multiClassString([resume, "bar-dynamic"]);
        //svgContainer.selectAll(classString)
        //    .transition()
        //    .remove();
        svgContainer.selectAll(multiClassString([resume, "map"]))
            .style("fill", "#f5f5f5");
        //hoverNames([name]);
        //outNames([name]);
        if (clicked.length + groups.length != 0) {
            changeThisClasses(multiClassString([resume, "map"]), ["un-highlight"], ["highlight"]);
            changeThisClasses(multiClassString([resume, "map-dot"]), ["un-highlight"], ["highlight"]);
            changeThisClasses(multiClassString([resume, "text-matrix"]), ["un-highlight"], ["highlight"]);
        }
        outNames([name]);
        changeThisClasses("." + "always", ["highlight"], ["un-highlight"]);
    };
    var group2Color = {};
    var processGroup = function (fullName) {
        // if already selected
        for (var i = 0; i < groups.length; i++) {
            var thisGroup = groups[i];
            var p = thisGroup.indexOf(fullName);
            if (p != -1) {
                thisGroup.splice(p, 1);
                if (thisGroup.length == 0) {
                    groups.splice(i, 1);
                }
                return false;
            }
        }
        // if new, add to groups
        var thisGroup;
        if (groups.length <= groupIndex) {
            thisGroup = [];
            groups.push(thisGroup);
        }
        else {
            thisGroup = groups[groupIndex];
        }
        group2Color[fullName] = groupColors[groupIndex];
        thisGroup.push(fullName);
        console.log(groups);
        return true;
    };
    var colorOne = function (name, color, isHighlight) {
        var mapWidth = "2px";
        var leaderWidth = "2px";
        if (!isHighlight) {
            mapWidth = ".4px";
            leaderWidth = "1px";
        }
        var leaderString = multiClassString(["leader-line", name]);
        svgContainer.selectAll(leaderString)
            .style("stroke", color)
            .style("stroke-width", leaderWidth);
        var mapString = multiClassString(["map", name]);
        svgContainer.selectAll(mapString)
            .style("stroke", color)
            .style("stroke-width", mapWidth);
        var textString = multiClassString(["main-text", name]);
        svgContainer.selectAll(textString)
            .style("fill", color);
        changeThisClasses("." + name, ["highlight"], ["un-highlight"]);
        //
        //changeThisClasses(leaderString, ["highlight"], ["un-highlight"]);
        //changeThisClasses(mapString, ["highlight"], ["un-highlight"]);
        //changeThisClasses(textString, ["highlight"], ["un-highlight"]);
    };
    var highlightGroups = function () {
        groups.forEach(function (ele, index, array) {
            ele.forEach(function (e, index, array) {
                var color = group2Color[e];
                var abbr = mapTrix.originAbbrData[e];
                colorOne("in-" + abbr, color, true);
                colorOne("out-" + abbr, color, true);
            });
        });
        changeThisClasses("." + "always", ["highlight"], ["un-highlight"]);
    };
    var onMapClick = function (name) {
        var allInfo = name.split("-");
        var geoName = allInfo[1];
        var fullName = abbr2Full[geoName];
        if (mapTrix.currentNames.indexOf(fullName) == -1) {
            return;
        }
        if (is_control_key_down) {
            if (processGroup(fullName)) {
                groupSelected = true;
            }
            else {
                colorOne("in-" + geoName, "black", false);
                colorOne("out-" + geoName, "black", false);
            }
            highlightGroups();
        }
        else {
            clickNames([name]);
        }
        onMapOut(name);
        onMapHover(name);
        changeThisClasses("." + "always", ["highlight"], ["un-highlight"]);
    };
    queue()
        .defer(d3.json, originMap)
        .defer(d3.json, originGeo)
        .defer(d3.json, originAbbr)
        .defer(d3.json, desMap)
        .defer(d3.json, desGeo)
        .defer(d3.json, desAbbr)
        .await(function (error, oMap, oGeo, oAbbr, dMap, dGeo, dAbbr) {
        mapTrix = new MapTrix(new Geometry.Point(50, 40), preferWidth, preferHeight, odData, oMap, oGeo, oAbbr, originProjector(), dMap, dGeo, dAbbr, desProjector());
        var keys = Object.keys(oAbbr);
        for (var i = 0; i < keys.length; i++) {
            abbr2Full[oAbbr[keys[i]]] = keys[i];
        }
        d3.select("body")
            .on("keydown", function () {
            if (d3.event.shiftKey) {
                is_control_key_down = true;
                groupIndex += 1;
            }
        })
            .on("keyup", function () {
            if (!d3.event.shiftKey) {
                is_control_key_down = false;
                if (groupSelected == false) {
                    groupIndex -= 1;
                }
            }
        });
        mapTrix.draw(svgContainer, [odData.origins], [odData.destinations], onMatrixHover, onMatrixOut, onMatrixClick, onMapHover, onMapOut, onMapClick);
        //mapTrix.draw(svgContainer,
        //    [
        //        ["California", "Oregon", "Washington"], ["Texas", "Colorado", "Oklahoma", "New Mexico"]
        //    ],
        //    [
        //        ["California", "Oregon", "Washington"], ["Texas", "Colorado", "Oklahoma", "New Mexico"]
        //    ],
        //    onMatrixHover, onMatrixOut, onMatrixClick,
        //    onMapHover, onMapOut, onMapClick
        //);
        //mapTrix.draw(svgContainer,
        //    [
        //        ["California", "Oregon", "Washington"],
        //        ["New York", "Massachusetts", "Pennsylvania", "New Jersey"],
        //        ["Texas", "Colorado", "Oklahoma", "New Mexico"]
        //    ],
        //    [
        //        ["California", "Oregon", "Washington"],
        //        ["New York", "Massachusetts", "Pennsylvania", "New Jersey"],
        //        ["Texas", "Colorado", "Oklahoma", "New Mexico"]
        //    ],
        //    onMatrixHover, onMatrixOut, onMatrixClick,
        //    onMapHover, onMapOut, onMapClick
        //);
        var filterSingleFlow = function (from, to) {
            var filtered = odData.filterSingleFlow(odData.origins, odData.destinations, from, to);
            return arrayUnique(filtered[0].concat(filtered[1]));
        };
        var redrawAfterFiltering = function (names) {
            mapTrix.removeConnections(svgContainer);
            mapTrix.draw(svgContainer, names, names, onMatrixHover, onMatrixOut, onMatrixClick, onMapHover, onMapOut, onMapClick);
            groups.forEach(function (ele, index, array) {
                ele.forEach(function (e, index, array) {
                    var abbr = mapTrix.originAbbrData[e];
                    colorOne("in-" + abbr, "black", false);
                    colorOne("out-" + abbr, "black", false);
                });
            });
            clicked.forEach(function (e, index, array) {
                var abbr = mapTrix.originAbbrData[e];
                colorOne("in-" + abbr, "black", false);
                colorOne("out-" + abbr, "black", false);
            });
            groups = [];
            groupIndex = -1;
            groupSelected = false;
            clicked = [];
            hovered = [];
        };
        d3.select("#singleFlow")
            .style("margin-top", mapTrix.position.y)
            .style("height", 2 * mapTrix.originMap.height);
        var singleFlowFilter = document.getElementById("singleFlow");
        var heightForTotal = mapTrix.originMap.height - 100;
        var startY = mapTrix.position.y + 50;
        d3.select("#totalOutFlow")
            .style("margin-top", startY)
            .style("height", heightForTotal);
        var totalOutFlowFilter = document.getElementById("totalOutFlow");
        d3.select("#totalInFlow")
            .style("margin-top", 50)
            .style("height", heightForTotal);
        var totalInFlowFilter = document.getElementById("totalInFlow");
        noUiSlider.create(singleFlowFilter, {
            start: [odData.minFlow, odData.maxFlow],
            step: 10,
            margin: 10,
            connect: true,
            direction: 'rtl',
            orientation: 'vertical',
            behaviour: 'tap-drag',
            range: {
                'min': 0,
                'max': Math.ceil(odData.maxFlow / 10000) * 10000
            },
            pips: {
                mode: 'positions',
                values: d3.range(0, 100, 10),
                density: 2,
                format: {
                    to: function (value) {
                        return value / 1000 + 'K';
                    }
                }
            }
        });
        noUiSlider.create(totalOutFlowFilter, {
            start: [odData.minOrigin, odData.maxOrigin],
            step: 10,
            margin: 10,
            connect: true,
            direction: 'rtl',
            orientation: 'vertical',
            behaviour: 'tap-drag',
            range: {
                'min': 0,
                'max': Math.ceil(odData.maxOrigin / 10000) * 10000
            },
            pips: {
                mode: 'positions',
                values: d3.range(0, 100, 10),
                density: 2,
                format: {
                    to: function (value) {
                        return value / 1000 + 'K';
                    }
                }
            }
        });
        noUiSlider.create(totalInFlowFilter, {
            start: [odData.minDes, odData.maxDes],
            step: 10,
            margin: 20,
            connect: true,
            direction: 'rtl',
            orientation: 'vertical',
            behaviour: 'tap-drag',
            range: {
                'min': 0,
                'max': Math.ceil(odData.maxDes / 10000) * 10000
            },
            pips: {
                mode: 'positions',
                values: d3.range(0, 100, 10),
                density: 2,
                format: {
                    to: function (value) {
                        return value / 1000 + 'K';
                    }
                }
            }
        });
        var singleFlowLegend = d3.select("#singleFlowLegend");
        singleFlowLegend.attr("height", preferHeight);
        drawColorLegend(singleFlowLegend, mapTrix.scales.colorMatrixScale, 0, mapTrix.position.y, 40, 2 * mapTrix.originMap.height);
        var totalOutFlowLegend = d3.select("#totalOutFlowLegend");
        totalOutFlowLegend.attr("height", preferHeight / 2);
        var tempColor = d3.rgb(mapTrix.dotUnitColor, mapTrix.dotUnitColor, mapTrix.dotUnitColor);
        drawCircleLegend(totalOutFlowLegend, mapTrix.scales.dotMapScale, odData.maxOrigin, odData.minOrigin, 0, startY, 80, heightForTotal, [tempColor, tempColor, tempColor]);
        var totalInFlowLegend = d3.select("#totalInFlowLegend");
        totalInFlowLegend.attr("height", preferHeight / 2);
        drawCircleLegend(totalInFlowLegend, mapTrix.scales.dotMapScale, odData.maxDes, odData.minDes, 0, 50, 80, heightForTotal, [tempColor, tempColor, tempColor]);
        var updateSliders = function (names, which) {
            singleFlowFilter.noUiSlider.off('set');
            totalOutFlowFilter.noUiSlider.off('set');
            totalInFlowFilter.noUiSlider.off('set');
            //singleFlowFilter.noUiSlider.on('set', function(){});
            //totalOutFlowFilter.noUiSlider.on('set', function(){});
            //totalInFlowFilter.noUiSlider.on('set', function(){});
            var minSingle = Number.MAX_VALUE;
            var maxSingle = Number.MIN_VALUE;
            var minOut = Number.MAX_VALUE;
            var maxOut = Number.MIN_VALUE;
            var minIn = Number.MAX_VALUE;
            var maxIn = Number.MIN_VALUE;
            names.forEach(function (ele, index, array) {
                var outData = odData.originQuantity[ele];
                var inData = odData.destinationQuantity[ele];
                minOut = Math.min(outData, minOut);
                maxOut = Math.max(outData, maxOut);
                minIn = Math.min(inData, minIn);
                maxIn = Math.max(inData, maxIn);
                names.forEach(function (ele2, index2, array2) {
                    var flow = odData.query(ele, ele2);
                    if (flow > 0) {
                        minSingle = Math.min(flow, minSingle);
                        maxSingle = Math.max(flow, maxSingle);
                    }
                });
            });
            if (which == 1) {
                var singleCurrent = singleFlowFilter.noUiSlider.get();
                minSingle = Math.min(singleCurrent, minSingle);
                maxSingle = Math.max(singleCurrent, maxSingle);
            }
            else if (which == 2) {
                var outCurrent = singleFlowFilter.noUiSlider.get();
                minOut = Math.min(outCurrent, minOut);
                maxOut = Math.max(outCurrent, maxOut);
            }
            else if (which == 3) {
                var inCurrent = singleFlowFilter.noUiSlider.get();
                minIn = Math.min(inCurrent, minIn);
                maxIn = Math.max(inCurrent, maxIn);
            }
            singleFlowFilter.noUiSlider.set([minSingle, maxSingle]);
            totalOutFlowFilter.noUiSlider.set([minOut, maxOut]);
            totalInFlowFilter.noUiSlider.set([minIn, maxIn]);
            singleFlowFilter.noUiSlider.on('set', onSetSingle);
            totalOutFlowFilter.noUiSlider.on('set', onSetTotalOut);
            totalInFlowFilter.noUiSlider.on('set', onSetTotalIn);
        };
        var onChangeSingle = function (values, handle) {
            var from = parseFloat(values[0]);
            var to = parseFloat(values[1]);
            var unique = filterSingleFlow(from, to);
            mapTrix.highlightMaps(svgContainer, unique);
        };
        var onSetSingle = function (values, handle) {
            var from = parseFloat(values[0]);
            var to = parseFloat(values[1]);
            var unique = filterSingleFlow(from, to);
            updateSliders(unique, 1);
            redrawAfterFiltering([unique]);
        };
        var onChangeTotalOut = function (values, handle) {
            var from = parseFloat(values[0]);
            var to = parseFloat(values[1]);
            var unique = odData.filterTotalOut(odData.origins, from, to);
            mapTrix.highlightMaps(svgContainer, unique);
        };
        var onSetTotalOut = function (values, handle) {
            var from = parseFloat(values[0]);
            var to = parseFloat(values[1]);
            var unique = odData.filterTotalOut(odData.origins, from, to);
            updateSliders(unique, 2);
            redrawAfterFiltering([unique]);
        };
        var onChangeTotalIn = function (values, handle) {
            var from = parseFloat(values[0]);
            var to = parseFloat(values[1]);
            var unique = odData.filterTotalIn(odData.origins, from, to);
            mapTrix.highlightMaps(svgContainer, unique);
        };
        var onSetTotalIn = function (values, handle) {
            var from = parseFloat(values[0]);
            var to = parseFloat(values[1]);
            var unique = odData.filterTotalIn(odData.origins, from, to);
            updateSliders(unique, 3);
            redrawAfterFiltering([unique]);
        };
        singleFlowFilter.noUiSlider.on('update', onChangeSingle);
        singleFlowFilter.noUiSlider.on('set', onSetSingle);
        totalOutFlowFilter.noUiSlider.on('update', onChangeTotalOut);
        totalOutFlowFilter.noUiSlider.on('set', onSetTotalOut);
        totalInFlowFilter.noUiSlider.on('update', onChangeTotalIn);
        totalInFlowFilter.noUiSlider.on('set', onSetTotalIn);
        $("#btGroup").on("click", function () {
            if (groups.length > 0) {
                redrawAfterFiltering(groups);
            }
        });
        //var e = document.createElement('script');
        //if (window.location.protocol === 'https:') {
        //    e.setAttribute('src', 'https://rawgit.com/NYTimes/svg-crowbar/gh-pages/svg-crowbar.js');
        //} else {
        //    e.setAttribute('src', 'http://nytimes.github.com/svg-crowbar/svg-crowbar.js');
        //}
        //e.setAttribute('class', 'svg-crowbar');
        //document.body.appendChild(e);
    });
}
//# sourceMappingURL=index.js.map