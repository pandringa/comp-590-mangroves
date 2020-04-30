var panama_city = 
    /* color: #b94444 */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[-81.9406024099474, 9.634335147058547],
          [-81.9406024099474, 7.1673967512291235],
          [-79.3917742849474, 7.1673967512291235],
          [-79.3917742849474, 9.634335147058547]]], null, false),
    costa_rica = 
    /* color: #d63000 */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[-85.76142594735113, 10.788598674810393],
          [-85.72846696297613, 10.64826826510741],
          [-85.86030290047613, 10.605076632983748],
          [-85.87128922860113, 10.01058363425571],
          [-85.14619157235113, 9.480023700661231],
          [-84.93745133797613, 9.685850985223768],
          [-84.73969743172613, 9.599202089022581],
          [-83.67402360360113, 8.970346670767807],
          [-83.81684586922613, 8.525148131877797],
          [-82.88300797860113, 8.046797290019212],
          [-83.02583024422613, 8.329529569369285],
          [-82.80610368172613, 8.459952952528822],
          [-82.93793961922613, 8.785816842891018],
          [-82.70722672860113, 8.937789343784477],
          [-82.93793961922613, 9.100546675686568],
          [-82.93793961922613, 9.436675811729556],
          [-82.85004899422613, 9.620866398800096],
          [-82.66328141610113, 9.480023700661231],
          [-82.56440446297613, 9.577536393773666],
          [-83.67692015217513, 10.95060893139355],
          [-83.66868040608138, 10.810354208798493],
          [-83.87192747639388, 10.718613684754791],
          [-84.02024290608138, 10.772582081856763],
          [-84.10264036701888, 10.764487437639806],
          [-84.36081907795638, 10.993750909979108],
          [-84.68216917561263, 11.085406634790713],
          [-84.91837523030013, 10.945215741587166],
          [-85.60502073811263, 11.222836305098825],
          [-86.03781948005137, 10.877434114738056]]]),
    puerto_jiminez = 
    /* color: #98ff00 */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[-83.86332831505052, 9.267295185967846],
          [-83.86332831505052, 8.03455825553625],
          [-82.17692694786302, 8.03455825553625],
          [-82.17692694786302, 9.267295185967846]]]);

// CUSTOMIZABLE VARIABLES:
var region = costa_rica;
var YEAR = 2016;
var PREDICTION_ASSET = 'users/pandringa/costa_rica_'+YEAR;
var TRUTH_SHAPEFILE = 'users/pandringa/gmw_'+YEAR; // Set to false if no truth to compare against
var DEFAULT_SPLIT = false; // set to a number like 0.5 if TRUTH_SHAPEFILE is false

var reducerOpts = {
  reducer: ee.Reducer.count(),
  geometry: region,
  scale: 30,
  maxPixels: 1e13
};

var opticalBands = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7'];
function maskClouds(image){
  var cloudShadowBitMask = ee.Number(2).pow(3).int();
  var cloudsBitMask = ee.Number(2).pow(5).int();
  var qa = image.select('pixel_qa');
  var mask1 = qa.bitwiseAnd(cloudShadowBitMask).eq(0).and(
    qa.bitwiseAnd(cloudsBitMask).eq(0));
  var mask2 = image.mask().reduce('min');
  var mask3 = image.select(opticalBands).gt(0).and(
          image.select(opticalBands).lt(10000)).reduce('min');
  var mask = mask1.and(mask2).and(mask3);
  return image.select(opticalBands).divide(10000).updateMask(mask);
}

var landsat = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')
  .filterDate(YEAR+'-01-01', YEAR+'-12-31')
  .map(maskClouds)
  .median();
Map.addLayer(landsat, {bands: ['B3', 'B2', 'B1'], min: 0, max: 0.1}, "landsat");

