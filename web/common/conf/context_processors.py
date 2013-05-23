from django.conf import settings

def root_url(request):
    """Add the ROOT_URL to the template context. This is useful for
    django projects that are hosted at URLs like a.b.com/root/url/
    """
    return {"ROOT_URL": request.META["SCRIPT_NAME"] + '/',}

def use_cdn_media(request):
    """Load the USE_CDN_MEDIA settings variable into the template context.
    """
    return {"USE_CDN_MEDIA": settings.USE_CDN_MEDIA}

def google_analytics(request):
    """Load the USE_CDN_MEDIA settings variable into the template context.
    """
    return {"GOOGLE_ANALYTICS_SITE_ID": settings.GOOGLE_ANALYTICS_SITE_ID}
