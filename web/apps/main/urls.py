from django.conf.urls.defaults import *

import views

# social authentication (this should be the first page people see
urlpatterns = patterns(
    '',
    # url(r'', include('social_auth.urls')),
    # url(settings.LOGIN_URL[1:]+'$', views.login_form, name="login_form"),
    url(r'login-form/$', views.login_form, name="login_form"),
)

urlpatterns += patterns(
    '',

    url(r'^$', views.serve_city, name="neighborhoods"),
    url(r'^neighborhood/$',views.serve_neighborhood, name="census_blocks"),
    url(r'^find_census_block/$',views.find_census_block, name="find_census_block")


)

# whatevs
urlpatterns += patterns(
    '',
    (r'^example/', include('example.urls')),
)


