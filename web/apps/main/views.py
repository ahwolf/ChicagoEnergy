import os
import json
import pickle

from django.shortcuts import render_to_response
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.template import RequestContext
from django.http import HttpResponse
from django.db.models import Sum
from main.models import CensusBlocks, Neighborhoods, MonthlyEnergy, RealPledge, Initiatives
from common.conf.settings import STATIC_URL, STATIC_ROOT

from rtree.index import Index
from shapely import wkt
from shapely.geometry import Point, Polygon

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
                            # 'elect': neighborhood.total_kwh,
                            # 'gas': neighborhood.total_therm,
                            # total_energy = total_energy,
                            'elect_efficiency': neighborhood.kwh_efficiency,
                            'gas_efficiency': neighborhood.therm_efficiency,
                            # 'total_sqft': neighborhood.total_sqft,
                            # 'gas_sqft': neighborhood.sqft_therm,
                            # 'elect_sqft': neighborhood.sqft_kwh,
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


    # TEMPORARY!!!
    neighborhoods = Neighborhoods.objects.all()
    leader_list = []
    for neighborhood in neighborhoods:
        pledges = RealPledge.objects.filter(neighborhood = neighborhood)
        amount = pledges.aggregate(Sum('initiative__savings'))
        print amount

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

    census_block_geojson = create_census_json(census_blocks)

    # dump the geojson and send to the client side
    return_json = json.dumps(census_block_geojson)

    return HttpResponse(return_json,mimetype="application/json")

# Takes an address and returns the neighborhood and census block
def find_census_block(request):

    point = Point(float(request.GET.get('lat')), float(request.GET.get('lon')))

    # use point in polygon for all of the neighborhoods seemed more accurate
    neighborhoods = Neighborhoods.objects.all()
    # neighborhood_dict = {}

    # check to see whether a neighborhood was found, if so then neighborhood
    # is the correct neighborhood. Used point in polygon instead of rtree
    # since rtree was returning funny results.
    found_neighborhood = False
    for neighborhood in neighborhoods:
        if point.within(wkt.loads(neighborhood.shape)):
            found_neighborhood = True
            break

        # neighborhood_dict[neighborhood.name] = wkt.loads(neighborhood.shape)
    # recieved an invalid address
    if found_neighborhood == False:
        response = {}
        return HttpResponse(response, mimetype="application/json")
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

    # once the neighborhood is found, create an rtree of the census blocks
    # while also creating the geojson

    census_blocks = CensusBlocks.objects.filter(neighborhood = neighborhood,
                                        building_type = 'Residential',
                                        building_subtype = 'Single Family')

    # create a spatial index
    census_dict = {}

    for i,census_block in enumerate(census_blocks):
        if census_block.shape:
            census_dict[census_block.census_id] = Polygon(json.loads(census_block.shape))
    census_block_si = create_spatial_index(census_dict)

    matched_census = census_block_si.nearest(point.bounds, 1, objects=True)

    # find the census id of the matched census block
    for match in matched_census:
        census_id = match.object
        break

    # create the json to send back to the client
    census_json = create_census_json(census_blocks)

    census_json['properties'] = census_id
    response = json.dumps(census_json)
    print "before return"
    return HttpResponse(response, mimetype="application/json")

# pass in a query set and choose whether or not the shape file should be
# loaded with wkt or json
def create_census_json(census_blocks, wkt=True):

    census_block_geojson = {
            "type":"FeatureCollection",
            "features":[]
    }
    
    for census_block in census_blocks:
        if census_block.shape:
            if wkt:
                coords = [list(wkt.loads(census_block.shape).exterior.coords)]
            else:
                coords = [json.loads(census_block.shape)]

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

    # dump the geojson and send to the client side
    return census_block_geojson

# returns random initiatives back to the client
def get_pledge_info(request):
    
    initiatives_shown = 3
    subtype = request.GET.get("subtype")
    user = request.user

    # get a random order of initiatives
    if subtype == "multi lt7":
        initiatives = Initiatives.objects.filter(multi_lt7 = True).order_by('?')
    elif subtype == "multi gt7":
        initiatives = Initiatives.objects.filter(multi_gt7 = True).order_by('?')
    else:
        initiatives = Initiatives.objects.filter(single_family = True).order_by('?')

    initiative_list = []
    for initiative in initiatives:
        exists = RealPledge.objects.filter(user = user, initiative = initiative).exists()
        if not exists:
            # append to the json to return to the user
            initiative_list.append({"name":initiative.name,
                                    "savings": initiative.savings})
            if initiative.list == initiatives_shown:
                break

    response = json.dumps(initiative_list)
    return HttpResponse(response,mimetype="application/json")

# receive pledge
def receive_pledge(request):
    user = request.user
    # check building subtype, right now we are grouping <7 with 7+
    subtype = request.GET.get('subtype')
    if subtype == "Single Family":
        initiative = Initiatives.objects.get(name = request.GET.get("name"),
                                             single_family = True)
    else:
        initiative = Initiatives.objects.get(name = request.GET.get("name"),
                                             multi_lt7 = True)
    # get the neighborhood
    neighborhood = Neighborhoods.objects.get(name = request.GET.get("neighborhood"))

    # store the pledge
    realPledge, created = RealPledge.objects.get_or_create(neighborhood = neighborhood,
                                                           initiative = initiative,
                                                           user = user)
    # do I need a response here?
    return HttpResponse("success","application/json")


# ajax request for the leaderboard to be displayed
def leaderboard(request):
    amount = 10
    neighborhoods = Neighborhoods.objects.all()
    leader_list = []
    for neighborhood in neighborhoods:
        pledges = RealPledge.filter(neighborhood = neighborhood)
        amount = pledges.aggregate(Sum('initiative__savings'))
        print amount
        leader_list.append([neighborhood,amount['initiative__savings__sum']])
    leader_list = sorted(leader_list, key = lambda leader:leader[1]))
    leader_list = leader_list[:amount]
    return HttpResponse(json.dumps(leader_list), "application/json")



def create_spatial_index(shape_dict):

    spatial_index = Index()
    for index, (name, shape) in enumerate(shape_dict.iteritems()):
        spatial_index.insert(index, shape.bounds, obj=name)
    return spatial_index
