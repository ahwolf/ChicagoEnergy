from django.core.management.base import BaseCommand, CommandError
from main.models import CensusBlocks, Neighborhoods, MonthlyEnergy, Pledge
from django.db.models import Sum

import sys

class Command(BaseCommand):

    def handle(self, *args, **options):

        # Aggregate the values to find the efficiency of the Neighborhoods
        neighborhoods = Neighborhoods.objects.all()
        total_blocks = 0
        for i, neighborhood in enumerate(neighborhoods):
            print >> sys.stderr, "Analyzing neighborhood: %s, %i out of %i" %(neighborhood.name, i+1, len(neighborhoods))
            census_blocks = CensusBlocks.objects.filter(neighborhood = neighborhood, building_type = 'Residential')
            aggregate_metrics = census_blocks.aggregate(Sum('total_kwh'), 
                                                        Sum('total_therm'), 
                                                        # Sum('total_energy'), 
                                                        Sum('sqft_kwh'),
                                                        Sum('sqft_therm'),
                                                        Sum('total_sqft'))

            try:
                Neighborhoods.objects.filter(name = neighborhood.name).update(total_kwh=aggregate_metrics['total_kwh__sum'],
                                total_therm = aggregate_metrics['total_therm__sum'],
                                sqft_kwh = aggregate_metrics['sqft_kwh__sum'],
                                sqft_therm = aggregate_metrics['sqft_therm__sum'],
                                total_sqft = aggregate_metrics['total_sqft__sum'],
                                therm_efficiency = float(aggregate_metrics['total_therm__sum']) / aggregate_metrics['sqft_therm__sum'],
                                kwh_efficiency = float(aggregate_metrics['total_kwh__sum']) / aggregate_metrics['sqft_kwh__sum'])
            except TypeError:
                print >> sys.stderr, "Nothing to aggregate."

        # Now include the rank 
        kwh_list = []
        therm_list = []

        # third item in list is the percentile to be calculated later
        for neighborhood in neighborhoods:
            kwh_list.append([neighborhood.name, neighborhood.kwh_efficiency,0])
            therm_list.append([neighborhood.name, neighborhood.therm_efficiency,0])

        sorted_kwh_list = sorted(kwh_list, key = lambda efficiency:efficiency[1])
        sorted_therm_list = sorted(therm_list, key = lambda efficiency:efficiency[1])

        for i, item in enumerate(sorted_kwh_list):
            sorted_kwh_list[i][2] = float(i)/len(sorted_kwh_list)
            sorted_therm_list[i][2] = float(i)/len(sorted_therm_list)

        for i,kwh in enumerate(sorted_kwh_list):
            neighborhood_name = kwh[0]
            neighborhood = Neighborhoods.objects.filter(name=neighborhood_name).update(kwh_percentile = kwh[2],
                                                                                       kwh_rank = i+1)
            # neighborhood.kwh_percentile = kwh[2]
            # neighborhood.save()
            if i%1000 == 0:
                print >> sys.stderr, "Evaluating kwh percentile %i of %i" %(i, len(sorted_kwh_list))

        for i, therm in enumerate(sorted_therm_list):
            neighborhood_name = therm[0]
            neighborhood = Neighborhoods.objects.filter(name=neighborhood_name).update(therm_percentile=therm[2],
                                                                                       therm_rank = i+1)
            # neighborhood.therm_percentile = therm[2]
            # neighborhood.save()
            if i%1000 == 0:
                print >> sys.stderr, "Evaluating therm percentile %i of %i" %(i, len(sorted_therm_list))

            # neighborhood.total_kwh = aggregate_metrics['total_kwh__sum']
            # neighborhood.total_therm = aggregate_metrics['total_therm__sum']
            # # neighborhood.total_energy = aggregate_metrics['total_energy__sum']
            # neighborhood.sqft_kwh = aggregate_metrics['sqft_kwh__sum']
            # neighborhood.sqft_therm = aggregate_metrics['sqft_therm__sum']
            # neighborhood.total_sqft = aggregate_metrics['total_sqft__sum']

            # neighborhood.total_efficiency = float(neighborhood.total_energy) / neighborhood.total_sqft
            # neighborhood.therm_efficiency = float(neighborhood.total_therm) / neighborhood.sqft_therm
            # neighborhood.kwh_efficiency = float(neighborhood.total_kwh) / neighborhood.sqft_kwh

            # neighborhood.save()
