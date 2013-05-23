import sys

from fabric.api import lcd, settings as fabric_settings

from common.apps.workflow.management.base import BaseCommand
from common.apps.workflow.management.option_parsers import \
    StagingServerParser
from common.bin.fabfile import pull_staging_to_localhost

class Command(BaseCommand):
    __doc__ = """
    This command is used to pull the latest changes from the staging
    server to the localhost. This can be useful, for example, when you
    make changes on the staging server for testing purposes and you want
    to pull them into your local copy.
    """
    args = ''
    help = __doc__
    option_list = BaseCommand.option_list + \
       tuple(StagingServerParser('').option_list)

    def handle(self, *args, **kwargs):
        self.check_args(*args, **kwargs)

        project_root = kwargs["project_root"]
        staging_server = kwargs["staging_server"]
        with lcd(project_root):
            with fabric_settings(host_string=staging_server):
                pull_staging_to_localhost()
