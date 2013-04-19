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
                                                shape = json.dumps(list(aggregate_shape.exterior.coords)))

                    # for census_block in census_blocks:

                        # census_block.update(neighborhood = neighborhood,
                        #                     shape = json.dumps(list(aggregate_shape.exterior.coords)))

                        # census_block.neighborhood = neighborhood
                        # census_block.shape = json.dumps(list(aggregate_shape.exterior.coords))
                        # census_block.save()

                    neighborhood_count += 1
 
                    # total_kwh = census_block.total_kwh * frac_raw
                    # total_therm = census_block.total_therm * frac_raw
                    # # total_energy = census_block.total_energy * frac_raw

                    # sqft_kwh = census_block.sqft_kwh * frac_raw
                    # sqft_therm = census_block.sqft_therm * frac_raw
                    # total_sqft = census_block.total_sqft * frac_raw

                    # # if this hasn't already been added up for this aggregate,
                    # # then start at zero

                    # if not aggregate_results.has_key(aggregate_id):
                    #     aggregate_results[raw_id] = {
                            # 'total_kwh': total_kwh,
                            # 'total_therm': total_therm,
                            # # total_energy = total_energy,
                            # 'sqft_kwh': sqft_kwh,
                            # 'sqft_therm': sqft_therm,
                            # 'total_sqft': total_sqft
                    #         }
                    # else:
                    #     aggregate_results[raw_id]['total_kwh'] += total_kwh 
                    #     aggregate_results[raw_id]['total_therm'] += total_therm 
                    #     aggregate_results[raw_id]['total_energy'] += total_energy 

                    #     aggregate_results[raw_id]['sqft_kwh'] += sqft_kwh 
                    #     aggregate_results[raw_id]['sqft_therm'] += sqft_therm 
                    #     aggregate_results[raw_id]['total_sqft'] += total_sqft 

                # # look up the metrics for the raw shape, and use zeroes if
                # # it isn't in the metrics dictionary
                # try:
                #     raw_metrics = metric_dict[raw_id]
                # except KeyError:
                #     raw_metrics = [0.0, 0.0, 0.0]

                # # increment each metric
                # for i in range(3):
                #     aggregate_results[aggregate_id][i] += \
                #         (raw_metrics[i] * frac_raw)




            #     if i > 1:
            #         print i, item_2010.object, aggregate_id
            #     # try:
                #     total[item_2010.object] += 1
                # except KeyError:
                #     total[item_2010.object] = 1
                # try:
                #     census_blocks = CensusBlocks.objects.filter(census_id=item_2010.object)
                # except CensusBlocks.DoesNotExist:
                #     print item_2010.object
                #     continue
                # for census_block in census_blocks:
                #     census_block.neighborhood = neighborhood
                #     census_block.save()






        # # Aggregate the values to find the efficiency of the Neighborhoods
        # neighborhoods = Neighborhoods.objects.all()
        # with open(STATIC_ROOT + '/main/neighborhood.json', 'r') as infile:
        #     print "hello"
        #     shapes = json.load(infile)


        #     neighborhoods = Neighborhoods.objects.all()
        #     print Neighborhoods.objects.all().count()
        #     for neighborhood in neighborhoods:
        #         print neighborhood.name

        #     print len(shapes['features'])

        #     for shape in shapes['features']:
        #         neighborhood = Neighborhoods.objects.filter(name=shape['id'])
        #         if len(neighborhood) == 0:
        #             print(shape['id'])

