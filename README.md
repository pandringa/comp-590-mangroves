# COMP 590 Mangrove Mapping Model

This repo contains all the various Jupyter notebooks and Google EarthEngine scripts our group used to create a predictive model to map mangrove populations.

Initially, our plan was to create a worldwide model and create full-earth maps — but processing-power and time/money constraints forced us to only focus on one region, the Caribbean.

Even so, the algoritms (and models) in this repo _should_ be generalizable, if you wanted to map mangroves in another region instead of the Caribbean.

For more background on this project and a throrough discussion of our results, take a look at [the paper](#) (link TK).

## Code

The scripts listed below are grouped into a few broad categories. Some are one-offs, while others were executed in order (and only separated to keep files to a managable size.) 

Additionally, some of the constants were tweaked for multiple runs, e.g. to test out different hyperparameters.

Jupyter notebooks were run in [Google Colab](https://colab.research.google.com), while Javascript files were run in the [Earth Engine Console](code.earthengine.google.com).

### Uploading Assets to Earth Engine
This initial step was mostly done from the command line, using shapefile maps of mangroves from the [Global Mangrove Watch](https://data.unep-wcmc.org/datasets/45).

```bash
## Move downloaded files into Google Cloud Storage
gsutil mv ~/Downloads/gmw_*_v2.shp gs://mangrove-models/

## Import Google Cloud Storage assets into EarthEngine
earthengine upload table --asset_id=users/pandringa/gmw_2007 gs://mangrove-models/gmw_2009/GMW_2007_v2.shp
earthengine upload table --asset_id=users/pandringa/gmw_2008 gs://mangrove-models/gmw_2009/GMW_2008_v2.shp
...
```

See the "assorted notebooks" section for some attempts at uploading OCO2 data into EarthEngine, which we ended up aborting when rasterization didn't work.

### Preparing model datasets
* [`BuildSampleRegions.js`](https://github.com/pandringa/comp-590-mangroves/master/blob/earthengine_js/BuildSampleRegions.js) Builds list of testing and training regions based on the Global Mangrove Watch maps, adding a 1km buffer then randomly choosing 70% of polygons for training and 30% for evaluation.
* [`TakeSamples.ipynb`](https://github.com/pandringa/comp-590-mangroves/master/blob/notebooks/TakeSamples.ipynb) A version of an [EarthEngine tutorial notebook](https://github.com/google/earthengine-api/blob/master/python/examples/ipynb/UNET_regression_demo.ipynb) which downloads Landsat 7 imagery, creates cloud-free composites, then picks samples of the composite from the pre-defined mangrove regions, uploading them to [Google Cloud Storage](https://cloud.google.com/storage) as `.tfrecord` files.

### Training models
* Builds a micro UNET model capable of being run inside Google Colab, for crude hyperparemeter tuning and faster iteration
* Builds a full-scale UNET model as a python package and uploads it to [Google AI Platform](https://cloud.google.com/ai-platform) for training.

### Using models for prediction
* Runs small-scale predictions from a saved TensorFlow model, to quickly test results and iterate
* Converts a Google AI Platform model into a format usable by EarthEngine, and runs a larger prediction on that model to create regional maps

### Other assorted scripts
* [`LandsatTest.ipynb`](https://github.com/pandringa/comp-590-mangroves/master/blob/notebooks/LandsatTest.ipynb) Experiments with loading Landsat data into xarray, before we switched to EarthEngine.
* [`EarthEngineTest.ipynb`](https://github.com/pandringa/comp-590-mangroves/master/blob/notebooks/EarthEngineTest.ipynb) Experiments with rendering EarthEngine maps in Python notebooks, using a different mangrove dataset we eventually abandoned.
* [`NC4_CSV.ipynb`](https://github.com/pandringa/comp-590-mangroves/master/blob/notebooks/NC4_CSV.ipynb) A notebook for converting NetCDF files into CSV, for uploading into EarthEngine tables.
* [`OCO2.ipynb`](https://github.com/pandringa/comp-590-mangroves/master/blob/notebooks/OCO2.ipynb) A notebook that attempted to convert the OCO2 files from NetCDF into Shapefiles, which was abandoned when CSV exports turned out to be faster and smaller.
* [`NDVI_Model.ipynb`]((https://github.com/pandringa/comp-590-mangroves/master/blob/notebooks/NDVI_Model.ipynb) An earlier attempt to start a model based on the NDVI, which was aborted in favor of the UNET self-learning model.
