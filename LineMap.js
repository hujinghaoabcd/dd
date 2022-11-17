/// <reference path="./lib/d3.d.ts"/>
/// <reference path="Point.ts"/>
/// <reference path="MapProjector.ts"/>
/// <reference path="GeoInfoHelper.ts"/>
var LineMap = (function () {
    function LineMap(mapData, geoInfoHelper, position, width, height, projector, isOrigin, prePosition) {
        this.mapData = mapData;
        this.geoInfoHelper = geoInfoHelper;
        this.position = position;
        this.width = width;
        this.height = height;
        this.projector = projector;
        this.isOrigin = isOrigin;
        this.prePosition = prePosition;
        this.name2Position = {};
        this.position2Name = new Hashtable();
        this.adjustRegions = {};
        this.site2Region = new Hashtable();
        this.site2BBox = new Hashtable();
        this.centerDict = {};
        this.lineFunction = d3.svg.line()
            .interpolate("linear");
        this.projector
            .scale(1)
            .translate([0, 0]);
        this.path = d3.geo.path().projection(this.projector);
        this.data = mapData;
        var feature = topojson.feature(this.data, this.data["objects"]["states"]);
        var b = this.path.bounds(feature);
        var s = .95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height);
        this.mapHeight = s * (b[1][1] - b[0][1]);
        this.mapWidth = s * (b[1][0] - b[0][0]);
        if (this.prePosition) {
            this.prePosition(this);
        }
        this.projector
            .scale(s)
            .translate([
            this.position.x + this.mapWidth / 2,
            this.position.y + this.mapHeight / 2
        ]);
        this.path.projection(this.projector);
        var locationNames = geoInfoHelper.names;
        for (var i = 0; i < locationNames.length; i++) {
            var name = locationNames[i];
            var latLong = geoInfoHelper.getGeo(name);
            var pointPosition = this.projector([latLong["lng"], latLong["lat"]]);
            var point = new Geometry.Point(pointPosition[0], pointPosition[1]);
            this.name2Position[name] = point;
            this.position2Name.put(point, name);
        }
        var reader = new jsts.io.GeoJSONReader();
        var states = this.data["objects"].states.geometries;
        for (var i = 0; i < states.length; i++) {
            var state = states[i];
            var sFeature = topojson.feature(this.data, state);
            var sBoundingBox = this.path.bounds(sFeature);
            var stateName = state.properties.name;
            if (sFeature && sFeature.geometry && sFeature.geometry.coordinates) {
                var fData = sFeature.geometry.coordinates;
                if (this.name2Position[stateName] && this.projectCoordinates(fData)) {
                    var poly = reader.read(sFeature.geometry);
                    var polygons;
                    if (poly.geometries) {
                        polygons = poly.geometries;
                    }
                    else {
                        polygons = [poly];
                    }
                    var p = this.name2Position[stateName];
                    var region = this.getAdjustRegion(p, sBoundingBox, polygons);
                    this.site2BBox.put(p, sBoundingBox);
                    this.site2Region.put(p, region);
                    this.adjustRegions[stateName] = region;
                }
            }
        }
    }
    LineMap.prototype.projectCoordinates = function (fData) {
        for (var j = 0; j < fData.length; j++) {
            var shape = fData[j];
            for (var k = 0; k < shape.length; k++) {
                var subShape = shape[k];
                for (var m = 0; m < subShape.length; m++) {
                    subShape[m] = this.projector(subShape[m]);
                    if (!subShape[m]) {
                        return false;
                    }
                }
            }
        }
        return true;
    };
    LineMap.prototype.getAdjustRegion = function (initialPoint, bbox, polygons) {
        var p = new jsts.geom.Point(new jsts.geom.Coordinate(initialPoint.x, initialPoint.y));
        function isInPoly(poly, point) {
            return point.within(poly);
        }
        var validPolys = [];
        for (var i = 0; i < polygons.length; i++) {
            var poly = polygons[i];
            if (poly.isValid()) {
                validPolys.push(poly);
            }
        }
        if (!processPolygons(validPolys, p, isInPoly, false) || validPolys.length == 0) {
            return [
                [
                    initialPoint.x - 5,
                    initialPoint.y - 5
                ],
                [
                    initialPoint.x + 5,
                    initialPoint.y + 5
                ]
            ];
        }
        if (bbox[1][0] - bbox[0][0] < 10 || bbox[1][1] - bbox[0][1] < 10) {
            return [
                [
                    initialPoint.x - 5,
                    initialPoint.y - 5
                ],
                [
                    initialPoint.x + 5,
                    initialPoint.y + 5
                ]
            ];
        }
        var smallBox = [
            [
                initialPoint.x,
                initialPoint.y
            ],
            [
                initialPoint.x,
                initialPoint.y
            ]
        ];
        smallBox = [
            [
                (smallBox[0][0] + bbox[0][0]) / 2,
                (smallBox[0][1] + bbox[0][1]) / 2
            ],
            [
                (smallBox[1][0] + bbox[1][0]) / 2,
                (smallBox[1][1] + bbox[1][1]) / 2
            ]
        ];
        function isCrossing(polygons, box) {
            var geometryFactory = new jsts.geom.GeometryFactory();
            var coordinates = [];
            coordinates.push(new jsts.geom.Coordinate(box[0][0], box[0][1]));
            coordinates.push(new jsts.geom.Coordinate(box[1][0], box[0][1]));
            coordinates.push(new jsts.geom.Coordinate(box[1][0], box[1][1]));
            coordinates.push(new jsts.geom.Coordinate(box[0][0], box[1][1]));
            coordinates.push(coordinates[0]);
            var shell = geometryFactory.createLinearRing(coordinates);
            var tempPoly = geometryFactory.createPolygon(shell);
            function isBoxPolyCrossing(p0, p1) {
                if (p1.within(p0)) {
                    return false;
                }
                else {
                    return p0.intersects(p1);
                }
            }
            return processPolygons(polygons, tempPoly, isBoxPolyCrossing, false);
        }
        var count = 0;
        while (true) {
            if (isCrossing(validPolys, smallBox)) {
                bbox = [
                    [
                        smallBox[0][0],
                        smallBox[0][1]
                    ],
                    [
                        smallBox[1][0],
                        smallBox[1][1]
                    ]
                ];
                smallBox = [
                    [
                        initialPoint.x,
                        initialPoint.y
                    ],
                    [
                        initialPoint.x,
                        initialPoint.y
                    ]
                ];
            }
            else {
                var smallL = smallBox[1][0] - smallBox[0][0];
                var bigL = bbox[1][0] - bbox[0][0];
                if (smallL / bigL > 0.9) {
                    return smallBox;
                }
                count++;
                if (count == 200) {
                    return smallBox;
                }
            }
            smallBox = [
                [
                    (smallBox[0][0] + bbox[0][0]) / 2,
                    (smallBox[0][1] + bbox[0][1]) / 2
                ],
                [
                    (smallBox[1][0] + bbox[1][0]) / 2,
                    (smallBox[1][1] + bbox[1][1]) / 2
                ]
            ];
        }
    };
    LineMap.prototype.drawBox = function (box, svgContainer) {
        var points = [];
        points[0] = box[0];
        points[1] = [box[1][0], box[0][1]];
        points[2] = box[1];
        points[3] = [box[0][0], box[1][1]];
        points[4] = box[0];
        var tempPoints = [];
        for (var j = 0; j < points.length; j++) {
            var p = points[j];
            tempPoints[j] = {
                x: p[0],
                y: p[1]
            };
        }
        svgContainer.append("path")
            .attr("d", this.lineFunction(tempPoints))
            .attr("class", "leader-line line-color-one");
    };
    LineMap.prototype.drawBoxes = function (svgContainer) {
        var keys = Object.keys(this.name2Position);
        for (var i = 0; i < keys.length; i++) {
            var box = this.adjustRegions[keys[i]];
            if (box) {
                this.drawBox(box, svgContainer);
            }
        }
    };
    LineMap.prototype.draw = function (svgContainer, onHover, onOut, onClick, name2Color, abbr) {
        if (name2Color != null) {
            svgContainer.append("g")
                .selectAll("path")
                .data(topojson.feature(this.data, this.data["objects"]["states"])["features"])
                .enter().append("path")
                .attr("fill", function (d) {
                var c = name2Color[abbr[d.properties.name]];
                if (c) {
                    return c;
                }
                return "#f5f5f5";
            })
                .attr("d", this.path)
                .style("stroke", "black")
                .style("stroke-width", "0.4px");
        }
        else {
            var mapIdentify = "in";
            var tempPre = "in-";
            if (this.isOrigin) {
                tempPre = "out-";
                mapIdentify = "out";
            }
            var thisData = topojson.feature(this.data, this.data["objects"]["states"]).features;
            for (var i = 0; i < thisData.length; i++) {
                var mm = thisData[i];
                mm["preName"] = tempPre + abbr[mm.properties.name];
            }
            svgContainer.selectAll("states")
                .data(thisData)
                .enter().append("path")
                .attr("d", this.path)
                .attr("class", function (d) { return mapIdentify + " map un-clicked-map " + d["preName"]; })
                .on('mouseover', function (d, i) {
                onHover(d["preName"]);
            })
                .on('mouseout', function (d, i) {
                onOut(d["preName"]);
            })
                .on('click', function (d, i) {
                onClick(d["preName"]);
            });
        }
        if (abbr) {
            var names = this.geoInfoHelper.names;
            for (var i = 0; i < names.length; i++) {
                var n = names[i];
                var a = abbr[n];
                var p = this.name2Position[n];
            }
        }
        //svgContainer.append("path")
        //    .datum(topojson.mesh(this.data, this.data["objects"]["states"],
        //        function(a, b) { return true }))
        //    .attr("class", "state-boundary")
        //    .attr("d", this.path);
    };
    return LineMap;
}());
function processPolygons(polygons, geometry, func, getFalse) {
    if (getFalse === void 0) { getFalse = true; }
    for (var i = 0; i < polygons.length; i++) {
        var poly = polygons[i];
        var r = func(poly, geometry);
        if (getFalse) {
            if (r === false) {
                return false;
            }
        }
        else {
            if (r === true) {
                return true;
            }
        }
    }
    return getFalse === true;
}
//# sourceMappingURL=LineMap.js.map