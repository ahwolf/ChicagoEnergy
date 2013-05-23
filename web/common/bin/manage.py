#!/usr/bin/env python

import os
import sys

# NOTE: if you see errors like this when loading pages:
# 
#     Exception AttributeError: AttributeError("'_DummyThread' object has no attribute '_Thread__block'",) in <module 'threading' from '/usr/lib/python2.7/threading.pyc'> ignored
# 
# rest assured that this is actually a bug in python2.7 (hard to
# believe, I know) http://bugs.python.org/issue14308

def main():

    # Work out the project module name and root directory, assuming
    # that this file is located at [project]common/conf/manage.py
    PROJECT_DIR, PROJECT_MODULE_NAME = os.path.split(
        os.path.dirname(os.path.dirname(os.path.realpath(__file__))))

    # although an argument is always required when actually running this
    # script, for tab completion, the argument is not yet
    # supplied. Handling the error like this allows tab completion
    try:
        management_command = sys.argv[1]
    except IndexError:
        management_command = '_tab_completion'
    setup_virtualenv_command = 'setup_virtualenv'

    os.environ['DJANGO_MANAGEMENT_COMMAND'] = management_command

    # set project-specific environment variables as added in os.environ
    # statements
    environment = os.path.join(PROJECT_DIR, "conf", "environment.py")
    if os.path.exists(environment):
        execfile(environment)

    # insert the current PROJECT_DIR into the virtualenv
    sys.path.insert(0, PROJECT_DIR)

    # activate the virtual environment --- this must be done very
    # early in the manage.py script to use the correct version of
    # django. If you look at the activate_this.py script, it adds
    # everything to site.addsitedir and manipulates the path so the
    # only thing we should have to do is execute this script.
    activate_this = os.path.join(PROJECT_DIR, 'env', 'bin', 'activate_this.py')
    try:
        execfile(activate_this, dict(__file__=activate_this))
    except IOError:
        if management_command != setup_virtualenv_command:
            message = "need to run %s %s" % (
                os.path.join(PROJECT_DIR, "manage.py"),
                setup_virtualenv_command,
            )
            raise Exception(message)

    # Check that the project module can be imported. This is important
    # to make sure that the virtualenv is working correctly.
    try:
        __import__(PROJECT_MODULE_NAME)
    except ImportError:
        # Couldn't import the project, place it on the Python path and
        # try again.
        sys.path.append(PROJECT_DIR)
        try:
            __import__(PROJECT_MODULE_NAME)
        except ImportError:
            sys.stderr.write("Error: Can't import the \"%s\" project module." %
                             PROJECT_MODULE_NAME)
            sys.exit(1)

    # The following is inspired by (stolen from)
    # https://github.com/lincolnloop/django-startproject/blob/master/django_startproject/project_template/myproject/bin/manage.py
    from django import get_version
    from django.core.management import LaxOptionParser
    from django.core.management.base import BaseCommand
    def has_settings_option():
        parser = LaxOptionParser(usage="%prog subcommand [options] [args]",
                                 version=get_version(),
                                 option_list=BaseCommand.option_list)
        try:
            options = parser.parse_args(sys.argv[:])[0]
        except:
            return False # Ignore any option errors at this point.
        return bool(options.settings)

    if not has_settings_option() and not 'DJANGO_SETTINGS_MODULE' in os.environ:
        settings_module = 'conf.localhost.settings'
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', settings_module)

    from django.conf import settings
    if management_command == setup_virtualenv_command:
        settings.configure(
            DEBUG=True,
            INSTALLED_APPS=('common.apps.workflow',),
        )

    # print warning about things not working properly. actually
    # running the script is not advisable because it slows down the
    # manage.py reload, which is pretty annoying during development
    if management_command == 'runserver':
        from fabric.colors import yellow as color
        print(color("IF ANYTHING IS NOT PROPERLY INSTALLED, RUN"))
        print(color("    ./common/bin/install_dependencies.py"))
        print(color(""))

    # try to run the management command. catch error if shit fails with a
    # missing db
    from django.core.management import execute_from_command_line
    from MySQLdb import OperationalError
    try:
        execute_from_command_line(argv=sys.argv)
    except OperationalError, e:
        # this catches error correctly when running syncdb command, but
        # not when running runserver command. may be fixed in django 1.4+
        # https://docs.djangoproject.com/en/dev/releases/1.4-beta-1/#updated-default-project-layout-and-manage-py
        if e.args[0] in (1044, 1045, 1049, ):
            from fabric.colors import red as color
            print(color("UNKNOWN DATABASE ERROR: %s" % (e.args, )))
            print(color("TO FIX, RUN:"))
            print(color("    ./common/bin/setup_mysql.py"))
        else:
            raise

if __name__ == "__main__":
    main()
