///<reference path="BoundaryMapper.ts"/>
/**
 * Created by yalong on 6/14/15.
 */
var LeaderOptimizer = (function () {
    function LeaderOptimizer(leaderInfo, bm, site2Region) {
        this.leaderInfo = leaderInfo;
        this.bm = bm;
        this.site2Region = site2Region;
        this.LEADER_SITE_DISTANCE = 10;
        this.LEADER_SITE_WEIGHT = 100000;
        this.k = this.bm.tangentAngle;
        this.dFactor = Math.sqrt(this.k * this.k + 1);
    }
    LeaderOptimizer.prototype.computeOneDirection = function (sites, avoidOLineSites, isTrue, margin, weight, siteLeaderMargin, siteLeaderWeight) {
        if (siteLeaderMargin === void 0) { siteLeaderMargin = this.LEADER_SITE_DISTANCE; }
        if (siteLeaderWeight === void 0) { siteLeaderWeight = this.LEADER_SITE_WEIGHT; }
        if (sites.length == 0) {
            return;
        }
        // index start at 1, not 0
        var n = sites.length;
        var n2 = 2 * n;
        var avoidN = avoidOLineSites.length;
        // for margin away from real distance
        var varNum = n2 + n - 1 + avoidN;
        var disParameters = getMarginParameters(this.k, this.bm.direction, isTrue);
        //for(var i = 0; i < n; i++){
        //    console.log((sites[i].x).toFixed(0));
        //    console.log((sites[i].y).toFixed(0));
        //}
        var avoidSiteIndice = [];
        for (var i = 0; i < avoidN; i++) {
            var s = avoidOLineSites[i];
            //console.log(sites.indexOf(s));
            avoidSiteIndice.push(sites.indexOf(s));
        }
        // Construct goal matrix (cost matrix)
        var DMat = [];
        for (var i = 1; i < varNum + 1; i++) {
            DMat[i] = [];
            for (var j = 1; j < varNum + 1; j++) {
                if (i < n2 + 1) {
                    // for x, y
                    if (i == j) {
                        DMat[i][j] = 1;
                    }
                    else {
                        DMat[i][j] = 0;
                    }
                }
                else if (i < n + n2)
                    // for margin away from suggested distance
                    if (i == j) {
                        DMat[i][j] = weight;
                    }
                    else {
                        DMat[i][j] = 0;
                    }
                else {
                    // for avoiding line and site in the same line
                    if (i == j) {
                        DMat[i][j] = siteLeaderWeight;
                    }
                    else {
                        DMat[i][j] = 0;
                    }
                }
            }
        }
        //for(var i = 0; i < n-1; i++){
        //    var tempDisMatrix = this.getMatrixForDistance(varNum, n2, i, disParameters);
        //    addMatrix(DMat, tempDisMatrix);
        //}
        var DVec = [];
        // for x, y
        for (var i = 0; i < n; i++) {
            DVec[2 * i + 1] = sites[i].x;
            DVec[2 * i + 2] = sites[i].y;
        }
        // for margin
        for (var i = 0; i < n - 1; i++) {
            DVec[n2 + i + 1] = weight * margin;
        }
        // for site leader margin
        for (var i = 0; i < avoidN; i++) {
            DVec[n2 + i + n] = siteLeaderMargin * siteLeaderWeight;
        }
        var tempAMat = [];
        var BVec = [];
        var constrainIndex = 0;
        // constrain of margin between leader lines
        var distanceConstrainLength = n - 1;
        for (var i = 0; i < distanceConstrainLength; i++) {
            var dc = this.getDistanceConstrain(varNum, n2, i, disParameters);
            tempAMat[i + 1] = dc[0];
            BVec[i + 1] = dc[1];
            constrainIndex++;
        }
        // distance should be bigger than 0
        for (var i = 0; i < distanceConstrainLength; i++) {
            tempAMat[constrainIndex + 1] = generate1V(varNum, n2 + i + 1, false);
            BVec[constrainIndex + 1] = 0.1;
            constrainIndex++;
        }
        var startBoundingIndex = constrainIndex + 1;
        // site should in bounding box
        for (var i = 0; i < n; i++) {
            var site = sites[i];
            var boundaryInfo = this.site2Region.get(site);
            //console.log(boundaryInfo[0][0].toFixed(2));
            //console.log(site.x.toFixed(2));
            //console.log(boundaryInfo[1][0].toFixed(2));
            //console.log("-----------------------");
            //console.log(boundaryInfo[0][1].toFixed(2));
            //console.log(site.y.toFixed(2));
            //console.log(boundaryInfo[1][1].toFixed(2));
            //console.log("+++++++++++++++++++++++");
            var bcs = this.getBoundaryConstrain(varNum, n2, i, boundaryInfo);
            for (var j = 0; j < bcs.length; j++) {
                var bc = bcs[j];
                tempAMat[constrainIndex + 1] = bc[0];
                BVec[constrainIndex + 1] = bc[1];
                constrainIndex++;
            }
        }
        // add site leader margin to constrain
        for (var i = 0; i < avoidSiteIndice.length; i++) {
            var avoidSiteIndex = avoidSiteIndice[i];
            var varIndex = n2 + n + i;
            if (this.bm.direction == Direction.Right) {
                if (isTrue) {
                    // change smaller than y
                    var relatedConstrainIndex = startBoundingIndex + avoidSiteIndex * 4 + 3;
                    tempAMat[relatedConstrainIndex][varIndex] = -1;
                }
                else {
                    // change bigger than y
                    var relatedConstrainIndex = startBoundingIndex + avoidSiteIndex * 4 + 2;
                    tempAMat[relatedConstrainIndex][varIndex] = -1;
                }
            }
            else if (this.bm.direction == Direction.Up) {
                if (isTrue) {
                    // change smaller than y
                    var relatedConstrainIndex = startBoundingIndex + avoidSiteIndex * 4;
                    tempAMat[relatedConstrainIndex][varIndex] = -1;
                }
                else {
                    // change bigger than y
                    var relatedConstrainIndex = startBoundingIndex + avoidSiteIndex * 4 + 1;
                    tempAMat[relatedConstrainIndex][varIndex] = -1;
                }
            }
        }
        // distance should be bigger than 0
        for (var i = 0; i < avoidN; i++) {
            tempAMat[constrainIndex + 1] = generate1V(varNum, n2 + n + i, false);
            BVec[constrainIndex + 1] = 1;
            constrainIndex++;
        }
        var AMat = transpose2DArray(tempAMat);
        //dump2DArray(DMat);
        var result = solveQP(DMat, DVec, AMat, BVec);
        var solution = result.solution;
        var origin = [];
        var after = [];
        for (var i = 0; i < sites.length; i++) {
            if (i < sites.length - 1) {
                origin.push(disParameters[0] * sites[i].x +
                    disParameters[1] * sites[i].y +
                    disParameters[2] * sites[i + 1].x +
                    disParameters[3] * sites[i + 1].y);
            }
            sites[i].x = solution[i * 2 + 1];
            sites[i].y = solution[i * 2 + 2];
            if (i > 0) {
                after.push(disParameters[0] * sites[i - 1].x +
                    disParameters[1] * sites[i - 1].y +
                    disParameters[2] * sites[i].x +
                    disParameters[3] * sites[i].y);
            }
            this.updateSite(sites[i]);
        }
        //this.bm.reRouteDO(this.leaderInfo);
        //for(var i = 0; i < origin.length; i++){
        //    console.log(origin[i]);
        //    console.log(after[i]);
        //    console.log("");
        //}
        //
        //
        //console.log(result);
        //console.log(result.value[1]);
    };
    // index start from 0
    LeaderOptimizer.prototype.getMatrixForDistance = function (totalL, length, index, parameters) {
        var result = [];
        for (var i = 1; i < totalL + 1; i++) {
            result[i] = [];
            for (var j = 1; j < totalL + 1; j++) {
                result[i][j] = 0;
            }
        }
        var startIndex = index * 2 + 1;
        var x0Index = startIndex;
        var y0Index = startIndex + 1;
        var x1Index = startIndex + 2;
        var y1Index = startIndex + 3;
        var dIndex = length + index + 1;
        var a0 = parameters[0];
        var a1 = parameters[1];
        var a2 = parameters[2];
        var a3 = parameters[3];
        // self Quadratic
        result[x0Index][x0Index] = a0 * a0;
        result[y0Index][y0Index] = a1 * a1;
        result[x1Index][x1Index] = a2 * a2;
        result[y1Index][y1Index] = a3 * a3;
        result[dIndex][dIndex] = this.dFactor * this.dFactor;
        // Quadratic between variables
        //result[x0Index][y0Index] = 2 * a0 * a1;
        //result[x0Index][x1Index] = 2 * a0 * a2;
        //result[x0Index][y1Index] = 2 * a0 * a3;
        //result[x0Index][dIndex] = -2 * a0 * this.dFactor;
        //
        //result[y0Index][x1Index] = 2 * a1 * a2;
        //result[y0Index][y1Index] = 2 * a1 * a3;
        //result[y0Index][dIndex] = -2 * a1 * this.dFactor;
        //
        //result[x1Index][y1Index] = 2 * a2 * a3;
        //result[x1Index][dIndex] = -2 * a2 * this.dFactor;
        //
        //result[y1Index][dIndex] = -2 * a3 * this.dFactor;
        result[y0Index][x0Index] = 2 * a0 * a1;
        result[x1Index][x0Index] = 2 * a0 * a2;
        result[y1Index][x0Index] = 2 * a0 * a3;
        result[dIndex][x0Index] = -2 * a0 * this.dFactor;
        result[x1Index][y0Index] = 2 * a1 * a2;
        result[y1Index][y0Index] = 2 * a1 * a3;
        result[dIndex][y0Index] = -2 * a1 * this.dFactor;
        result[y1Index][x1Index] = 2 * a2 * a3;
        result[dIndex][x1Index] = -2 * a2 * this.dFactor;
        result[dIndex][y1Index] = -2 * a3 * this.dFactor;
        return result;
    };
    LeaderOptimizer.prototype.getBoundaryConstrain = function (totalL, length, index, boundaryInfo) {
        // boundary do not constrain the distance
        var fr = [];
        fr[0] = generate1V(totalL, index * 2 + 1, false);
        fr[1] = generate1V(totalL, index * 2 + 1, true);
        fr[2] = generate1V(totalL, index * 2 + 2, false);
        fr[3] = generate1V(totalL, index * 2 + 2, true);
        //result[index*2+1] = boundaryInfo[0][0];
        //result[index*2+1+1] = y0;
        var b = [];
        b[0] = boundaryInfo[0][0];
        b[1] = -boundaryInfo[1][0];
        b[2] = boundaryInfo[0][1];
        b[3] = -boundaryInfo[1][1];
        return [
            [fr[0], b[0]],
            [fr[1], b[1]],
            [fr[2], b[2]],
            [fr[3], b[3]]
        ];
    };
    LeaderOptimizer.prototype.getDistanceConstrain = function (totalL, length, index, parameters) {
        var result = [];
        for (var i = 1; i < totalL + 1; i++) {
            result[i] = 0;
        }
        // Margin variable
        result[length + index + 1] = -this.dFactor;
        result[index * 2 + 1] = parameters[0];
        result[index * 2 + 2] = parameters[1];
        result[index * 2 + 3] = parameters[2];
        result[index * 2 + 4] = parameters[3];
        return [result, 0];
    };
    LeaderOptimizer.prototype.updateSite = function (site) {
        var label = (this.leaderInfo.site2Leader.get(site)).label;
        var newLeader = this.bm.getLeader(site, label);
        this.leaderInfo.updateEntry(site, label, newLeader);
    };
    return LeaderOptimizer;
}());
function getMarginParameters(k, dir, isTrue) {
    var result = [];
    if (dir == Direction.Right) {
        if (isTrue) {
            result[0] = k;
            result[1] = 1;
            result[2] = -k;
            result[3] = -1;
        }
        else {
            result[0] = k;
            result[1] = -1;
            result[2] = -k;
            result[3] = 1;
        }
    }
    else if (dir == Direction.Up) {
        if (isTrue) {
            result[0] = -1;
            result[1] = -k;
            result[2] = 1;
            result[3] = k;
        }
        else {
            result[0] = 1;
            result[1] = -k;
            result[2] = -1;
            result[3] = k;
        }
    }
    return result;
}
function dump2DArray(data) {
    for (var i = 1; i < data.length; i++) {
        var sub = data[i];
        var s = "";
        for (var j = 1; j < sub.length; j++) {
            s += sub[j].toFixed(1);
            s += '\t';
        }
        console.log(s);
    }
}
function transpose2DArray(data) {
    var result = [];
    var length = data.length;
    for (var i = 1; i < length; i++) {
        var sub = data[i];
        for (var j = 1; j < sub.length; j++) {
            if (!result[j]) {
                result[j] = [];
            }
            result[j][i] = sub[j];
        }
    }
    return result;
}
function addMatrix(base, plus) {
    for (var i = 1; i < base.length; i++) {
        var sub = base[i];
        for (var j = 1; j < sub.length; j++) {
            sub[j] += plus[i][j];
        }
    }
}
function generate1V(l, position, isNegative) {
    var result = [];
    for (var i = 1; i < l + 1; i++) {
        result[i] = 0;
    }
    if (isNegative) {
        result[position] = -1;
    }
    else {
        result[position] = 1;
    }
    return result;
}
//# sourceMappingURL=LeaderOptimizer.js.map