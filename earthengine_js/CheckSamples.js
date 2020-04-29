var mangroves = ee.FeatureCollection("users/pandringa/gmw_2007");
Map.addLayer(mangroves, {color: '000000'}, "mangroves");

var TOTAL_SIZE = 14000;

var TRAIN_COUNT = 0.7 * TOTAL_SIZE;
var trainArea = 89270.36002295984 * 1e6;
var training_area = ee.FeatureCollection("users/andreagonzales/caribbean_train_areas_2007");
print("training", ui.Chart.feature.histogram(training_area, "AREA"))
print("training min/max", training_area.reduceColumns(ee.Reducer.minMax(), ["AREA"]))
print("Training points under size:", training_area.filter(ee.Filter.lt("AREA", (1/TRAIN_COUNT) * trainArea)).size())
print("Training points over size:", training_area.filter(ee.Filter.gt("AREA", (195/TRAIN_COUNT) * trainArea)).size())
print("Training points over 2x size:", training_area.filter(ee.Filter.gt("AREA", 2 * (195/TRAIN_COUNT) * trainArea)).size())
print("Training points over 3x size:", training_area.filter(ee.Filter.gt("AREA", 2 * (195/TRAIN_COUNT) * trainArea)).size())

var TEST_COUNT = 0.3 * TOTAL_SIZE;
var testArea = 33416.285847423576 * 1e6;
var testing_area = ee.FeatureCollection("users/andreagonzales/caribbean_test_areas_2007");
print("testing", ui.Chart.feature.histogram(testing_area, "AREA"));
print("testing min/max", testing_area.reduceColumns(ee.Reducer.minMax(), ["AREA"]))
print("Testing points under size:", training_area.filter(ee.Filter.lt("AREA", (1/TEST_COUNT) * testArea)).size())
print("Testing points over size:", training_area.filter(ee.Filter.gt("AREA", (195/TEST_COUNT) * testArea)).size())
print("Testing points over 2x size:", training_area.filter(ee.Filter.gt("AREA", 2 * (195/TEST_COUNT) * testArea)).size())
print("Testing points over 3x size:", training_area.filter(ee.Filter.gt("AREA", 2 * (195/TEST_COUNT) * testArea)).size())

var train_points = ee.FeatureCollection("users/pandringa/test_train_area_sample");
print("Train samples", train_points.size());

var test_points = ee.FeatureCollection("users/pandringa/test_eval_area_sample");
print("Eval samples", test_points.size());

Map.addLayer(training_area, {color: 'FF5555'}, "training area");
Map.addLayer(train_points, {color: 'FF0000'}, "training samples");

Map.addLayer(testing_area, {color: '5555FF'}, "testing area");
Map.addLayer(test_points, {color: '0000FF'}, "testing samples");