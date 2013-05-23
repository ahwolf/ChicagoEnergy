"""Django base settings for awesome directory setup.
"""
import sys
import os

# Django docs say this line is redundant, but we want to extend
# variables like TEMPLATE_CONTEXT_PROCESSORS, so we are going to be
# rebels and import this anyway
from django.conf.global_settings import *
import django

# get the project path
PROJECT_ROOT = os.path.realpath(os.path.abspath(os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    '..',
    '..',
)))

# debugging statements
DEBUG = True
TEMPLATE_DEBUG = DEBUG

# admin and managers
ADMINS = (
    ('Web Services', 'web.services@datascopeanalytics.com'),
)
MANAGERS = ADMINS

# site id for the django sites framework
SITE_ID = 1

# internationalization nonsense
TIME_ZONE = 'America/Chicago'
LANGUAGE_CODE = 'en-us'

# specifiy media
MEDIA_ROOT = os.path.join(PROJECT_ROOT, '.media')
MEDIA_URL = '/media/'

# specify static media. see
# https://docs.djangoproject.com/en/dev/howto/static-files/
# https://docs.djangoproject.com/en/dev/ref/contrib/staticfiles/#std:setting-STATICFILES_DIRS
STATIC_ROOT = os.path.join(PROJECT_ROOT, '.static')
STATIC_URL = '/static/'

# use remote media loaded from content delivery network. can disable
# if working without internet connection (e.g., in train, plane, or
# automobile)
USE_CDN_MEDIA = True

SECRET_KEY = '&x-iseoz*ul3^2efr%$83(5&571=%2ur%zdep8j^8nj9vwj)pr'

ROOT_URLCONF = 'common.conf.urls'

# specify the google analytics site ID for rendering at the very end
# of the html page. Should be everything after the 'UA-' in
# 'UA-XXXXX-X'. By default, this is falsey to prevent the google
# analytics snippet from rendering in the page. This should generally
# be included in the production settings configuration.
GOOGLE_ANALYTICS_SITE_ID = ''

# A template, example.html, is searched for in these template
# directories *after* django searches in the app template
# directories. The order here is important!
TEMPLATE_DIRS = (

    # this is where you should over-ride all project-specific
    # customizations of particular templates
    os.path.join(PROJECT_ROOT, 'apps', 'main', 'templates', ), 

    # this is where we store (and continue to develop) common
    # templates that are used across several different django projects
    os.path.join(PROJECT_ROOT, 'common', 'templates', ), 

    # this is a soft-link directory to make it possible to use
    # base.html, 404.html, etc. that are located in the
    # common/templates directory
    os.path.join(PROJECT_ROOT, 'common', '.fallback_templates', ), 

    # this is provided so that it is possible to extend base templates
    # that are provided by a particular app. For example, the
    # clientpage app has a base template that we probably want to keep
    # constant across several different clients.
    os.path.join(PROJECT_ROOT, 'apps'), 

    # this is provided so that it is possible to extend base templates
    # provided in core django apps (e.g., admin, registration, etc)
    # without having to copy all of the source files into our common
    # repo everytime. To extend or modify the admin templates, for
    # example, 
    # {% extend "django/contrib/admin/templates/admin/some_file_name.html" %}
    os.path.dirname(os.path.dirname(django.__file__)),
)

TEMPLATE_CONTEXT_PROCESSORS += (
    
    # add this to get the request object in the django template by
    # default
    'django.core.context_processors.request',

    # add this to make sure that the USE_CDN_MEDIA settings variable
    # is loaded into template context.
    'common.conf.context_processors.use_cdn_media',

    # add this to make sure that the GOOGLE_ANALYTICS_SITE_ID settings
    # variable is loaded into template context.
    'common.conf.context_processors.google_analytics',

    # we added this so that the django projects will work well on the
    # staging server, as well as in development and in production.
    'common.conf.context_processors.root_url',
)

# redirect to home page after login
LOGIN_REDIRECT_URL = '/'

# these are all of the django apps that are installed by default. we
# chose to be relatively agressive here --- including more apps does
# not hurt anything
INSTALLED_APPS = (

    # these are provided by django by default
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.sitemaps',
    'django.contrib.staticfiles',

    # enable the admin and local documentation
    'django.contrib.admin',
    'django.contrib.admindocs',

    # handy django apps for development etc.
    'django.contrib.humanize',
    'django.contrib.webdesign',

)

# add the project apps and the common apps directory on python path so
# that views, models, urls, etc. can do things like 'import
# app.models' without things breaking.
sys.path.append(os.path.join(PROJECT_ROOT, 'apps'))
sys.path.append(os.path.join(PROJECT_ROOT, 'common', 'apps'))

# set up memcached
CACHE_MIDDLEWARE_SECONDS = 1
CACHE_BACKEND = "memcached://localhost:11211/?timeout=%s"%(
    CACHE_MIDDLEWARE_SECONDS,
)
CACHE_MIDDLEWARE_KEY_PREFIX = ''

