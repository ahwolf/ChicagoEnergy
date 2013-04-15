# standard library
import os
import sys
import ConfigParser

# 3rd party
from osgeo import ogr
from rtree.index import Index
from shapely.wkb import loads

COLORS = [
    '#FFFFB2',
    '#FECC5C',
    '#FD8D3C',
    '#F03B20',
    '#BD0026',
]

SIMPLE_HEADER = [
    'census_block_2010',
    'subtype',
    'age_quintile',
    'kwh',
    'kwh/sqft',
    'therms',
    'therms/sqft',
]

NICE_NAMES = {
    None: 'all',
    'Multi < 7': 'small',
    'Single Family': 'sfh',
    'Multi 7+': 'large',
    '0': '0',
    '1': '1',
    '2': '2',
    '3': '3',
    '4': '4',
}

def create_quantiles(decorated_list, n_groups, reverse=False):
    result = {}
    decorated_list.sort(reverse=reverse)
    for index, (value, key) in enumerate(decorated_list):
        result[key] = index / ((len(decorated_list)+1) / n_groups)
    return result

def tonumber(value, totype=float, default=0.0):
    try:
        return totype(value)
    except ValueError:
        return totype(default)

def get_api_key(group, name, conf=None):
    if conf is None:
        api_conf = os.path.expanduser('~/.api.conf')
        if os.path.isfile(api_conf):
            conf = api_conf
        else:
            message = 'no filename given to read api key'
            raise ValueError(message)
    config = ConfigParser.ConfigParser()
    config.read(conf)
    return config.get(group, name)

def read_shapefile(shape_filename, block_set=None, id_fieldname="BLKIDFP00",
                   size=512, simplification=0.0001):
    # get the first layer of shapefile
    print >> sys.stderr, "Reading '%s'..." % (shape_filename),
    datasource = ogr.Open(shape_filename)
    layer = datasource.GetLayer(0)

    shape_dict = {}
    xmin_list, xmax_list = [], []
    ymin_list, ymax_list = [], []
    for index, feature in enumerate(layer):

        # get the id from the shapefile
        geoid = feature.GetField(id_fieldname)

        # if the id of this feature is not in the spreadsheet, skip it
        if (block_set is not None) and (not geoid in block_set):
            continue

        # convert to a shapely object
        geom = feature.geometry()
        shape = loads(geom.ExportToWkb())
        if simplification:
            shape = shape.simplify(simplification, preserve_topology=True)

        # for now, ignore the 7 blocks that have multi-geometries
        try:
            x_list, y_list = shape.boundary.coords.xy
        except NotImplementedError:
            continue

        # add to dictionary to return
        shape_dict[geoid] = shape

        # keep track of the boundaries
        xmin_list.append(min(x_list))
        xmax_list.append(max(x_list))
        ymin_list.append(min(y_list))
        ymax_list.append(max(y_list))

    # get the max of the max, min of the min
    xmin, xmax = min(xmin_list), max(xmax_list)
    ymin, ymax = min(ymin_list), max(ymax_list)

    # calculate how to rescale (but preserve aspect ratio)
    y_range = ymax - ymin
    x_range = xmax - xmin
    if x_range > y_range:
        scale = float(size) / x_range
        ymin = ymin + 0.5 * y_range * (1 - abs(y_range / x_range))
    else:
        scale = float(size) / y_range
        xmin = xmin - 0.5 * x_range * (1 - abs(x_range / y_range))

    # make functions that map original coordinates to output range
    def x_transform(x_old):
        return (x_old - xmin) * scale

    def y_transform(y_old):
        return float(size) - (y_old - ymin) * scale

    print >> sys.stderr, "done."

    return shape_dict

def create_spatial_index(shape_dict):
    print >> sys.stderr, 'Making spatial index...',
    spatial_index = Index()
    for index, (blockid, shape) in enumerate(shape_dict.iteritems()):
        spatial_index.insert(index, shape.bounds, obj=blockid)
    print >> sys.stderr, 'done.'
    return spatial_index

def aggregate_metrics(
        aggregate_shape_dict,
        raw_shape_dict,
        raw_spatial_index,
        metric_dict={},
        TOLERANCE=1e-6,
    ):

    # Aggregate the census block info up to the ward -> create an rtree
    aggregate_results = {}

    # loop through the zoom_level and check matching census blocks 
    for i, (aggregate_id, aggregate_shape) in \
            enumerate(aggregate_shape_dict.iteritems(), 1):

        # print out a nice message to know how it's going
        print >> sys.stderr, 'Aggregating %i of %i' % \
            (i, len(aggregate_shape_dict))

        # find all intersecting 2000 census blocks, along with the
        # fraction of the 2010 census block that will be assigned to
        # the 2000 census block
        # print dir(raw_spatial_index.intersection(aggregate_shape.bounds,
        #                                                 objects=True)).__sizeof__()
        print aggregate_id
        # for item_2000 in raw_spatial_index.intersection(aggregate_shape.bounds,
        #                                                 objects=True):


            # # get the id from the rtree object
            # raw_id = item_2000.object

            # # get the shape from the shape dictionary
            # raw_shape = raw_shape_dict[raw_id]

            # # calculate the intersection of the polygons
            # intersection = raw_shape.intersection(aggregate_shape)

            # # calculate the fraction of the area of the raw shape that
            # # belongs to the aggregate shape
            # frac_raw = float(intersection.area) / raw_shape.area

            # # if there is any area above tolerance, then add it up
            # if frac_raw >= (0.0 + TOLERANCE):

            #     # if this hasn't already been added up for this aggregate,
            #     # then start at zero
            #     if not aggregate_results.has_key(aggregate_id):
            #         aggregate_results[aggregate_id] = [0.0, 0.0, 0.0]

            #     # look up the metrics for the raw shape, and use zeroes if
            #     # it isn't in the metrics dictionary
            #     try:
            #         raw_metrics = metric_dict[raw_id]
            #     except KeyError:
            #         raw_metrics = [0.0, 0.0, 0.0]

            #     # increment each metric
            #     for i in range(3):
            #         aggregate_results[aggregate_id][i] += \
            #             (raw_metrics[i] * frac_raw)

    # return the dictionary, keyed by ID of aggregate data
    return aggregate_results

def write_json(metric_dict, filename):
    pass
