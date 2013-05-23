Under the hood
===============================================================================

.. _ref_virtualenv:

virtualenv
----------

We use `virtualenv`_ to make it possible to run different django
projects with different versions of django and other python
utilities. This is particularly important because we have several
different django projects running on our staging (poisson) and
production (noether) servers.

Setting up the virtualenv can be done quickly from the command line by running::

  [bash]$ ./manage.py setup_virtualenv

This will install the virtual python environment in the ./env/ directory.

To add additional packages to the virtualenv for a particular project,
simply add package names in the appropriate `pip file format`_ to the
conf/virtualenv_requirements.txt file (empty by default) and rerun the
setup_virtualenv command.

.. _virtualenv: http://pypi.python.org/pypi/virtualenv
.. _pip file format: http://www.pip-installer.org/en/latest/requirement-format.html

.. _ref_settings:

settings.py
-----------

We modularize the settings configuration by putting as much of the
gory details in common/conf/settings.py and then putting (most of) the
host-specific settings in common/conf/localhost/settings.py
(development), common/conf/poisson/settings.py (staging), and
common/conf/noether/settings.py (production). The settings files for
particular apps are added on separate lines in the
conf/settings_modules.txt like this::

  # This file has a list of settings files to execute as part of the
  # main settings.py. The paths to the settings files are relative to
  # the PROJECT_ROOT. Blank lines are ignored, and '#' is used for
  # commenting the rest of a line.

  # the main app is included in every project
  conf/main.py

  # adding my cheeseapp here
  conf/cheeseapp.py

and then placing all app-specific settings configuration in
conf/chesseapp.py like this::

  # add apps.cheeseapp to INSTALLED_APPS
  if 'apps.cheeseapp' not in INSTALLED_APPS:
      INSTALLED_APPS += ('apps.cheeseapp',)

  # add apps.cheeseapp to INSTALLED_APPS
  if 'apps.cheeseapp' not in DBVCS_APPS:
      DBVCS_APPS += ('apps.cheeseapp',)

For convenience, we have a command that automatically adds DsA apps to
an existing project and sets this up for you. 
