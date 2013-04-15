from django.shortcuts import render_to_response
from django.conf import settings
from django.template import RequestContext
from main.models import CensusBlocks, Neighborhoods, MonthlyEnergy, Pledge
from common.conf.settings import STATIC_URL, STATIC_ROOT

import os
import json

def dummy(request):    
    return render_to_response(
        'main/dummy.html', {
            'project_root': settings.PROJECT_ROOT,
            },
        context_instance=RequestContext(request)
        )

def serve_city(request):
    print os.listdir(STATIC_ROOT)

    # read in neighborhood.json to get the shapes
    with open(STATIC_ROOT + '/main/neighborhood.json', 'r') as infile:
        print type(infile)
        shapes = json.load(infile)
        neighborhoods = Neighborhoods.objects.all()



    return render_to_response(
        'main/dummy.html', {
            'project_root': settings.PROJECT_ROOT,
            },
        context_instance=RequestContext(request)
        )




    # create the geojson object to return to the client that includes the
    # shape and energy info


