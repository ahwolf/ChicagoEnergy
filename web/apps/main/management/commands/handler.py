from django.core.management.base import BaseCommand, CommandError
from main.models import CensusBlocks, Neighborhoods, MonthlyEnergy, Pledge
from django.core.management import call_command
import create_census_models, aggregate_neighborhood_metrics, calculate_percentiles, match_neighborhoods

import csv
import sys

class Command(BaseCommand):


    def handle(self, *args, **options):
        print >> sys.stderr, "Reading in Census blocks from Accenture raw data..."
        call_command('create_census_models')
        print >> sys.stderr, "done."

        print >> sys.stderr, "Finding matching neighborhoods and adding shapes..."
        call_command('match_neighborhoods')
        print >> sys.stderr, "done."

        print >> sys.stderr, "Find the percentiles for the various single family homes"
        call_command('calculate_percentiles')
        print >> sys.stderr, "done."

        print >> sys.stderr, "Aggregate all of this useful info back up to the neighborhood level"
        call_command('aggregate_neighborhood_metrics')
        print >> sys.stderr, "done."

