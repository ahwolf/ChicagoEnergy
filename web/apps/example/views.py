from django.shortcuts import render_to_response
from django.conf import settings
from django.template import RequestContext

def whatev(request):    
    import BeautifulSoup
    return render_to_response(
        'example/whatev.html', {
            'project_root': settings.PROJECT_ROOT,
            },
        context_instance=RequestContext(request)
        )
