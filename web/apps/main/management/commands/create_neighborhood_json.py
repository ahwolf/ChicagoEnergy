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
from pprint import pprint

SIMPLIFICATION = .001

# read in boundary info using the utils file read_shapefile
BOUNDARY_DATA = STATIC_ROOT + '/main/'
print BOUNDARY_DATA

class Command(BaseCommand):

    def handle(self, *args, **options):


        CENSUS_BLOCK_2010 = pickle.load(open(BOUNDARY_DATA + "census.p", 'rb')) 

        NEIGHBORHOOD = pickle.load(open(BOUNDARY_DATA + "neighborhood.p",'rb'))
        NEIGHBORHOOD_INDEX = create_spatial_index(NEIGHBORHOOD)
        total = {}            
        for i, (aggregate_id, aggregate_shape) in \
                enumerate(CENSUS_BLOCK_2010.iteritems(), 1):

            # print out a nice message to know how it's going


            print >> sys.stderr, 'Aggregating %i of %i' % \
                (i, len(CENSUS_BLOCK_2010))

            # find all intersecting 2000 census blocks, along with the
            # fraction of the 2010 census block that will be assigned to
            # the 2000 census block
            # print dir(raw_spatial_index.intersection(aggregate_shape.bounds,
            #                                                 objects=True)).__sizeof__()
          
            try: 
                matched_neighborhood = list(NEIGHBORHOOD_INDEX.intersection(aggregate_shape.bounds,
                                            objects=True))[0]
            except IndexError:
                continue

            neighborhood = Neighborhoods.objects.get(name = matched_neighborhood.object)

            try:
                census_blocks = CensusBlocks.objects.filter(census_id=aggregate_id)
            except CensusBlocks.DoesNotExist:
                print aggregate_id
                continue
            for census_block in census_blocks:
                census_block.neighborhood = neighborhood
                census_block.save()





            # for i,item_2010 in enumerate(NEIGHBORHOOD_INDEX.intersection(aggregate_shape.bounds,
            #                                                       objects=True)):

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

