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
        census_blocks = CensusBlocks.objects.filter(nice_address=None,
                                                    building_type='Residential',
                                                    building_subtype='All')
        census_ids = set()
        for census_block in census_blocks:
            census_ids.add(census_block.census_id)

        for i,census_id in enumerate(census_ids):
            try:
                single_census = CensusBlocks.objects.get(building_type = 'Residential',
                                                         census_id = census_id,
                                                         building_subtype = 'All')
            except:
                print census_id
                continue
            try:
                shape = single_census.shape
                if shape != None:

                    lat, lon = list(wkt.loads(shape).representative_point().coords)[0]
                    try:
                        (place, point) = g.reverse((lon,lat))
                    except:
                        pass
                    # Get the address because we are rounding it out
                    address = place.split(",")[0]
                    print address
                    broken = address.split()
                    try:
                        new_street = str(int(round(int(broken[0]) ,-2)))
                    except ValueError:
                        print "ValueError, rechecking..."
                        lat, lon = list(wkt.loads(shape).centroid.coords)[0]
                        try:
                            (place, point) = g.reverse((lon,lat))
                        except:
                            pass
                        # Get the address because we are rounding it out
                        address = place.split(",")[0]
                        print address
                        broken = address.split()
                        try:
                            new_street = str(int(round(int(broken[0]) ,-2)))
                        except ValueError:
                            print "ValueError, rechecking..."
                            for x in wkt.loads(shape).exterior.coords:
                                lat, lon = x
                                try:
                                    (place, point) = g.reverse((lon,lat))
                                except:
                                    pass
                                # Get the address because we are rounding it out
                                address = place.split(",")[0]
                                print address
                                broken = address.split()
                                try:
                                    new_street = str(int(round(int(broken[0]) ,-2)))
                                    break
                                except ValueError:
                                    print "ValueError, rechecking..."
                                    pass


                    broken = ' '.join(broken[1:])
                    broken = new_street + " " + broken
                

            except (AttributeError) as e:
                print "attribute error", census_id
                continue
            nice_address = broken
            try:
                CensusBlocks.objects.filter(building_type = "Residential",
                                            census_id = census_id)\
                                    .update(nice_address = nice_address)

            except (TypeError, ZeroDivisionError) as e:
                print >> sys.stderr, "Nothing to aggregate."

            if i%100 == 0:
                print >> sys.stderr, "Aggregating %i of %i" %(i, len(census_ids))

                # 170310803001002



