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
* Uploads shapefile maps from the Global Mangrove Watch to Earth Engine assets
* Converts OCO2 satellite data from NetCDF files into CSV, and uploads them to EarthEngine as point shapes
* Rasterizes OCO2 data into EarthEngine raster files. (Operations timed out — only works on smaller regions.)

### Preparing model datasets
* Builds lists of testing and training geographies, adding a 1km buffer to each one
* Downloads Landsat 7 imagery, creates cloud-free composites, then picks samples from each composite, uploading them to [Google Cloud Storage](https://cloud.google.com/storage) as `.tfrecord` files.

### Training models
* Builds a micro UNET model capable of being run inside Google Colab, for crude hyperparemeter tuning and faster iteration
* Builds a full-scale UNET model as a python package and uploads it to [Google AI Platform](https://cloud.google.com/ai-platform) for training.

### Using models for prediction
* Runs small-scale predictions from a saved TensorFlow model, to quickly test results and iterate
* Converts a Google AI Platform model into a format usable by EarthEngine, and runs a larger prediction on that model to create regional maps

### Other assorted scripts
* `[LandsatTest.py](https://github.com/pandringa/comp-590-mangroves/master/blob/notebooks/LandsatTest.py)` Experiments with loading Landsat data into xarray, before we switched to EarthEngine.
