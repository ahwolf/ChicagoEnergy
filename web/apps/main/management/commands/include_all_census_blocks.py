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

class Command(BaseCommand):

    def handle(self, *args, **options):
        census_blocks = CensusBlocks.objects.all()
        census_ids = set()
        for census_block in census_blocks:
            census_ids.add(census_block.census_id)

        for i,census_id in enumerate(census_ids):
            all_census_block, created = CensusBlocks.objects.get_or_create(building_type = "Residential",
                                                                           census_id = census_id,
                                                                           building_subtype = 'All')

            aggregate = CensusBlocks.objects.filter(building_type = 'Residential',
                                                    census_id = census_id).exclude(building_subtype = 'All').aggregate(
                                                            Sum('total_kwh'), 
                                                            Sum('total_therm'), 
                                                            # Sum('total_energy'), 
                                                            Sum('sqft_kwh'),
                                                            Sum('sqft_therm'),
                                                            Sum('total_sqft'))

            single_census = CensusBlocks.objects.filter(building_type = "Residential",
                                                        census_id = census_id,
                                                        building_subtype = 'Single Family')
            neighborhood = single_census.neighborhood
            shape = single_census.shape
            
            try:
                CensusBlocks.objects.filter(building_type = "Residential",
                                            census_id = census_id,
                                            building_subtype = 'All')\
                                    .update(
                                            shape = shape
                                            neighborhood = neighborhood
                                            total_kwh=aggregate['total_kwh__sum'],
                                            total_therm = aggregate['total_therm__sum'],
                                            sqft_kwh = aggregate['sqft_kwh__sum'],
                                            sqft_therm = aggregate['sqft_therm__sum'],
                                            total_sqft = aggregate['total_sqft__sum'],
                                            therm_efficiency = float(aggregate['total_therm__sum']) / aggregate['sqft_therm__sum'],
                                            kwh_efficiency = float(aggregate['total_kwh__sum']) / aggregate['sqft_kwh__sum'])
            except (TypeError, ZeroDivisionError) as e:
                print >> sys.stderr, "Nothing to aggregate."

            if i%1000 == 0:
                print >> sys.stderr, "Aggregating %i of %i" %(i, len(census_ids))



