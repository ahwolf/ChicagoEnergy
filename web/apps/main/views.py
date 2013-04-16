import os
import json

from django.shortcuts import render_to_response
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.template import RequestContext

from main.models import CensusBlocks, Neighborhoods, MonthlyEnergy, Pledge
from common.conf.settings import STATIC_URL, STATIC_ROOT

def login_form(request):
    print 'wtf'
    return render_to_response(
        'main/login_form.html', {
        },
        context_instance=RequestContext(request)
    )

@login_required
def serve_city(request):
    print os.listdir(STATIC_ROOT)

    # read in neighborhood.json to get the shapes
    with open(STATIC_ROOT + '/main/neighborhood.json', 'r') as infile:
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


