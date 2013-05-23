from django.conf.urls import patterns, include, url
from django.conf import settings
from django.contrib import admin
from django.core.urlresolvers import reverse

#------------------------------------------------------------------ error views
handler500 = 'django.views.defaults.server_error'
handler404 = 'django.views.defaults.page_not_found'

#------------------------------------------------------------------- admin info
admin.autodiscover()
urlpatterns = patterns(
    '',
    (r'^admin/doc/', include('django.contrib.admindocs.urls')),
    (r'^admin/', include(admin.site.urls)),
)

#-------------------------------------------------------------- login and logout
urlpatterns += patterns(
    '',
    url(r'^accounts/login/$', 'django.contrib.auth.views.login', 
        name="login"),
    url(r'^accounts/logout/$', 'django.contrib.auth.views.logout_then_login',
        name="logout"),
    url(r'^accounts/change-password/$', 
        'django.contrib.auth.views.password_change', 
        name="password_change"),
    url(r'^accounts/change-password-done/$', 
        'django.contrib.auth.views.password_change_done', 
        name="password_change_done"),
)

#--------------------------------------------------------- include the main urls
urlpatterns += patterns(
    '',
    (r'^', include('apps.main.urls')),
)

#-------------------------------------------------------- include the robot urls
urlpatterns += patterns(
    '',
    (r'robots.txt$', include('robots.urls')),
)

#------------------------------------------- hack for serving media on localhost
if settings.SITE_ID==1:
    urlpatterns += patterns(
        '',
        (r'^media/(?P<path>.*)$', 'django.views.static.serve',
         {'document_root': settings.MEDIA_ROOT}),
        (r'^static/(?P<path>.*)$', 'django.views.static.serve',
         {'document_root': settings.STATIC_ROOT}),
    )
