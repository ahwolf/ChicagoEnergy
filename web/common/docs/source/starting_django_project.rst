Starting a Django project
===============================================================================

To start a new django project, you must have a local copy of the
ssh://poisson//srv/hg/Templates/Django repository. If you have not
done so already::

  [bash]$ hg clone ssh://poisson//sr/hg/Templates/Django /path/to/Templates/Django

Then you can start a new django project by running::

  [bash]$ /path/to/Templates/Django/bin/init_django_project.py projectname

which uses `fabric`_ to locally create a django project with the most
recent version of the DsA django layout as well as locally install any
packages that are required by our django layout. If this correctly ran
without any errors (if not, let us know because its a bug!), you
should be able to run::

  [bash]$ cd projectname
  [bash]$ ./manage.py runserver

.. _fabric: http://docs.fabfile.org/en/1.0.1/index.html

and open a browser to `your localhost <http://localhost:8000>`_ and
you should see a very basic webpage stating that the project is
working.  Without going into too much detail (see :ref:`here
<ref_django_project_layout>` for details), this results in a project
that looks something like::

  projectname/
    apps/       # put django apps in here
    common/     # the common subrepository that is used across all DsA projects
    conf/       # django, wsgi, and apache configuration
    data/       # locally dumped data
    env/        # virtual environment 
    .media/     # media directory for uploaded content (hidden)
    .static/    # media directory for css/img/js that doesn't change (hidden)

This general project layout is designed to make our code as reusable
as possible while allowing us to :ref:`customize the templating
<ref_customizing_templates>` or to :ref:`tailor the styling
<ref_tailoring_styling>` with minimal effort. Indeed, we have even
written some scripts that automatically create two types of django
projects out of the box::

  [unix]$ /path/to/Templates/Django/bin/init_clientpage_project.py --help
  [unix]$ /path/to/Templates/Django/bin/init_livingreport_project.py --help

These commands selectively execute many common setup scripts that are
provided in the ``common/apps/workflow`` django app. The following
commands are also useful in various circumstances for setting up the
development environment, adding apps, or setting up the staging and
production environments.

.. _ref_dbvcs:

.. note:: dbvcs is no longer included in our django setup by default,
  this app can be added on initialization of projects by specifying
  the ``--dbvcs`` flag on any init script like this::

    [unix]$ /path/to/Templates/Django/bin/init_django_project.py --dbvcs project

  The dbvcs (DataBase Version Control System) app is used to
  synchronize local database backends (sqlite, mysql, etc.) with
  flatfile fixtures that are readily managed by version control
  systems like mercurial. This can be really helpful for projects
  where the database is relatively small to coordinate data across a
  distributed team, but can become a pain in the ass for larger
  databases that slow down the database to fixture conversion.


manage.py setup_virtualenv
^^^^^^^^^^^^^^^^^^^^^^^^^^

.. automodule:: common.apps.workflow.management.commands.setup_virtualenv
   :members: Command

manage.py setup_dsa_app app_name
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. automodule:: common.apps.workflow.management.commands.setup_dsa_app
   :members: Command

manage.py setup_external_app
^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. automodule:: common.apps.workflow.management.commands.setup_external_app
   :members: Command

manage.py setup_staging production_root_url
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. automodule:: common.apps.workflow.management.commands.setup_staging
   :members: Command


manage.py setup_production
^^^^^^^^^^^^^^^^^^^^^^^^^^

.. automodule:: common.apps.workflow.management.commands.setup_production
   :members: Command
