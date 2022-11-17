/**
 * Created by yalong on 5/26/15.
 */
var GeoInfoHelper = (function () {
    function GeoInfoHelper(geoData) {
        this.data = geoData;
        this.names = Object.keys(geoData);
    }
    GeoInfoHelper.prototype.getGeo = function (name) {
        return this.data[name];
    };
    return GeoInfoHelper;
}());
//var test = new GeoInfoHelper('./data/StatesGeo.json', function(g: GeoInfoHelper){
//    console.log(g.getGeo("Kentucky"));
//}); 
//# sourceMappingURL=GeoInfoHelper.js.map