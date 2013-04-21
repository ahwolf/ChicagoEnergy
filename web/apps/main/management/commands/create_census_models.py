from django.core.management.base import BaseCommand, CommandError
from main.models import CensusBlocks, Neighborhoods, MonthlyEnergy, Pledge

import sys
import csv

MONTHS = ['January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'    
  ]

class Command(BaseCommand):


    def handle(self, *args, **options):

        with open('../data/raw_energy_data_v2.csv', 'r') as infile:
            reader = csv.reader(infile, delimiter='|')
            header_row = reader.next()

            for j,row in enumerate(reader):
                # print "parsing: ", j, row[0],row[1]
                neighborhood = row[0]
                # Lakeview fix neighborhood to work with our files
                if neighborhood == 'Lakeview':
                    neighborhood = 'Lake View'

                census_block_id = row[1]
                building_type = row[2]
                building_subtype = row[3]

                try:
                    total_kwh = int(row[16])
                except ValueError:
                    total_kwh = 0

                try:
                    total_therm = int(row[31])
                except ValueError:
                    total_therm = 0

                try:
                    sqft_kwh = int(row[33])
                except ValueError:
                    sqft_kwh = 0

                try:
                    sqft_therm = int(row[34])
                except ValueError:
                    sqft_therm = 0

                # print "here"
                # change when new values appear
                total_sqft = sqft_therm + sqft_kwh

                if sqft_therm == 0:
                    therm_efficiency = 0
                else:
                    therm_efficiency = float(total_therm)/sqft_therm

                if sqft_kwh == 0:
                    kwh_efficiency = 0
                else:
                    kwh_efficiency = float(total_kwh)/sqft_kwh

                if total_sqft == 0:
                    total_efficiency = 0
                # else:
                #     total_efficiency = 
                
                # print therm_efficiency, kwh_efficiency

                Neighborhood, created = Neighborhoods.objects.get_or_create(name = neighborhood)
                
                if j%1000 == 0:
                    print >> sys.stderr, "Analyzing row: ", j


                Census_block, created = CensusBlocks.objects.get_or_create(
                                                    census_id = census_block_id,
                                                    neighborhood = Neighborhood,
                                                    building_type = building_type,
                                                    building_subtype = building_subtype,
                                                    total_kwh = total_kwh,
                                                    total_sqft = total_sqft,
                                                    total_therm = total_therm,
                                                    sqft_therm = sqft_therm,
                                                    sqft_kwh = sqft_kwh,
                                                    therm_efficiency = therm_efficiency,
                                                    kwh_efficiency = kwh_efficiency,
                                                    )










                # # Too slow so I'm removing for now
                # for i, month in enumerate(MONTHS):
                #     # print month
                #     try:
                #         kwh = int(row[i+4])
                #     except ValueError:
                #         kwh = 0
                #     try:
                #         therm = int(row[i+19])
                #     except:
                #         therm = 0
                #     # print type(kwh), type(therm)
                #     kwh_month = MonthlyEnergy.objects.get_or_create(
                #                                     census_block = Census_block,
                #                                     energy_type = 'kwh',
                #                                     month = month,
                #                                     amount = kwh
                #                                     )
                #     therm_month = MonthlyEnergy.objects.get_or_create(
                #                                     census_block = Census_block,
                #                                     energy_type = 'therm',
                #                                     month = month,
                #                                     amount = therm
                #                                     )

        # Aggregate the values to find the efficiency of the Neighborhoods
        # neighborhoods = Neighborhoods.objects.all()
        # for neighborhood in neighborhoods:
        #     total_kwh = neighborhood