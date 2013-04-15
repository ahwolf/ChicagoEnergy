from django.conf.urls.defaults import *

import views

urlpatterns = patterns(
    '',

    # url(r'^$', views.dummy, name="dummy"),
    url(r'^$', views.serve_city, name="neighborhoods"),

)

# whatevs
urlpatterns += patterns(
    '',
    (r'^example/', include('example.urls')),
)