# need to add some MIDDLEWARE_CLSSES for working with memcached
MIDDLEWARE_CLASSES = (
    'django.middleware.cache.UpdateCacheMiddleware',
) + MIDDLEWARE_CLASSES + (
    'django.middleware.cache.FetchFromCacheMiddleware',
)

# workflow app that provides a bunch of management commands for managing
# the django project workflow
INSTALLED_APPS += (
    'common.apps.workflow',
)

# robots app
INSTALLED_APPS += (
    'robots',
)

# this is the filename where paths to other settings files are stored
SETTINGS_MODULES_FILENAME = os.path.join(
    PROJECT_ROOT, 
    'conf', 
    'settings_modules.txt'
)

# execute all settings files in SETTINGS_MODULES_FILENAME
for line in open(SETTINGS_MODULES_FILENAME):
    path = line.strip().split('#')[0]
    if path:
        abspath = os.path.abspath(os.path.join(PROJECT_ROOT, path))
        try:
            execfile(abspath)
        except IOError:
            message = "\033[31m"
            message += "Error: settings module does not exist: '%s'\n" % \
                abspath
            message += "Check to see if the entry is correct in '%s'\n" % \
                SETTINGS_MODULES_FILENAME
            message += "\033[0m"
            sys.stderr.write(message)
            sys.exit(1)

################################################################################
# The following compressor-app related wizardry needs to run after all
# INSTALLED_APPS have been added, so that the compressor knows which
# media directories to look in for scss definition files.
################################################################################

# compressor app http://django_compressor.readthedocs.org/
INSTALLED_APPS += (
    'compressor',
)
if django.VERSION > (1,3,0):
    STATICFILES_FINDERS += (
        'compressor.finders.CompressorFinder',
    )

# the manipulation of compiler load paths is used to accomplish the
# relatively hacky solution for the ability to overide the app scss
# definition files with project scss definitions files. First, the
# sass compiler will look in the "main app" (where all of the
# project-specific info is stored) and find scss files under other app
# names (for example,
# 'apps/main/static/example/scss_definitions/big_borders.scss'). Then,
# for each app, it adds '/apps/appname/static/' to list of paths to
# check. This forces the sass compiler to look in the project-specific
# directory first, before checking the app directory.
COMPILER_LOAD_PATHS = []

# add the project-specific load path (in the "main" app)
COMPILER_LOAD_PATHS.append(os.path.join(PROJECT_ROOT,'apps','main','static',))

# for each app, add the app-specific load path
for app in INSTALLED_APPS:
    dir_list = app.split('.')
    if (dir_list[0] == 'apps' and not dir_list[1] == 'main'):
        app_name = dir_list[1]
        load_path = os.path.join(PROJECT_ROOT,'apps',app_name,'static',)
        COMPILER_LOAD_PATHS.append(load_path)
    elif (dir_list[0]=="common" and dir_list[1]=="apps"):
        app_name = dir_list[2]
        load_path = os.path.join(PROJECT_ROOT,'common','apps',app_name,'static',)
        COMPILER_LOAD_PATHS.append(load_path)

# add the "app-specific" load path for the "common app"
COMPILER_LOAD_PATHS.append(os.path.join(PROJECT_ROOT,'common','static',))

# add the apps directories so you you can import scss_definitions files
# from app-specific load paths into a project-specific template
COMPILER_LOAD_PATHS.append(os.path.join(PROJECT_ROOT, 'apps',))
COMPILER_LOAD_PATHS.append(os.path.join(PROJECT_ROOT, 'common', 'apps',))

# go through list of candidates for sass executable and check to see if
# they exist. set the SASS_PATH to the first one that exists.
SASS_PATH_LIST = [
    '/var/lib/gems/1.8/bin/sass',
    '/var/lib/gems/1.8/gems/sass-3.2.1/bin/sass',
    '/var/lib/gems/1.8/gems/haml-3.0.25/bin/sass',
    '/Users/jpv/.rvm/gems/ruby-1.9.3-p286/bin/sass' # for OS X
]
SASS_PATH = None
for i in SASS_PATH_LIST:
    if os.path.isfile(i):
        SASS_PATH = i
        break
if SASS_PATH is None:
    message = 'Could not find path for sass.'
    raise ValueError(message)

COMPRESS_PRECOMPILERS = (
    ("text/x-scss", '%s --scss --load-path %s ' % (
        SASS_PATH, 
        ' --load-path '.join(COMPILER_LOAD_PATHS),
    )), 
    ("text/x-sass", '%s --load-path %s ' % (
        SASS_PATH, 
        ' --load-path '.join(COMPILER_LOAD_PATHS),
    )), 
)

