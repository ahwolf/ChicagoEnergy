from django.db import models
from django.contrib.auth.models import User


class Neighborhoods(models.Model):

    name = models.TextField(blank=True, null=True)

    total_efficiency = models.FloatField(blank=True, null=True)
    therm_efficiency = models.FloatField(blank=True, null=True)
    kwh_efficiency = models.FloatField(blank=True, null=True)

    total_kwh = models.IntegerField(blank=True, null=True)
    total_therm = models.IntegerField(blank=True, null=True)
    total_energy = models.FloatField(blank=True, null=True)    

    sqft_kwh = models.IntegerField(blank=True, null=True)
    sqft_therm = models.IntegerField(blank=True, null=True)
    total_sqft = models.IntegerField(blank=True, null=True)

    number_of_pledges = models.IntegerField(blank=True, null=True)
    pledge_money = models.FloatField(blank=True, null=True)

class CensusBlocks(models.Model):

    census_id = models.TextField(blank=True, null=True)
    neighborhood = models.ForeignKey(Neighborhoods, blank=True, null=True)
    building_type = models.TextField(blank=True, null=True)
    building_subtype = models.TextField(blank=True, null=True)
    
    total_kwh = models.IntegerField(blank=True, null=True)
    total_therm = models.IntegerField(blank=True, null=True)
    total_energy = models.FloatField(blank=True, null=True)

    sqft_kwh = models.IntegerField(blank=True, null=True)
    sqft_therm = models.IntegerField(blank=True, null=True)
    total_sqft = models.IntegerField(blank=True, null=True)

    total_efficiency = models.FloatField(blank=True, null=True)
    therm_efficiency = models.FloatField(blank=True, null=True)
    kwh_efficiency = models.FloatField(blank=True, null=True)

    total_percentile = models.FloatField(blank=True, null=True)
    therm_percentile = models.FloatField(blank=True, null=True)
    kwh_percentile = models.FloatField(blank=True, null=True)

class MonthlyEnergy(models.Model):
    
    census_block = models.ForeignKey(CensusBlocks)
    energy_type = models.TextField()
    month = models.TextField()
    amount = models.IntegerField(blank=True, null=True)

class Pledge(models.Model):
    
    census_block = models.ForeignKey(CensusBlocks)
    neighborhood = models.ForeignKey(Neighborhoods)
    amount = models.FloatField(blank=True, null=True)
    user = models.ForeignKey(User)
