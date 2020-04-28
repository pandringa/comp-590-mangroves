var CARIBBEAN_GEO = 
    /* color: #98ff00 */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[-117, 32],
          [-117, 0],
          [-53, 0],
          [-53, 32]]]);

var years = [2016, 2015, 2010, 2009, 2008, 2007];

var toFeature = function(g){ return ee.Feature(ee.Geometry(g), {'pxlval': 1}) };
var addBuffer = function(m){ return function(f){return f.buffer(m)} };
var setArea = function(f){ return ee.Feature(f).set({ 'AREA': ee.Feature(f).geometry().area() }) }

for(var i=0; i < years.length; i++){
  var YEAR = years[i];
  var mangroves = ee.FeatureCollection("users/pandringa/gmw_"+YEAR);

  var train_or_test = ee.FeatureCollection(ee.List(mangroves
    .filterBounds(CARIBBEAN_GEO)
    .map(addBuffer(1000))
    .map(setArea)
    .union().first()
    .geometry().geometries()
    .map(toFeature)
    .reduce(ee.Reducer.toList()))
  ).randomColumn();

  var train = train_or_test.filter(ee.Filter.lt("random", 0.7));
  var test = train_or_test.filter(ee.Filter.gte("random", 0.7));

  Export.table.toAsset({
    collection: train,
    description: "gmw_"+YEAR+"_samples_train",
    assetId: "caribbean_training_"+YEAR
  });

  Export.table.toAsset({
    collection: test,
    description: "gmw_"+YEAR+"_samples_test",
    assetId: "caribbean_testing_"+YEAR
  });
}


