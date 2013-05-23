"""
Give LivingReport access to ClientPage user and session db, unless we
are accessing the admin.
"""
import threading

from django.core.urlresolvers import reverse 
 
# Object to hold request data
request_cfg = threading.local()
 
class RouterMiddleware(object):
    """
    Sets a flag if we are accessing Django admin to prevent database rerouting
    for the auth model.  Removes the flag once the request has been processed.
    """

    def process_view(self, request, view_func, args, kwargs):
        if request.path.contains('/admin/'):
            request_cfg.admin = True
 
    def process_response(self, request, response):
        if hasattr(request_cfg, 'admin'):
            del request_cfg.admin


class UserSessionRouter(object):
    """
    Redirects database IO for the auth and sessions models to
    ClientPage project.
    """
 
    def db_for_read(self, model, **hints):
        if not hasattr(request_cfg, 'admin'):
            if model._meta.app_label == 'auth':
                return 'usersandsessions'
            elif model._meta.app_label == 'accounts':
                return 'usersandsessions'
            elif model._meta.app_label == 'sessions':
                return 'usersandsessions'
        return None
     
    def db_for_write(self, model, **hints):
        if not hasattr(request_cfg, 'admin'):
            if model._meta.app_label == 'auth':
                return 'usersandsessions'
            elif model._meta.app_label == 'accounts':
                return 'usersandsessions'
            elif model._meta.app_label == 'sessions':
                return 'usersandsessions'
        return None
