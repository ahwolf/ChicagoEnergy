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
        census_blocks = CensusBlocks.objects.filter(building_type="Residential",
                                                    building_subtype="All",
                                                    neighborhood_id = "4")


        census_block_geojson = {
            "type":"FeatureCollection",
            "features":[]
            }
        for census_block in census_blocks:
            if census_block.shape:
                coords = [list(wkt.loads(census_block.shape).exterior.coords)]


                feature = {
                "type": "Feature",
                "geometry": {
                "type":"Polygon",
                "coordinates": coords
                },
                "properties":{
                            # 'elect': census_block.total_kwh,
                            # 'gas': census_block.total_therm,
                            # total_energy = total_energy,
                            'elect_efficiency': census_block.kwh_efficiency,
                            'gas_efficiency': census_block.therm_efficiency,
                            # 'total_sqft': census_block.total_sqft,
                            # 'gas_sqft': census_block.sqft_therm,
                            # 'elect_sqft': census_block.sqft_kwh,
                            'name': census_block.census_id,
                            'elect_rank':census_block.kwh_rank,
                            'gas_rank':census_block.therm_rank,
                            'elect_percentile':census_block.kwh_percentile,
                            'gas_percentile':census_block.therm_percentile
                            }
                    }
                census_block_geojson['features'].append(feature)
        return_json = json.dumps(census_block_geojson)
        with open('ashburn.js', 'wb') as outfile:
           outfile.write("var census_block = " + return_json)

