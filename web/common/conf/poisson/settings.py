from common.conf.settings import *
from common.conf.settings import _mysql_db_name

# specify the database here
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': _mysql_db_name(PROJECT_ROOT),
        'USER': 'dsa',
        'PASSWORD': 'tiyp,dsa',
        'HOST': '',
        'PORT': '',
    }
}

# debug information
DEBUG = False
TEMPLATE_DEBUG = DEBUG
SITE_ID = 2

# https://docs.djangoproject.com/en/dev/ref/settings/#allowed-hosts
# add allowed hosts so we can easily set DEBUG=False without shitting
# the bed
# http://stackoverflow.com/questions/15128135/django-setting-debug-false-causes-500-error
ALLOWED_HOSTS = ['staging.datascopeanalytics.com']
