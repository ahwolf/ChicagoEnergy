import os
import json

from django.shortcuts import render_to_response
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.template import RequestContext
from main.models import CensusBlocks, Neighborhoods, MonthlyEnergy, Pledge
from common.conf.settings import STATIC_URL, STATIC_ROOT

from shapely import wkt

def login_form(request):
    print 'wtf'
    return render_to_response(
        'main/login_form.html', {
        },
        context_instance=RequestContext(request)
    )

# @login_required
def serve_city(request):


    # create the geojson object
    neighborhood_geojson = {
                "type":"FeatureCollection",
                "features":[]
    }
    # read in neighborhood.json to get the shapes
    neighborhoods = Neighborhoods.objects.all()
    for neighborhood in neighborhoods:
        print type(neighborhood.shape)
        try:
            feature = {
                    "type": "Feature",
                    "geometry": {
                            "type":"Polygon",
                            "coordinates":[json.loads(neighborhood.shape)]
                            },
                    "properties":{
                            'elect': neighborhood.total_kwh,
                            'gas': neighborhood.total_therm,
                            # total_energy = total_energy,
                            'elect_efficiency': neighborhood.kwh_efficiency,
                            'gas_efficiency': neighborhood.therm_efficiency,
                            'total_sqft': neighborhood.total_sqft,
                            'number_of_pledges': neighborhood.number_of_pledges,
                            'pledge_money': neighborhood.pledge_money,
                            'name': neighborhood.name,
                            'shape': [json.loads(neighborhood.shape)]
                            # 'shape':list(wkt.loads(neighborhood.shape).exterior.coords))
#                            json.dump(neighborhood.shape)
                            }
                    }
        except:
            continue
        neighborhood_geojson['features'].append(feature)

    # dump the geojson and send to the client side
    return_json = json.dumps(neighborhood_geojson)

    return render_to_response(
        'main/dummy.html', {
            'project_root': settings.PROJECT_ROOT,
            'neighborhood_geojson': return_json
            },
        context_instance=RequestContext(request)
        )

# user selects a neighborhood, we return all of the census blocks for that
# neighborhood
def serve_neighborhood(request):
    # get the name
    neighborhood_name = request.GET['name']
    neighborhood = Neighborhoods.objects.get(name = neighborhood_name)
    census_blocks = CensusBlocks.objects.filter(neighborhood = neighborhood,
                                                building_type = 'Residential')

    census_block_geojson = {
            "type":"FeatureCollection",
            "features":[]
    }

    for census_block in census_blocks:
        feature = {
                "type": "Feature",
                "geometry": {
                        "type":"Polygon",
                        "coordinates":[json.loads(census_block.shape)]
                        },
                "properties":{
                        'total_kwh': census_block.total_kwh,
                        'total_therm': census_block.total_therm,
                        # total_energy = total_energy,
                        'sqft_kwh': census_block.sqft_kwh,
                        'sqft_therm': census_block.sqft_therm,
                        'total_sqft': census_block.total_sqft,
                        'name': census_block.census_id
                        }
                }
        census_block_geojson['features'].append(feature)

    # dump the geojson and send to the client side
    return_json = json.dumps(census_block_geojson)

    return render_to_response(
        'main/dummy.html', {
            'project_root': settings.PROJECT_ROOT,
            'census_block_geojson': return_json
            },
        context_instance=RequestContext(request)
        )
