
"""inspired by http://jmoiron.net/blog/deploying-django-mod-wsgi-virtualenv/
"""

import os
import sys
import site

django_root = os.path.abspath(os.path.join(os.path.dirname(__file__),
		   '..', '..', '..', '..'))
venv = os.path.join(django_root, "env", "lib", "python2.6", "site-packages")

prev_sys_path = list(sys.path)
site.addsitedir(venv)

# add django root to sys.path
sys.path.append(django_root)

# reorder sys.path so new directories from te addsitedir show up first
new_sys_path = [p for p in sys.path if p not in prev_sys_path]
for item in new_sys_path:
    sys.path.remove(item)
sys.path[:0] = new_sys_path # ?!?!?!

os.environ['DJANGO_MANAGEMENT_COMMAND'] = 'runserver'
os.environ['DJANGO_SETTINGS_MODULE'] = 'conf.poisson.settings'

# set project-specific environment variables
environment = os.path.join(django_root, "conf", "environment.py")
if os.path.exists(environment):
    execfile(environment)

import django.core.handlers.wsgi
application = django.core.handlers.wsgi.WSGIHandler()
