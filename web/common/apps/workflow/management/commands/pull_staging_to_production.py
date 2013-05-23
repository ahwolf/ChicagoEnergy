import sys

from fabric.api import lcd, settings as fabric_settings

from common.apps.workflow.management.base import BaseCommand
from common.apps.workflow.management.option_parsers import \
    ProductionServerParser, HgVersionParser
from common.bin.fabfile import pull_staging_to_production

class Command(BaseCommand):
    __doc__ = """
    This command is used to pull the latest changes from the staging
    repository to the production server to be shared publicly at
    subdomain.datascopeanalytics.com/suburl.
    """
    args = ''
    help = __doc__
    option_list = BaseCommand.option_list + \
       tuple(ProductionServerParser('').option_list) + \
       tuple(HgVersionParser('').option_list)

    def handle(self, *args, **kwargs):
        self.check_args(*args, **kwargs)

        hg_revision = kwargs["hg_revision"]
        project_root = kwargs["project_root"]
        production_server = kwargs["production_server"]
        with lcd(project_root):
            with fabric_settings(host_string=production_server):
                pull_staging_to_production(hg_revision=hg_revision)
