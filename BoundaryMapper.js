///<reference path="Point.ts"/>
/**
 * Created by yalong on 6/3/15.
 */
var Direction;
(function (Direction) {
    Direction[Direction["Left"] = 0] = "Left";
    Direction[Direction["Right"] = 1] = "Right";
    Direction[Direction["Up"] = 2] = "Up";
    Direction[Direction["Down"] = 3] = "Down";
})(Direction || (Direction = {}));
var LeaderType;
(function (LeaderType) {
    LeaderType[LeaderType["OD"] = 0] = "OD";
    LeaderType[LeaderType["DO"] = 1] = "DO";
    LeaderType[LeaderType["PD"] = 2] = "PD";
})(LeaderType || (LeaderType = {}));
function crossProduct(x0, y0, x1, y1) {
    return x0 * y1 - y0 * x1;
}
function isTwoLineCross(sp0, sp1, ep0, ep1) {
    var s_x = sp1.x - sp0.x;
    var s_y = sp1.y - sp0.y;
    var r_x = ep1.x - ep0.x;
    var r_y = ep1.y - ep0.y;
    var r_cross_s = crossProduct(r_x, r_y, s_x, s_y);
    if (r_cross_s === 0) {
        return false;
    }
    var q_p_x = sp0.x - ep0.x;
    var q_p_y = sp0.y - ep0.y;
    var t = crossProduct(q_p_x, q_p_y, s_x, s_y) / r_cross_s;
    var u = crossProduct(q_p_x, q_p_y, r_x, r_y) / r_cross_s;
    if (0 <= t && t < 0.99 && 0 <= u && u < 0.99) {
        return true;
    }
    return false;
}
var LeaderLine = (function () {
    function LeaderLine(start, bend, end, type) {
        this.start = start;
        this.bend = bend;
        this.end = end;
        this.type = type;
        // in browser, small y is at a higher position
        if (end.y < start.y) {
            this.isUp = true;
        }
        else {
            this.isUp = false;
        }
        if (end.x > start.x) {
            this.isRight = true;
        }
        else {
            this.isRight = false;
        }
    }
    LeaderLine.prototype.isCrossed = function (otherLeader) {
        return (isTwoLineCross(this.start, this.bend, otherLeader.bend, otherLeader.end) ||
            isTwoLineCross(otherLeader.start, otherLeader.bend, this.bend, this.end));
    };
    return LeaderLine;
}());
var LeaderCombination = (function () {
    function LeaderCombination(site, label, leader) {
        this.site = site;
        this.label = label;
        this.leader = leader;
    }
    return LeaderCombination;
}());
var MappingResult = (function () {
    function MappingResult() {
        this.site2Leader = new Hashtable();
        this.label2Leader = new Hashtable();
    }
    MappingResult.prototype.updateEntry = function (site, label, leader) {
        var leaderCombiantion = new LeaderCombination(site, label, leader);
        this.site2Leader.put(site, leaderCombiantion);
        this.label2Leader.put(label, leaderCombiantion);
    };
    return MappingResult;
}());
var BoundaryMapper = (function () {
    function BoundaryMapper(sites, position, width, height, labelStartPoint, stepDistance, direction, angle, isOD) {
        if (angle === void 0) { angle = 45; }
        if (isOD === void 0) { isOD = true; }
        this.sites = sites;
        this.position = position;
        this.width = width;
        this.height = height;
        this.labelStartPoint = labelStartPoint;
        this.stepDistance = stepDistance;
        this.direction = direction;
        this.angle = angle;
        this.isOD = isOD;
        this.labels = [];
        this.trueList = []; // leader lines head to 1 direction
        this.falseList = []; // leader lines head to the other direction
        if (direction == Direction.Left || direction == Direction.Right) {
            this.step = new Geometry.Point(0, stepDistance);
        }
        else {
            this.step = new Geometry.Point(stepDistance, 0);
        }
        this.tangentAngle = Math.tan(angle / 180 * Math.PI);
        this.labels.push(labelStartPoint);
        for (var i = 1; i < sites.length; i++) {
            this.labels.push(new Geometry.Point(labelStartPoint.x + this.step.x * i, labelStartPoint.y + this.step.y * i));
        }
        this.rightUpPoint = new Geometry.Point(this.position.x + this.width, this.position.y);
        this.rightDownPoint = new Geometry.Point(this.position.x + this.width, this.position.y + this.height);
        this.leftUpPoint = new Geometry.Point(this.position.x, this.position.y);
        this.leftDownPoint = new Geometry.Point(this.position.x, this.position.y + this.height);
    }
    BoundaryMapper.prototype.computeMinumumDistance = function () {
        var matrix = [];
        for (var i = 0; i < this.sites.length; i++) {
            matrix[i] = [];
            for (var j = 0; j < this.labels.length; j++) {
                matrix[i][j] = calcuDistance(this.sites[i], this.labels[j], this.direction, this.tangentAngle);
            }
        }
        var m = new Munkres();
        var indices = m.compute(matrix);
        var result = new MappingResult();
        for (var i = 0; i < indices.length; i++) {
            var site = this.sites[indices[i][0]];
            var label = this.labels[indices[i][1]];
            var leader = this.getLeader(site, label);
            result.updateEntry(site, label, leader);
        }
        if (this.direction == Direction.Right) {
            this.sweepLineRightBottom2LeftUp();
            for (var i = 0; i < this.sites.length; i++) {
                var site = this.sites[i];
                var leaderInfo = result.site2Leader.get(site);
                var l1 = leaderInfo.leader;
                if (l1.isUp) {
                    this.trueList.push(site);
                }
            }
            this.sweepLineRightUp2LeftBottomRight();
            for (var i = 0; i < this.sites.length; i++) {
                var site = this.sites[i];
                var l1 = result.site2Leader.get(site).leader;
                if (!l1.isUp) {
                    this.falseList.push(site);
                }
            }
        }
        else if (this.direction == Direction.Up) {
            this.sweepLineLeftUp2RightBottom();
            for (var i = 0; i < this.sites.length; i++) {
                var site = this.sites[i];
                var l1 = result.site2Leader.get(site).leader;
                if (l1.isRight) {
                    this.trueList.push(site);
                }
            }
            this.sweepLineRightUp2LeftBottomUp();
            for (var i = 0; i < this.sites.length; i++) {
                var site = this.sites[i];
                var l1 = result.site2Leader.get(site).leader;
                if (!l1.isRight) {
                    this.falseList.push(site);
                }
            }
        }
        return result;
    };
    BoundaryMapper.prototype.reRoutePD = function (result) {
        function checkPD(siteLeader, labelLeader) {
            if (siteLeader.type == LeaderType.PD) {
                return true;
            }
            return false;
        }
        if (this.direction == Direction.Right) {
            this.sites.sort(function (a, b) {
                return -(a.x - b.x);
            });
        }
        else if (this.direction == Direction.Left) {
            this.sites.sort(function (a, b) {
                return a.x - b.x;
            });
        }
        else if (this.direction == Direction.Up) {
            this.sites.sort(function (a, b) {
                return -(a.y - b.y);
            });
        }
        else if (this.direction == Direction.Down) {
            this.sites.sort(function (a, b) {
                return a.y - b.y;
            });
        }
        this.reRoute(this.sites, this.labels, checkPD, result);
    };
    BoundaryMapper.prototype.reRouteDO = function (result) {
        function checkDOCross(siteLeader, labelLeader) {
            if (siteLeader.type == LeaderType.DO) {
                return true;
            }
            return false;
        }
        if (this.direction == Direction.Right) {
            this.sweepLineRightBottom2LeftUp();
            this.sortBottom2UpLabels();
        }
        else if (this.direction == Direction.Left) {
        }
        else if (this.direction == Direction.Up) {
            this.sweepLineLeftUp2RightBottom();
            this.sortLeft2RightLabels();
        }
        else if (this.direction == Direction.Down) {
        }
        this.reRoute(this.sites, this.labels, checkDOCross, result);
        if (this.direction == Direction.Right) {
            this.sweepLineRightUp2LeftBottomRight();
            this.sortUp2BottomLabels();
        }
        else if (this.direction == Direction.Up) {
            this.sweepLineRightUp2LeftBottomUp();
            this.sortRight2LeftLabels();
        }
        else if (this.direction == Direction.Left) {
        }
        else if (this.direction == Direction.Down) {
        }
        this.reRoute(this.sites, this.labels, checkDOCross, result);
    };
    BoundaryMapper.prototype.compute = function (result) {
        //var result = this.computeMinumumDistance();
        this.reRoutePD(result);
        //this.labels.reverse();
        //this.reRoute(this.sites, this.labels, checkPD, result);
        //this.labels.reverse();
        function checkODCross(siteLeader, labelLeader) {
            if (siteLeader.type == LeaderType.OD) {
                return true;
            }
            return false;
        }
        // Watch out the k
        if (!this.isOD) {
            this.reRouteDO(result);
        }
        else {
        }
    };
    BoundaryMapper.prototype.sweepLineRightBottom2LeftUp = function () {
        // sweep line from right bottom to left up
        var a = -1;
        var b = this.tangentAngle;
        this.sortSites(this.rightDownPoint, a, b);
    };
    BoundaryMapper.prototype.sweepLineLeftUp2RightBottom = function () {
        // sweep line from left up to right bottom
        var a = -1;
        var b = this.tangentAngle;
        this.sortSites(this.leftUpPoint, a, b);
    };
    BoundaryMapper.prototype.sweepLineRightUp2LeftBottomRight = function () {
        // sweep line from right up to left bottom
        var a = this.tangentAngle;
        var b = 1;
        this.sortSites(this.rightUpPoint, a, b);
    };
    BoundaryMapper.prototype.sweepLineRightUp2LeftBottomUp = function () {
        // sweep line from right up to left bottom
        var a = 1;
        var b = this.tangentAngle;
        this.sortSites(this.rightUpPoint, a, b);
    };
    BoundaryMapper.prototype.sortBottom2UpLabels = function () {
        this.labels.sort(function (a, b) {
            return b.y - a.y;
        });
    };
    BoundaryMapper.prototype.sortUp2BottomLabels = function () {
        this.labels.sort(function (a, b) {
            return a.y - b.y;
        });
    };
    BoundaryMapper.prototype.sortRight2LeftLabels = function () {
        this.labels.sort(function (a, b) {
            return b.x - a.x;
        });
    };
    BoundaryMapper.prototype.sortLeft2RightLabels = function () {
        this.labels.sort(function (a, b) {
            return a.x - b.x;
        });
    };
    BoundaryMapper.prototype.sortSites = function (basePoint, a, b) {
        this.sites.sort(function (n0, n1) {
            return getDistanceFromLine(basePoint, n0, a, b, 0) -
                getDistanceFromLine(basePoint, n1, a, b, 0);
        });
    };
    BoundaryMapper.prototype.reRoute = function (sites, labels, check, result) {
        for (var i = 0; i < sites.length; i++) {
            var thisSite = sites[i];
            var siteInfo = result.site2Leader.get(thisSite);
            var siteLeader = siteInfo.leader;
            for (var j = 0; j < labels.length; j++) {
                var thisLabel = labels[j];
                var labelInfo = result.label2Leader.get(thisLabel);
                var labelLeader = labelInfo.leader;
                if (siteLeader.type == labelLeader.type) {
                    if (check(siteLeader, labelLeader)) {
                        if (siteLeader.isCrossed(labelLeader)) {
                            var newSite2Label = this.getLeader(thisSite, thisLabel);
                            result.updateEntry(thisSite, thisLabel, newSite2Label);
                            var newLabel2Site = this.getLeader(labelInfo.site, siteInfo.label);
                            result.updateEntry(labelInfo.site, siteInfo.label, newLabel2Site);
                            break;
                        }
                    }
                }
            }
        }
    };
    BoundaryMapper.prototype.getLeader = function (site, label) {
        var offsetX = Math.abs(site.x - label.x);
        var offsetY = Math.abs(site.y - label.y);
        if (isInLabelRegion(site, label, this.direction, this.tangentAngle)) {
            if (this.direction == Direction.Left || this.direction == Direction.Right) {
                var direcFlag = 1;
                if (this.direction == Direction.Left) {
                    direcFlag = -1;
                }
                var tempL = offsetY / this.tangentAngle;
                var offset = offsetX - tempL;
                if (this.isOD) {
                    return new LeaderLine(site, new Geometry.Point(site.x + offset * direcFlag, site.y), label, LeaderType.OD);
                }
                else {
                    return new LeaderLine(site, new Geometry.Point(label.x - offset * direcFlag, label.y), label, LeaderType.DO);
                }
            }
            else {
                var direcFlag = 1;
                if (this.direction == Direction.Down) {
                    direcFlag = -1;
                }
                var tempL = offsetX / this.tangentAngle;
                var offset = offsetY - tempL;
                if (this.isOD) {
                    return new LeaderLine(site, new Geometry.Point(site.x, site.y - offset * direcFlag), label, LeaderType.OD);
                }
                else {
                    return new LeaderLine(site, new Geometry.Point(label.x, label.y + offset * direcFlag), label, LeaderType.DO);
                }
            }
        }
        else {
            if (this.direction == Direction.Left || this.direction == Direction.Right) {
                var tempL = offsetX * this.tangentAngle;
                var yFlag = -1;
                if (site.y > label.y) {
                    yFlag = 1;
                }
                return new LeaderLine(site, new Geometry.Point(site.x, label.y + yFlag * tempL), label, LeaderType.PD);
            }
            else {
                var tempL = offsetY * this.tangentAngle;
                var xFlag = -1;
                if (site.x < label.x) {
                    xFlag = 1;
                }
                return new LeaderLine(site, new Geometry.Point(label.x - tempL * xFlag, site.y), label, LeaderType.PD);
            }
        }
    };
    return BoundaryMapper;
}());
function getDistanceFromLine(origin, point, a, b, c) {
    var offsetX = point.x - origin.x;
    var offsetY = origin.y - point.y;
    return Math.abs(a * offsetX + b * offsetY + c) / Math.sqrt(a * a + b * b);
}
function isInLabelRegion(site, label, direction, tangentAngle) {
    var offsetX = site.x - label.x;
    var offsetY = site.y - label.y;
    if (direction == Direction.Left || direction == Direction.Right) {
        var tangent = Math.abs(offsetY / offsetX);
        return tangent < tangentAngle;
    }
    else {
        var tangent = Math.abs(offsetX / offsetY);
        return tangent < tangentAngle;
    }
}
//function calcuLeaderType(site: Geometry.Point, label: Geometry.Point,
//                         direction: Direction, tangentAngle: number): LeaderType{
//    if(this.isInLabelRegion(site, label, direction, tangentAngle)){
//        return LeaderType.DO;
//    }else{
//        return LeaderType.PD;
//    }
//}
function calcuDistance(site, label, direction, tangentAngle) {
    var offsetX = Math.abs(site.x - label.x);
    var offsetY = Math.abs(site.y - label.y);
    if (isInLabelRegion(site, label, direction, tangentAngle)) {
        if (direction == Direction.Left || direction == Direction.Right) {
            var tempL = offsetY / tangentAngle;
            return offsetX - tempL + Math.sqrt(tempL * tempL + offsetY * offsetY);
        }
        else {
            var tempL = offsetX / tangentAngle;
            return offsetY - tempL + Math.sqrt(tempL * tempL + offsetX * offsetX);
        }
    }
    else {
        if (direction == Direction.Left || direction == Direction.Right) {
            var tempL = offsetX * tangentAngle;
            return offsetY - tempL + Math.sqrt(tempL * tempL + offsetX * offsetX);
        }
        else {
            var tempL = offsetY * tangentAngle;
            return offsetX - tempL + Math.sqrt(tempL * tempL + offsetY * offsetY);
        }
    }
}
//var tangent = Math.tan(60 / 180 * Math.PI);
//var site = new Geometry.Point(1,1);
//var label = new Geometry.Point(0,0);
//var direction = Direction.Left;
//console.log(
//    calcuDistance(site, label, direction, tangent)
//);
//# sourceMappingURL=BoundaryMapper.js.map