function findPartition(truth, prediction){
  var results = [];
  for(var i=0.2; i<=0.8; i += 0.02){
    var predict = prediction.select("impervious").gt(i);
    var true_pos = predict.mask(truth.neq(0).and(predict)).reduceRegion(reducerOpts).get('impervious');
    var false_pos = predict.mask(truth.eq(0).and(predict)).reduceRegion(reducerOpts).get('impervious');
    var false_neg = mangrove_img.mask(truth.neq(0).and(predict.eq(0))).reduceRegion(reducerOpts).get('constant');
    
    var precision = ee.Number(true_pos).divide( ee.Number(true_pos).add(false_pos) );
    var recall = ee.Number(true_pos).divide( ee.Number(true_pos).add(false_neg) );
    
    results.push(ee.Dictionary({
      i: i,
      true_pos: true_pos,
      false_pos: false_pos,
      false_neg: false_neg,
      precision: precision,
      recall: recall
    }));
  }

  results = results.map(function(r){ 
    return ee.Dictionary(r).set('sum', ee.Number(r.get('precision')).multiply(r.get('recall')));
  });

  return ee.Dictionary(ee.List(results).iterate(function(val, max){
    max = ee.Dictionary(max);
    val = ee.Dictionary(val);
    return ee.Algorithms.If(ee.Number(max.get('sum')).lt(val.get('sum')), val, max);
  }, {sum: 0}));
}

var mangrove_prediction = ee.Image(PREDICTION_ASSET);
if(TRUTH_SHAPEFILE){
  var mangroves = ee.FeatureCollection(TRUTH_SHAPEFILE);
  var mangrove_img = ee.Image(0).byte().paint(mangroves, 1).clip(region);
  var total_area = mangrove_img.updateMask(mangrove_img).reduceRegion(reducerOpts).get('constant');

  var min = findPartition(mangrove_img, mangrove_prediction);
  print("Best partition is:", min.get('i'));
  print("False positive areas (m^2, %):", min.get('false_pos'), ee.Number(min.get('false_pos')).divide(total_area).multiply(100));
  print("False negative areas (m^2, %):", min.get('false_neg'), ee.Number(min.get('false_neg')).divide(total_area).multiply(100));
  print("Precision:", min.get('precision'))
  print("Recall:", min.get('recall'))

  min.get('i').getInfo(function(split){
    mangrove_prediction = mangrove_prediction.select("impervious").gt(DEFAULT_SPLIT || split);
  
    print("Total area is (m^2):", mangrove_prediction.updateMask(mangrove_prediction).reduceRegion(reducerOpts).get('impervious'));
    print("Truth (GMW) area is (m^2):", total_area);  
  
    var mangrove_false_pos = mangrove_prediction.mask(mangrove_img.eq(0).and(mangrove_prediction));
    var mangrove_false_neg = mangrove_img.mask(mangrove_img.neq(0).and(mangrove_prediction.eq(0)));

    Map.addLayer(mangrove_false_pos, {palette: ['FFAAAA', 'FF0000']}, "false positive");
    Map.addLayer(mangrove_false_neg, {palette: ['5555FF', '0000FF']}, "false negative");
    Map.addLayer(mangrove_img.updateMask(mangrove_img).clip(region), {palette: ['333333', '000000']}, "true mangroves");
    Map.addLayer(mangrove_prediction.mask(mangrove_prediction), {}, "prediction");
  });
}else{
  if(DEFAULT_SPLIT === false){
    print("ERROR: You need to set DEFAULT_SPLIT if TRUTH_SHAPEFILE is false.");
  }
  
  mangrove_prediction = mangrove_prediction.select("impervious").gt(DEFAULT_SPLIT);
  mangrove_prediction = mangrove_prediction.updateMask(mangrove_prediction);
  print("Total area is (m^2):", mangrove_prediction.reduceRegion(reducerOpts).get('impervious'));
  Map.addLayer(mangrove_prediction, {palette: ['FF9999', 'FF3333'], min: DEFAULT_SPLIT, max: 1}, "prediction");
}

