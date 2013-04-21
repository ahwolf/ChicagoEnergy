from django.core.management.base import BaseCommand, CommandError
from main.models import CensusBlocks, Neighborhoods, MonthlyEnergy, Pledge
from django.db.models import Sum
from common.conf.settings import STATIC_URL, STATIC_ROOT
from utils import read_shapefile, create_spatial_index, aggregate_metrics, \
    write_json


import os
import sys
import csv
import json
import pickle

from shapely.geometry import asShape
from shapely import wkt

from pprint import pprint

SIMPLIFICATION = .001

# read in boundary info using the utils file read_shapefile
BOUNDARY_DATA = STATIC_ROOT + '/main/'
print BOUNDARY_DATA

class Command(BaseCommand):

    def handle(self, *args, **options):


        CENSUS_BLOCK_2010 = pickle.load(open(BOUNDARY_DATA + "census.p", 'rb')) 

        NEIGHBORHOOD = pickle.load(open(BOUNDARY_DATA + "community.p",'rb'))
        NEIGHBORHOOD_INDEX = create_spatial_index(NEIGHBORHOOD)
        aggregate_results = {}            
        for i, (aggregate_id, aggregate_shape) in \
                enumerate(CENSUS_BLOCK_2010.iteritems(), 1):

            # print out a nice message to know how it's going
            if i % 1000 == 0:
                print >> sys.stderr, 'Aggregating %i of %i' % \
                    (i, len(CENSUS_BLOCK_2010))
        
            # try:
            #     census_blocks = CensusBlocks.objects.filter(census_id=aggregate_id)                                                         
            # except CensusBlocks.DoesNotExist:
            #     continue

            neighborhood_count = 0
            for j,item_2010 in enumerate(NEIGHBORHOOD_INDEX.intersection(aggregate_shape.bounds,
                                                                  objects=True)):

                # get the element id
                raw_id = item_2010.object


                # get the shape from the shape dictionary
                raw_shape = NEIGHBORHOOD[raw_id]

                # calculate the intersection of the polygons
                intersection = aggregate_shape.intersection(raw_shape)

                # calculate the fraction of the area of the aggregate shape that
                # is in the raw shape
                frac_raw = float(intersection.area) / aggregate_shape.area

                # fix rawid in those two cases for mckliney and ohare
                raw_id = raw_id.title()
                if raw_id == 'Mckinley Park':
                    raw_id = 'McKinley Park'
                elif raw_id == 'Ohare':
                    raw_id = "O'hare"
                # if there is any area above tolerance, then add it up
                if frac_raw >= .05 and neighborhood_count == 0:
                    neighborhood, created = Neighborhoods.objects.get_or_create(name = raw_id)

                    Neighborhoods.objects.filter(name = neighborhood.name)\
                                         .update(shape = wkt.dumps(raw_shape))

                                                 #json.dumps(list(raw_shape.exterior.coords)))
                    
                    # neighborhood.shape = json.dumps(list(raw_shape.exterior.coords))

                    # neighborhood.save()

                    CensusBlocks.objects.filter(census_id=aggregate_id)\
                                        .update(neighborhood = neighborhood,
                                                shape = wkt.dumps(aggregate_shape))
                                                #json.dumps(list(aggregate_shape.exterior.coords)))
 
                    neighborhood_count += 1