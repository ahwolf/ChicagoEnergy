from django.core.management.base import BaseCommand, CommandError
from main.models import CensusBlocks, Neighborhoods, MonthlyEnergy, Pledge, Initiatives
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
        with open("../data/fixes.csv",'rb') as infile:
            reader = csv.reader(infile)
            for row in reader:
                name = row[0]
                try:
                    single_savings = int(row[1])
                    initiative, created = Initiatives.objects.get_or_create(
                                                    name = name,
                                                    savings = single_savings,
                                                    multi_lt7 = False,
                                                    multi_gt7 = False,
                                                    single_family = True)
                except ValueError:
                    pass
                try:
                    multi_savings = int(row[2])
                    initiative, created = Initiatives.objects.get_or_create(
                                                    name = name,
                                                    savings = multi_savings,
                                                    multi_lt7 = True,
                                                    multi_gt7 = True,
                                                    single_family = False)
                except ValueError:
                    pass
                print name
            # except (TypeError, ZeroDivisionError) as e:
            #     print >> sys.stderr, "Nothing to aggregate."

            # if i%1000 == 0:
            #     print >> sys.stderr, "Aggregating %i of %i" %(i, len(census_ids))



