.. Django project layout documentation master file, created by
   sphinx-quickstart on Thu May  5 05:43:32 2011.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

Documentation for DsA Django project layout
===========================================

Even in DsA's infancy, we develop 5-20 new django projects (*e.g.*,
dashboards, Living Reports, etc) per year. We have noticed that this
can be a very time consuming task; you have to set up the initial
django project, prepare the settings configuration, manage the media
(css, javascript, imgages, etc.) in a smart way, develop some base
templates, design the styling, and then make all of that accessible on
a staging and production server. And this is all done *before* you
even create any new models or do anything useful for your particular
django project.

Rather than copy-and-pasting previous configurations and using ad-hoc
work-arounds for particular circumstances, the purpose of this project
is to automate the better part of the django setup process so that we
can maintain and continusously improve our "best
practices". Specifically, this django project setup includes a family
of scripts that automatically creates a django project with a
reasonable template and media hierarchy that is designed so that it is
easy to override the (already well-designed) default behavior. That
is, this project layout makes the django development cycle as `DRY`_
as possible and it is based on the current best practices of the
Django community [#f1]_ [#f2]_.

.. toctree::
   :maxdepth: 1

   starting_django_project
   workflow
   customizing_templates
   tailoring_styling
   under_the_hood
   django_layout_tour

.. note:: It is expected that you are already familiar with `python`_
   and `django`_ and that you are at least aware of `scss`_,
   `mercurial`_, `virtualenv`_, `fabric`_, and `bash scripting`_.

.. note:: This documentation is *not* intended to be a static
   document. If anything is unclear, misleading, inconsistent, or
   otherwise baffling, **please edit the documentation** to improve it
   for the next person that reads it. This documentation is
   automatically generated with `reStructuredText`_ by `sphinx`_.

.. rubric:: Additional resources:

.. [#f1] `Chicago Tribune django project layout`_
.. [#f2] `pip, virtualenv, and wsgi`_

.. todolist::

.. ...................................................................... links
.. _DRY: http://en.wikipedia.org/wiki/Don't_repeat_yourself
.. _python: http://www.python.org
.. _django: http://www.djangoproject.com
.. _scss: http://sass-lang.com
.. _mercurial: http://mercurial.selenic.com
.. _virtualenv: http://pypi.python.org/pypi/virtualenv
.. _fabric: http://docs.fabfile.org/en/1.0.1/index.html
.. _bash scripting: http://linuxconfig.org/Bash_scripting_Tutorial
.. _reStructuredText: http://docutils.sourceforge.net/rst.html
.. _sphinx: http://sphinx.pocoo.org
.. _Chicago Tribune django project layout: http://blog.apps.chicagotribune.com/2010/03/08/advanced-django-project-layout/
.. _pip, virtualenv, and wsgi: http://www.saltycrane.com/blog/2009/05/notes-using-pip-and-virtualenv-django/

