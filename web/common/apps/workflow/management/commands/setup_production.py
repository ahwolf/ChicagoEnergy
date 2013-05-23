import sys

from fabric.api import lcd, settings as fabric_settings

from common.bin.fabfile import setup_production
from common.apps.workflow.management.option_parsers import \
    ProductionServerParser
from setup_virtualenv import Command as BaseCommand

class Command(BaseCommand):
    __doc__ = """
    This command is used to setup the production
    environment. This command will not work until after the staging
    environment has been setup. All repositories are cloned and pulled
    directly from the staging server.
    """
    args = ''
    help = __doc__
    option_list = BaseCommand.option_list + \
       tuple(ProductionServerParser('').option_list)

    def handle(self, *args, **kwargs):
        self.check_args(*args, **kwargs)

        project_root = kwargs["project_root"]
        production_server = kwargs["production_server"]
        with lcd(project_root):
            with fabric_settings(host_string=production_server):
                setup_production()
