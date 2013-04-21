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

from geopy import geocoders

class Command(BaseCommand):

    def handle(self, *args, **options):
        census_blocks = CensusBlocks.objects.all()
        census_ids = set()
        for census_block in census_blocks:
            census_ids.add(census_block.census_id)

        for i,census_id in enumerate(census_ids):
            print "yes",census_id

            single_census = CensusBlocks.objects.get(building_type = 'Residential',
                                                     census_id = census_id,
                                                     building_subtype = 'Single Family')
            if not single_census.kwh_efficiency:
                print census_id
            # try:
            #     neighborhood = Neighborhoods.objects.get(id=single_census.neighborhood_id)
            #     shape = single_census.shape
            #     print shape
            # except AttributeError:
            #     print "attribute error", census_id

            # # nice_address =
            # try:
            #     CensusBlocks.objects.filter(building_type = "Residential",
            #                                 census_id = census_id)\
            #                         .update(
            #                                 shape = shape,
            #                                 neighborhood = neighborhood)

            # except (TypeError, ZeroDivisionError) as e:
            #     print >> sys.stderr, "Nothing to aggregate."

            # if i%1000 == 0:
            #     print >> sys.stderr, "Aggregating %i of %i" %(i, len(census_ids))



