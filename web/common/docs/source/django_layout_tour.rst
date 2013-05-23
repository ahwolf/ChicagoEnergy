.. _ref_django_project_layout:

Tour of the Django project layout
---------------------------------

The initial Django project layout should look like this::

  projectname/
    apps/       # put django apps in here
    common/     # the common subrepository that is used across all DsA projects
    conf/       # project-specific django, wsgi, virtualenv, and apache conf
    data/       # locally dumped data
    env/        # virtual environment 
    manage.py   # main executible script that we have modified for our projects
    .media/     # media directory for uploaded content (hidden)
    .static/    # media directory for css/img/js that doesn't change (hidden)

apps/
^^^^^

The ``apps`` directory is where all django apps are placed for a
particular django project, installed in the usual way with
``models.py``, ``urls.py``, etc::

  projectname/
    apps/
      example/
        __init__.py
        urls.py      # add generic app URLs here
        models.py    # add generic app models here
        views.py     # add generic app views here
        templates/   # add generic app templates here
        static/      # add generic app media here
      main/
        __init__.py
        urls.py      # add project-specific URLs here
        models.py    # add project-specific models here
        views.py     # add project-specific views here
        templates/   # add project-specific templates here
        static/      # add project-specific media here

It is worth pointing out that the ``apps/main`` directory is
"special"; it is included in every django project and is akin to the
normal django root. This is where we place all project-specific urls,
models, etc. 

common/
^^^^^^^

The ``common`` directory contains all of the reusable django code that
can be used (and continusously improved upon) in all DsA django
projects::

  projectname/
    common/
      apps/       # common apps for all django projects
        workflow/ # management commands for moving stuff around
      bin/        # common executables for all django projects (e.g., manage.py)
      conf/       # common django, apache, virtualenv, and wsgi configuration
      docs/       # the source of the documentation you are currently reading
      static/     # common media used across all projects (e.g., admin media, general css/js)
      templates/  # common templates (e.g., base.html, 404.html, admin stuff)

conf/
^^^^^

The conf directory stores all of the :ref:`project-specific django settings
<ref_settings>`, apache, wsgi, and virtualenv configuration::

  projectname/
    conf/
      settings_modules.txt        # list of app settings modules
      main.py                     # settings module for main app
      example.py                  # settings module for example app
      virtualenv_requirements.txt # virtualenv requirements for this project
      localhost/                  # localhost-specific settings for this project
      poisson/                    # staging-specific settings for this project
      noether/                    # production-specific settings for this project

data/
^^^^^

The data directory stores all of the data that should be shared with
the rest of the team for this django project. In cases where
:ref:`dbvcs is used <ref_dbvcs>`, this is the default location where
the flatfile fixtures are dumped by dbvcs. Depending on which apps are
installed in DBVCS_APPS, this directory might look something like
this::

  projectname/
    data/
      auth.json         # permissions and users dumped from auth app
      contenttypes.json # contenttypes app fixtures
      example.json      # example app fixtures
      main.json         # main app fixtures
      robots.json       # robots app fixtures
      sites.json        # sites app fixtures

env/
^^^^

The ``env`` directory contains the virtual environment for this django
instance. For more information, see the `virtualenv documentation`_.

.. _virtualenv documentation: http://pypi.python.org/pypi/virtualenv

{.static/,.media/}
^^^^^^^^^^^^^^^^^^

The ``.media`` and ``.static`` directories are intentionally hidden so
that we don't accidentally add things in here. All media should be
added to the appropriate app, which is soft-linked to in the
corresponding directories::

  projectname/
    .media/
      main->../apps/main/media/main/           # soft link to main media
      example->../apps/example/media/example/  # soft link to example media 
      uploads                                  # site-specific upload data
    .static/
      main->../apps/main/static/main/          # soft link to main static media
      example->../apps/example/static/example/ # soft link to example static media 

