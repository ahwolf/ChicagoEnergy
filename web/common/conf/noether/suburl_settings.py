"""use these settings to set up a suburl on an apache-hosted django
project (e.g., for a project hosted at xxxx.datascopeanalytics.com/fudge)
"""

from common.conf.settings import _suburl_settings
from settings import *

# setup the suburl stuff
(SCRIPT_NAME, MEDIA_URL, SESSION_COOKIE_PATH,
 LOGIN_REDIRECT_URL, LOGIN_URL, LOGOUT_URL, CSRF_COOKIE_PATH, STATIC_URL, ) = \
 _suburl_settings("noether", PROJECT_ROOT, MEDIA_URL, 
                  SESSION_COOKIE_PATH, LOGIN_REDIRECT_URL, LOGIN_URL, 
                  LOGOUT_URL, CSRF_COOKIE_PATH, STATIC_URL)
