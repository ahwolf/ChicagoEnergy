import os
import json
import pickle

from django.shortcuts import render_to_response
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.template import RequestContext
from main.models import CensusBlocks, Neighborhoods, MonthlyEnergy, Pledge
from common.conf.settings import STATIC_URL, STATIC_ROOT

from rtree.index import Index
from shapely import wkt
from shapely.geometry import Point

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
        geo_type = "Polygon"
        # print '"'+neighborhood.name.lower()+'"',': "'+neighborhood.name+'",'
        neighborhood_shape = wkt.loads(neighborhood.shape)
        # print type(neighborhood.shape)
        # print dir(wkt.loads(neighborhood.shape))

        # in case of multi polygons
        if neighborhood_shape.type == "MultiPolygon":
            coords = []
            for coord in list(wkt.loads(neighborhood.shape).geoms):
                coords.append([list(coord.exterior.coords)])
            geo_type = "MultiPolygon"
        else:
            coords = [list(wkt.loads(neighborhood.shape).exterior.coords)]

        try:
            feature = {
                    "type": "Feature",
                    "geometry": {
                            "type":geo_type,
                            "coordinates": coords
                            },
                    "properties":{
                            'elect': neighborhood.total_kwh,
                            'gas': neighborhood.total_therm,
                            # total_energy = total_energy,
                            'elect_efficiency': neighborhood.kwh_efficiency,
                            'gas_efficiency': neighborhood.therm_efficiency,
                            'total_sqft': neighborhood.total_sqft,
                            'gas_sqft': neighborhood.sqft_therm,
                            'elect_sqft': neighborhood.sqft_kwh,
                            'number_of_pledges': neighborhood.number_of_pledges,
                            'pledge_money': neighborhood.pledge_money,
                            'name': neighborhood.name,
                            'elect_rank':neighborhood.kwh_rank,
                            'gas_rank':neighborhood.therm_rank,
                            'elect_percentile':neighborhood.kwh_percentile,
                            'gas_percentile':neighborhood.therm_percentile
                            
                            # 'shape':list(wkt.loads(neighborhood.shape).exterior.coords))
#                            json.dump(neighborhood.shape)
                            }
                    }
        except KeyError:

            continue
        neighborhood_geojson['features'].append(feature)

    # dump the geojson and send to the client side
    return_json = json.dumps(neighborhood_geojson)

    # with open('neighborhood_new.js', 'wb') as outfile:
    #    outfile.write("var neighborhood = " + return_json)

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
    # neighborhood_name = request.GET['name']
    # building_subtype = request.GET['building_subtype']
    neighborhood_name = "Near West Side"
    building_subtype = "Single Family"

    neighborhood = Neighborhoods.objects.get(name = neighborhood_name)
    census_blocks = CensusBlocks.objects.filter(neighborhood = neighborhood,
                                                building_type = 'Residential',
                                                building_subtype = building_subtype
                                                )

    census_block_geojson = {
            "type":"FeatureCollection",
            "features":[]
    }

    for census_block in census_blocks:
        feature = {
                "type": "Feature",
                "geometry": {
                        "type":"Polygon",
                        "coordinates": [list(wkt.loads(neighborhood.shape).exterior.coords)]#[json.loads(census_block.shape)]
                        },
                "properties":{
                        'elect': census_block.total_kwh,
                        'gas': census_block.total_therm,
                        # total_energy = total_energy,
                        'elect_efficiency': census_block.kwh_efficiency,
                        'gas_efficiency': census_block.therm_efficiency,
                        'total_sqft': census_block.total_sqft,
                        'gas_sqft': census_block.sqft_therm,
                        'elect_sqft': census_block.sqft_kwh,
                        'name': census_block.census_id,
                        'elect_rank':census_block.kwh_rank,
                        'gas_rank':census_block.therm_rank,
                        'elect_percentile':census_block.kwh_percentile,
                        'gas_percentile':census_block.therm_percentile
                        }
                }
        census_block_geojson['features'].append(feature)

    # dump the geojson and send to the client side
    return_json = json.dumps(census_block_geojson)
    with open('near_west_side.js', 'wb') as outfile:
       outfile.write("var census_block = " + return_json)

    return render_to_response(
        'main/dummy.html', {
            'project_root': settings.PROJECT_ROOT,
            'census_block_geojson': return_json
            },
        context_instance=RequestContext(request)
        )


# Takes an address and returns the neighborhood and census block
def find_census_block(request):
    print request

    print request.GET.get('lat'), request.GET.get('lon')
    point = Point(float(request.GET.get('lat')), float(request.GET.get('lon')))

    print point

    # use point in polygon for all of the neighborhoods seemed more accurate
    neighborhoods = Neighborhoods.objects.all()
    # neighborhood_dict = {}
    for neighborhood in neighborhoods:
        if point.within(wkt.loads(neighborhood.shape)):
            break

        # neighborhood_dict[neighborhood.name] = wkt.loads(neighborhood.shape)

    # BOUNDARY_DATA = STATIC_ROOT + '/main/'
    # neighborhood_dict =pickle.load(open(BOUNDARY_DATA + "community_test.p", 'rb'))
    # print "before si"
    # neighborhood_si = create_spatial_index(neighborhood_dict)

    # print "before"
    # matched_neighborhoods = neighborhood_si.nearest(point.bounds, 1,objects=True)
    # print matched_neighborhoods
    # for nei in matched_neighborhoods:
    #     print dir(nei)
    #     print nei.object
    # print matched_neighborhoods
    # once the neighborhood is found, create an rtree of the census blocks while also creating the geojson
    census_blocks = CensusBlocks.filter(neighborhood = neighborhood,
                                        building_type = 'Residential',
                                        building_subtype = 'All')

    # create a spatial index
    # census_dict = {}
    # for census_block in census_blocks:
    #     census_dict[census_block.census_id] = #

    return render_to_response(
        'main/dummy.html', {
            'project_root': settings.PROJECT_ROOT,
            },
        context_instance=RequestContext(request)
        )


def create_spatial_index(shape_dict):

    spatial_index = Index()
    for index, (name, shape) in enumerate(shape_dict.iteritems()):
        spatial_index.insert(index, shape.bounds, obj=name)
    return spatial_index
