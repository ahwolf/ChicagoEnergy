from django.shortcuts import render_to_response
from django.conf import settings
from django.template import RequestContext

def dummy(request):    
    return render_to_response(
        'main/dummy.html', {
            'project_root': settings.PROJECT_ROOT,
            },
        context_instance=RequestContext(request)
        )
