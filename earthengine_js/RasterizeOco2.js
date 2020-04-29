var CARIBBEAN_GEO = ee.Geometry.Polygon([[[-117, 32],[-117, 0],[-53, 0],[-53, 32]]]);

var years = [2019, 2018, 2017, 2016, 2015];

for(var i=0; i < years.length; i++){
  var YEAR = years[i];
  
  var oco2 = new ee.FeatureCollection("users/pandringa/oco2_"+YEAR);

  var interpolated = oco2.kriging({
    propertyName: 'xco2',
    shape: 'exponential',
    range: 50 * 1000,
    sill: 1.0,
    nugget: 0.1,
    maxDistance: 50 * 1000,
    reducer: 'mean'
  });

  Export.image.toAsset({
    image: interpolated,
    description: 'OCO2_raster_'+YEAR,
    assetId: 'oco2_'+YEAR+'_raster',
    scale: 60,
    region: CARIBBEAN_GEO,
    pyramidingPolicy: {
     'b4_mean': 'mean',
      'b4_sample': 'sample',
      'b4_max': 'max'
    },
    maxPixels: 1e11
  });
}