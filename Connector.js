///<reference path="BoundaryMapper.ts"/>
///<reference path="LeaderOptimizer.ts"/>
///<reference path="LineMap.ts"/>
/**
 * Created by yalong on 8/12/2015.
 */
var Connector = (function () {
    function Connector(map, names, start, step, direction, angle) {
        this.map = map;
        this.names = names;
        this.start = start;
        this.step = step;
        this.direction = direction;
        this.angle = angle;
        // first direction is the direction of matrix, second is the direction of leader
        this.RIGHT_UP_MARGIN = 10;
        this.RIGHT_UP_WEIGHT = 1000;
        this.RIGHT_DOWN_MARGIN = 10;
        this.RIGHT_DOWN_WEIGHT = 1000;
        this.UP_RIGHT_MARGIN = 10;
        this.UP_RIGHT_WEIGHT = 1000;
        this.UP_LEFT_MARGIN = 10;
        this.UP_LEFT_WEIGHT = 1000;
        this.sortedNames = []; // if direction is Right, up to bottom; if direction is Up, left to right
    }
    Connector.prototype.calculateLeaderLine = function () {
        this.sites = [];
        this.site2Name = new Hashtable();
        for (var i = 0; i < this.names.length; i++) {
            var name = this.names[i];
            var startPoint = this.map.name2Position[name];
            this.site2Name.put(startPoint, name);
            this.sites.push(startPoint);
        }
        var position = new Geometry.Point(this.map.position.x, this.map.position.y);
        // Make leader lines crossing-free
        this.boundaryMapper = new BoundaryMapper(this.sites, position, this.map.width, this.map.height, this.start, this.step, this.direction, this.angle, false);
        this.leaderResult = this.boundaryMapper.computeMinumumDistance();
        this.boundaryMapper.compute(this.leaderResult);
    };
    Connector.prototype.optimizeSites = function () {
        // cut the bounding box
        var trueNeedMoveSites = [];
        var falseNeedMoveSites = [];
        var ls = this.leaderResult.label2Leader.values();
        for (var i = 0; i < this.names.length; i++) {
            var n = this.names[i];
            var b = this.map.adjustRegions[n];
            var p = this.map.name2Position[n];
            var thisLeader = this.leaderResult.site2Leader.get(p);
            for (var j = 0; j < ls.length; j++) {
                var l = ls[j];
                var endStart = l.leader.bend;
                // the infinite leader line will cross the box
                if (endStart.y > b[0][1] && endStart.y < b[1][1]) {
                    // determine the limited length leader line
                    if (endStart.x < b[1][0]) {
                        if (l != thisLeader) {
                            if (thisLeader.leader.isUp) {
                                trueNeedMoveSites.push(p);
                            }
                            else {
                                falseNeedMoveSites.push(p);
                            }
                        }
                        if (p.y < endStart.y) {
                            b[1][1] = endStart.y;
                        }
                        else {
                            b[0][1] = endStart.y;
                        }
                    }
                }
            }
        }
        var trueMargin, trueWight, falseMargin, falseWeight;
        if (this.direction == Direction.Right) {
            trueMargin = this.RIGHT_UP_MARGIN;
            trueWight = this.RIGHT_UP_WEIGHT;
            falseMargin = this.RIGHT_DOWN_MARGIN;
            falseWeight = this.RIGHT_DOWN_WEIGHT;
        }
        else if (this.direction == Direction.Up) {
            trueMargin = this.UP_RIGHT_MARGIN;
            trueWight = this.UP_RIGHT_WEIGHT;
            falseMargin = this.UP_LEFT_MARGIN;
            falseWeight = this.UP_LEFT_WEIGHT;
        }
        // Optimize lead lines, keep a minimum distance between each lines & make minimum change
        var leaderOptimizer = new LeaderOptimizer(this.leaderResult, this.boundaryMapper, this.map.site2Region);
        leaderOptimizer.testOnly = this.map.position2Name;
        leaderOptimizer.computeOneDirection(this.boundaryMapper.trueList, trueNeedMoveSites, true, trueMargin, trueWight);
        leaderOptimizer.computeOneDirection(this.boundaryMapper.falseList, falseNeedMoveSites, false, falseMargin, falseWeight);
        //// TODO may be not good... need discussion
        this.boundaryMapper.compute(this.leaderResult);
    };
    Connector.prototype.sortSites = function () {
        var result = this.leaderResult;
        if (this.direction == Direction.Right) {
            this.sites.sort(function (a, b) {
                var aEnd = result.site2Leader.get(a).label;
                var bEnd = result.site2Leader.get(b).label;
                return aEnd.y - bEnd.y;
            });
        }
        else if (this.direction == Direction.Up) {
            this.sites.sort(function (a, b) {
                var aEnd = result.site2Leader.get(a).label;
                var bEnd = result.site2Leader.get(b).label;
                return aEnd.x - bEnd.x;
            });
        }
        for (var i = 0; i < this.sites.length; i++) {
            this.sortedNames.push(this.site2Name.get(this.sites[i]));
        }
    };
    return Connector;
}());
//# sourceMappingURL=Connector.js.map