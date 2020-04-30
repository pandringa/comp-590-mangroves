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

var YEAR = 2019
var image = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')
  .filterDate(YEAR+'-01-01', YEAR+'-12-31')
  .map(maskClouds)
  .median()
  .select(opticalBands)
  .float();

var shape = ee.FeatureCollection('users/pandringa/caribbean_mangroves_union_2016');
var mangroveMask = new ee.Image(0).byte().paint(shape, 1);
// Map.addLayer(mangroveMask.updateMask(mangroveMask), {palette: ['99FF99', '22FF22'], min: 0, max: 1}, "mangroves");

var predictor = ee.Model.fromAiPlatformPredictor({
    projectName: 'mangrove-ml',
    modelName: 'mangroves_predictor',
    version: 'v1',
    inputTileSize: [144, 144],
    inputOverlapSize: [8, 8],
    proj: ee.Projection('EPSG:4326').atScale(30),
    fixInputProj: true,
    inputShapes: {
      'array': [144, 144, opticalBands.length]
    },
    outputBands: {'impervious': {
        'type': ee.PixelType.float()
      }
    }
})
var predictions = predictor.predictImage(image.toArray()).updateMask(mangroveMask)

// Map.addLayer(predictions.updateMask(predictions), {min: 0, max: 1}, "predictions")
Export.image.toAsset({
  image: predictions,
  assetId: "users/pandringa/final_model_predictions_costa_rica_2019",
  description: "model_caribbean_predictions_cr19",
  region: costa_rica,
  scale: 30,
  maxPixels: 1e13
});


