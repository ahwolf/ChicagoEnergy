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
        g = geocoders.GeoNames()
        census_blocks = CensusBlocks.objects.all()
        census_ids = set()
        for census_block in census_blocks:
            census_ids.add(census_block.census_id)

        for i,census_id in enumerate(census_ids):
            single_census = CensusBlocks.objects.get(building_type = 'Residential',
                                                        census_id = census_id,
                                                        building_subtype = 'All')
            try:
                shape = single_census.shape
                if shape != None:
                    print single_census.neighborhood
                    print single_census.neighborhood.name

                    lat, lon = list(wkt.loads(shape).exterior.coords)[:1][0]
                    (place, point) = g.reverse((lon,lat))

                    # Get the address because we are rounding it out
                    address = place.split(",")[0]
                    broken = address.split()
                    new_street = str(int(round(int(broken[0]) ,-2)))
                    broken = ' '.join(broken[1:])
                    broken = new_street + " " + broken

            except (AttributeError) as e:
                print "attribute error", census_id

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



