from django.core.management.base import BaseCommand, CommandError
from main.models import CensusBlocks, Neighborhoods, MonthlyEnergy, Pledge
from django.db.models import Sum

class Command(BaseCommand):

    def handle(self, *args, **options):

        # Aggregate the values to find the efficiency of the Neighborhoods
        neighborhoods = Neighborhoods.objects.all()
        total_blocks = 0
        for neighborhood in neighborhoods:
            census_blocks = CensusBlocks.objects.filter(neighborhood = neighborhood, building_type = 'Residential')
            aggregate_metrics = census_blocks.aggregate(Sum('total_kwh'), 
                                                        Sum('total_therm'), 
                                                        Sum('total_energy'), 
                                                        Sum('sqft_kwh'),
                                                        Sum('sqft_therm'),
                                                        Sum('total_sqft'))

            neighborhood.total_kwh = aggregate_metrics['total_kwh__sum']
            neighborhood.total_therm = aggregate_metrics['total_therm__sum']
            neighborhood.total_energy = aggregate_metrics['total_energy__sum']
            neighborhood.sqft_kwh = aggregate_metrics['sqft_kwh__sum']
            neighborhood.sqft_therm = aggregate_metrics['sqft_therm__sum']
            neighborhood.total_sqft = aggregate_metrics['total_sqft__sum']

            print neighborhood.total_energy, neighborhood.total_therm, neighborhood.total_kwh
            # neighborhood.total_efficiency = float(neighborhood.total_energy) / neighborhood.total_sqft
            neighborhood.therm_efficiency = float(neighborhood.total_therm) / neighborhood.sqft_therm
            neighborhood.kwh_efficiency = float(neighborhood.total_kwh) / neighborhood.sqft_kwh

            neighborhood.save()
