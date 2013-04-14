from django.conf.urls.defaults import *

import views

urlpatterns = patterns(
    '',

    url(r'^$', views.dummy, name="dummy"),
    url(r'^sldkgjlkj$', views.dummy, name="sdlgkj"),

)

# whatevs
urlpatterns += patterns(
    '',
    (r'^example/', include('example.urls')),
)


