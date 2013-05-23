.. _ref_tailoring_styling:

Tailoring styling
===============================================================================

Generally, the css styling system is designed to behave in much the
same way as the django templating system, by first loading customized
css files for projects from the main app, then loading app/common
styling, and finally loading some default styling from common when
appropriate. The key component to making apps with portable styling is
to separate the derived css (*e.g.*, li.width) from the css that
"defines" how things are layed out (*e.g.*, page width). 

over-ride app/scss_definitions/color_scheme.scss
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

By default, the app/scss_definitions/color_scheme.scss file is loaded
from apps/app/media/app/scss_definitions/color_scheme.scss file. To
over-ride this base template, create
apps/main/media/app/scss_definitions/color_scheme.scss with all of the
same (but customized) parameters.

Under the hood
--------------

Customizing the css styling of particular django apps should be as
easy as customizing a template. To drastically reduce the amount of
time we spend redesigning webpages, we have developed a scheme for
compiling scss files that rely on a small number of scss definitions
(*e.g.*, $page_width). This styling is controlled by the
COMPILER_LOAD_PATHS variable in common/conf/settings.py::

  COMPILER_LOAD_PATHS = [
      apps/main/static,
      {apps/app/static,common/apps/app/static},
      common/static,
  ]

apps/main/static
^^^^^^^^^^^^^^^^

This directory holds the css and scss_definitions directories for the
project as a whole. This directory also holds all project-specific
overrides of common and app style sheets. For instance, to override
app/scss_definitions/page_layout.scss, you should create a file in
apps/main/static/app/scss_definitions/page_layout.scss. 

This directory also contains, by default, the DsA styling and images
for using DsA's color schemes and logos.

apps/app/static,common/apps/app/static
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

These directories hold app/common static media. By convention, these
directories have the following structure::

  apps/app/static/
                  app/
                      css/
                      scss_definitions/
  common/apps/app/static/
                         app/
                             css/
                             scss_definitions/

This directory layout makes it possible to *just* over-ride the
scss_definitions files for a particular project without having to
totally redesign the entire app layout.

common/static
^^^^^^^^^^^^^

This directory holds all of the base media for base templates (*e.g.*,
common/static/common/css/centered_wide.scss).
