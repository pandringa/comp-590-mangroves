// CUSTOMIZABLE VARIABLES:
var PREDICTION_ASSET = 'users/pandringa/panama_city_2016';
var TRUTH_SHAPEFILE = 'users/pandringa/gmw_2016'; // Set to false if no truth to compare against
var DEFAULT_SPLIT = false; // set to a number like 0.5 if TRUTH_SHAPEFILE is false


var reducerOpts = {
  reducer: ee.Reducer.count(),
  geometry: example_region,
  scale: 30,
  maxPixels: 1e13
};

function findPartition(truth, prediction){
  var results = [];
  for(var i=0.2; i<=0.8; i += 0.05){
    var predict = prediction.select("impervious").gt(i);
    var false_pos = predict.mask(truth.eq(0).and(predict));
    var false_neg = mangrove_img.mask(truth.neq(0).and(predict.eq(0)));
    results.push(ee.Dictionary({
      i: i,
      false_pos: false_pos.reduceRegion(reducerOpts).get('impervious'),
      false_neg: false_neg.reduceRegion(reducerOpts).get('constant')
    }));
  }

  results = results.map(function(r){ 
    return ee.Dictionary(r).set('sum', ee.Number(r.get('false_pos')).add(r.get('false_neg')));
  });

  return ee.Dictionary(ee.List(results).iterate(function(val, min){
    min = ee.Dictionary(min);
    val = ee.Dictionary(val);
    return ee.Algorithms.If(ee.Number(min.get('sum')).gt(val.get('sum')), val, min);
  }, {sum: 1e12}));
}

var mangrove_prediction = ee.Image(PREDICTION_ASSET);
if(TRUTH_SHAPEFILE){
  var mangroves = ee.FeatureCollection(TRUTH_SHAPEFILE);
  var mangrove_img = ee.Image(0).byte().paint(mangroves, 1).clip(example_region);
  var total_area = mangrove_img.updateMask(mangrove_img).reduceRegion(reducerOpts).get('constant');

  var min = findPartition(mangrove_img, mangrove_prediction);
  print("Best partition is:", min.get('i'));
  print("False positive areas (m^2, %):", min.get('false_pos'), ee.Number(min.get('false_pos')).divide(total_area).multiply(100));
  print("False negative areas (m^2, %):", min.get('false_neg'), ee.Number(min.get('false_neg')).divide(total_area).multiply(100));

  min.get('i').getInfo(function(split){
    mangrove_prediction = mangrove_prediction.select("impervious").gt(split);
  
    print("Total area is (m^2):", mangrove_prediction.updateMask(mangrove_prediction).reduceRegion(reducerOpts).get('impervious'));
    print("Truth (GMW) area is (m^2):", total_area);  
  
    var mangrove_false_pos = mangrove_prediction.mask(mangrove_img.eq(0).and(mangrove_prediction));
    var mangrove_false_neg = mangrove_img.mask(mangrove_img.neq(0).and(mangrove_prediction.eq(0)));

    Map.addLayer(mangrove_false_pos, {palette: ['FFAAAA', 'FF0000']}, "false positive");
    Map.addLayer(mangrove_false_neg, {palette: ['5555FF', '0000FF']}, "false negative");
    Map.addLayer(mangrove_img.updateMask(mangrove_img).clip(example_region), {palette: ['333333', '000000']}, "true mangroves");
    Map.addLayer(mangrove_prediction.mask(mangrove_prediction), {}, "prediction");
  });
}else{
  if(DEFAULT_SPLIT === false){
    print("ERROR: You need to set DEFAULT_SPLIT if TRUTH_SHAPEFILE is false.");
  }
  
  mangrove_prediction = mangrove_prediction.select("impervious").gt(DEFAULT_SPLIT);
  mangrove_prediction = mangrove_prediction.updateMask(mangrove_prediction);
  print("Total area is (m^2):", mangrove_prediction.reduceRegion(reducerOpts).get('impervious'));
  Map.addLayer(mangrove_prediction, {}, "prediction");
}

