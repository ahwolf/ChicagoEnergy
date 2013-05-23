import sys
import os
import optparse

from django.core.management.base import CommandError, \
    BaseCommand as DjangoBaseCommand

from common.bin import fabhelp

class BaseCommand(DjangoBaseCommand):

    option_list = DjangoBaseCommand.option_list + (
        optparse.make_option("--project_root",
            dest="project_root",
            default=os.getcwd(),
            help="the path to the django project root. convenient for running"+\
                        " workflow management commands out of the django path"),
        )

    def create_parser(self, prog_name, subcommand):
        """
        Create and return the ``OptionParser`` which will be used to
        parse the arguments to this command.

        SELECTIVELY OVERWRITTEN TO SET conflict_handler
        """
        return optparse.OptionParser(
            prog=prog_name,
            usage=self.usage(subcommand),
            version=self.get_version(),
            option_list=self.option_list,
            conflict_handler="resolve",
        )

    def handle(self, *args, **kwargs):
        self.check_args(*args, **kwargs)

    def check_args(self, *args, **kwargs):
        """type checking for all arguments. override in child classes
        as necessary."""

        # make sure the correct number of arguments have been
        # specified
        self.assert_n_args(args)

        # make sure the project root is correctly specified
        project_root = kwargs["project_root"]
        self.assert_django_root(project_root)

    def assert_n_args(self, args):
        """check to make sure that the correct number of arguments
        have been specified"""

        n_args = len(self.args.split())
        if n_args != len(args):
            msg = "must specify at least %d args: '%s'"%(n_args, self.args)
            raise CommandError(msg)

    def assert_django_root(self, project_dir=None):
        """check whether the project_dir (or cwd) is the django root"""

        project_dir = project_dir or os.getcwd()

        # make sure that the project dir has the following subdirectories
        if not fabhelp.is_django_project(project_dir):
            if project_dir == os.getcwd():
                msg = "Must run this command from django root" + \
                    " or specify --project_root from the command line"
                raise CommandError(msg)
            else:
                msg = "Specified --project_root not the django root."
                raise CommandError(msg)
