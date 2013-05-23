import sys

from fabric.api import lcd, settings as fabric_settings

from common.apps.workflow.management.base import BaseCommand
from common.apps.workflow.management.option_parsers import \
    ProductionServerParser
from common.bin.fabfile import pull_production_to_localhost

class Command(BaseCommand):
    __doc__ ="""
    This command is used to pull the latest changes from the production
    server to the localhost. This can be useful, for example, for
    obtaining the latest data that was entered by a client on the
    production server.
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
                pull_production_to_localhost()
