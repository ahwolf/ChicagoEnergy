.. _ref_customizing_templates:

Customizing templates
===============================================================================

The base.html template is based off of the `HTML5 Boilerplate project
<http://html5boilerplate.com/>`_ and has been extended to include lots
of useful snippets that we have incorporated over the years. For more
details, see the documentation on the `H5BP project GitHub repository
<https://github.com/h5bp/html5-boilerplate/>`_.

Learning by example
-------------------

over-ride base.html
^^^^^^^^^^^^^^^^^^^

By default, base.html is read from
common/.fallback_templates/base.html. To over-ride this base template,
create apps/main/templates/base.html. 

over-ride app/home.html
^^^^^^^^^^^^^^^^^^^^^^^

By default, app/home.html is read from
apps/app/templates/app/home.html. To over-ride this template, create
apps/main/templates/app/home.html


over-ride common/base.html
^^^^^^^^^^^^^^^^^^^^^^^^^^

By default, common/base.html is read from
common/templates/common/base.html. To over-ride this template, create
apps/main/templates/common/base.html

over-ride admin/*
^^^^^^^^^^^^^^^^^

By default, the admin/* templates are read from
common/templates/common/admin/. To over-ride these templates, create
the appropriate files in apps/main/templates/admin/.

extend base.html
^^^^^^^^^^^^^^^^

By default, the base.html template is read from
common/.fallback_templates/base.html. To extend base.html, create an
apps/main/templates/base.html template that looks something like
this::

  {# apps/main/templates/base.html #}
  {% extends "common/base.html" %}

  {# alter, tailor, and add functionality here #}

extend app/home.html
^^^^^^^^^^^^^^^^^^^^

By default, the app/home.html template is read from
apps/app/templates/app/home.html. To extend this template, create an
apps/main/templates/app/home.html template that looks something like
this::

  {# apps/main/templates/app/home.html #}
  {% extends "app/templates/app/home.html" %}

  {# alter, tailor, and add functionality here #}

Under the hood
--------------

Templates are loaded first from the filesystem in directories
specified in TEMPLATE_DIRS, then from app-specific template
directories (*e.g.*, apps/blog/templates) that are defined in
INSTALLED_APPS, and finally from django-contributed app directories
(via /path/to/django). This scheme is designed such that the
app-specific templates can always be customized for a particular
django project by a identically named template in one of the
TEMPLATE_DIRS. By default, the TEMPLATE_DIRS environment variable for
our django project layout is::

  TEMPLATE_DIRS = (
      'apps/main/templates',
      'common/templates',
      'common/.fallback_templates',
      'apps',
      '/path/to/django',
  )

apps/main/templates
^^^^^^^^^^^^^^^^^^^

This directory includes templates that over-ride app templates or any
project-specific templates. For instance, this directory may contain
app-specific override templates (*e.g.*
apps/main/templates/livingreport/base.html) or project-specific custom
templates (*e.g.*, home.html or 404.html).

common/templates
^^^^^^^^^^^^^^^^

This directory contains several common django templates that may be
used across different django projects. For example, this directory
contains several base templates, such as
common/base_centered_wide.html that are designed for various devices
(*e.g.*, iPad). These templates can then be extended by templates in
apps/main/templates for usage across several projects without changing
the common base template.

common/.fallback_templates
^^^^^^^^^^^^^^^^^^^^^^^^^^

This soft-link to the common/templates/common directory makes it
possible to automatically use several of the common templates provided
in common/templates/common without having to extend them in
apps/main/templates. For instance, this directory makes it possible to
use a generic base.html, 404.html, copyright.html, and
loggedinas.html.

apps
^^^^

This directory makes it such that, within a project, you can extend an
app-specific template in apps/main/templates. For example, a
clientpage application has a apps/main/templates/base.html
that extends clientpage/templates/clientpage.base.html.

/path/to/django
^^^^^^^^^^^^^^^

This directory makes it such that, within a project, you can extend a
django template with the same name. For example,
common/templates/common/admin/base.html extends
/path/to/django/contrib/admin/templates/admin/base.html so that
updates to the admin in new versions of django are automatically
integrated into our projects.