###############################################################################
# The following are some functions that are convenient for setting up
# various canned settings that are not approrpriate for global
# consumption
###############################################################################
def _mysql_db_name(PROJECT_ROOT):
    """this function is used to identify a unique database name based
    on the path to this project from the parent directory of the
    project root. This (almost) guarantees that all databases will be
    named uniquely. For example, a mercurial root at
    
    /home/username/Projects/SomeHgRepo

    with a django project at 

    /home/username/Projects/SomeHgRepo/path/to/DjangoProject

    would be given a database name

    somehgrepo__path__to__djangoproject
    """
    
    # use fabric/mercurial to find the mercurial root from the
    # PROJECT_ROOT directory
    from common.bin import fabhelp
    hg_root = fabhelp.get_hg_root(PROJECT_ROOT)
    rel_path = os.path.relpath(PROJECT_ROOT, os.path.dirname(hg_root))

    # name the database based on this path to the PROJECT_ROOT
    db_name = rel_path.lower().replace(' ','_').replace(os.sep, '__')\
        .replace('-','_')
    return db_name

def _suburl_settings(server_name, PROJECT_ROOT, MEDIA_URL, 
                     SESSION_COOKIE_PATH, LOGIN_REDIRECT_URL, LOGIN_URL, 
                     LOGOUT_URL, CSRF_COOKIE_PATH, STATIC_URL):
    """setup the suburl settings for a django project hosted at
    xxxx.datascopeanalytics.com/foo
    """
    # parse the name of the subdirectory that will "mount" the django
    # project on the web server from the mod_wsgi configuation file
    _file = open(os.path.join(PROJECT_ROOT,"conf",server_name,"apache",
                              "%s.conf"%server_name),'r')
    _conf = _file.read()
    _file.close()
    SCRIPT_NAME = _conf.split("WSGIScriptAlias")[1].strip().split()[0]

    # ---------------------------------------------------------- RIP 2011.05.10
    # for all HARD-FUCKING-CODED urls that Django has by default, prepend
    # them with the SCRIPT_NAME (which is the subdirectory that the
    # project is "mounted" at with the web server)
    # 
    # the following list of variables that must be changes is inspired by
    # http://stackoverflow.com/questions/3232349/multiple-instances-of-django-on-a-single-domain
    MEDIA_URL = SCRIPT_NAME + MEDIA_URL
    SESSION_COOKIE_PATH = (SCRIPT_NAME + SESSION_COOKIE_PATH).rstrip('/')
    LOGIN_REDIRECT_URL = SCRIPT_NAME + LOGIN_REDIRECT_URL
    LOGIN_URL = SCRIPT_NAME + LOGIN_URL
    LOGOUT_URL = SCRIPT_NAME + LOGOUT_URL
    CSRF_COOKIE_PATH = SCRIPT_NAME + CSRF_COOKIE_PATH
    STATIC_URL = SCRIPT_NAME + STATIC_URL
    # -------------------------------------------------------------------------
    return (SCRIPT_NAME, MEDIA_URL, SESSION_COOKIE_PATH,
            LOGIN_REDIRECT_URL, LOGIN_URL, LOGOUT_URL, CSRF_COOKIE_PATH, 
            STATIC_URL, )

def _shared_user_sessions(project_dir, DATABASES, DATABASE_ROUTERS, 
                          MIDDLEWARE_CLASSES, db_name='default'):
    """use another database to share user and session data with
    another django project"""

    # specify the database here
    DATABASES.update({
        'usersandsessions': _get_database_info(project_dir=project_dir, 
                                               db_name=db_name),
    })

    # provide a router for accessing data from the ClientPage django
    # project
    DATABASE_ROUTERS = [
        'common.conf.db_routers.UserSessionRouter',
    ] + DATABASE_ROUTERS

    # # NOT SURE WHY, BUT THIS IS NOT NECESSARY AND CAUSES PROBLEMS...
    # MIDDLEWARE_CLASSES = (
    #     'common.conf.db_routers.RouterMiddleware',
    # ) + MIDDLEWARE_CLASSES

    return (DATABASES, DATABASE_ROUTERS, MIDDLEWARE_CLASSES)

def _get_database_info(project_dir=None, db_name='default'):
    """get the database information from another django project"""

    import re
    from fabric.api import local, lcd, hide, settings as fsettings
    
    # get the project dir
    if project_dir is None:
        with hide('running', 'stdout', 'stderr', 'warnings'):
            project_dir = local('pwd', capture=True)
    else:
        project_dir = os.path.abspath(project_dir)

    # get the database information for project_dir
    with lcd(project_dir):
        with hide('running', 'stdout', 'stderr', 'warnings'):
            with fsettings(warn_only=True):
                diffsettings = local("./manage.py diffsettings", capture=True)
    if diffsettings.failed:
        msg = "problem running diffsettings in %s: %s" % (
            project_dir,
            diffsettings.stderr,
        )
        print sys.path
        raise SystemError(msg)
    result = re.search(
        "DATABASES = (?P<DATABASES>.+)\n", 
        diffsettings,
    )
    if result is None:
        raise TypeError("does the project at %s have DATABASES specified?")
    d = result.groupdict()
    d = eval(d['DATABASES'])
    if not d.has_key(db_name):
        raise TypeError("can not find database info for db_name='%s'"%db_name)
    return d[db_name]
