function maskClouds(image){
  var opticalBands = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7'];
  
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

var YEAR = 2016
var landsat = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR');
var image = landsat.filterDate(YEAR+'-01-01', YEAR+'-12-31').map(maskClouds).median()

var shape = ee.FeatureCollection('users/pandringa/caribbean_mangroves_union_2016');
var mangroveMask = new ee.Image(0).byte().paint(shape, 1);
Map.addLayer(mangroveMask.updateMask(mangroveMask), {}, "mangroves");

var predictor = ee.Model.fromAiPlatformPredictor({
    projectName: 'mangrove-ml',
    modelName: 'mangroves_predictor',
    version: 'v1',
    inputTileSize: [144, 144],
    inputOverlapSize: [8, 8],
    proj: ee.Projection('EPSG:4326').atScale(30),
    fixInputProj: true,
    inputShapes: {
      'array': [144, 144]
    },
    outputBands: {'impervious': {
        'type': ee.PixelType.float()
      }
    }
})
var predictions = predictor.predictImage(image.toFloat().toArray()).updateMask(mangroveMask)

Export.image.toAsset({
  image: predictions,
  assetId: "users/pandringa/final_model_predictions",
  description: "model_caribbean_predictions",
  region: shape.first().geometry().bounds(),
  scale: 30,
  maxPixels: 1e13
});


