import sys

from fabric.api import lcd, settings as fabric_settings

from common.apps.workflow.management.base import BaseCommand
from common.apps.workflow.management.option_parsers import StagingServerParser,\
    HgVersionParser
from common.bin.fabfile import pull_development_to_staging

class Command(BaseCommand):
    __doc__="""
    This command is used to pull the latest changes from the
    development repository to the staging server. If this project will
    ultimately live at subdomain.datascopeanalytics.com/suburl (as
    specified when the ``manage.py setup_staging`` command was run),
    then these changes can be viewed at
    staging.datascopeanalytics.com/subdomain/suburl for testing
    purposes before sharing the project publicly on the production
    server.
    """
    args = ''
    help = __doc__
    option_list = BaseCommand.option_list + \
       tuple(StagingServerParser('').option_list) + \
       tuple(HgVersionParser('').option_list)

    def handle(self, *args, **kwargs):
        self.check_args(*args, **kwargs)

        hg_revision = kwargs["hg_revision"]
        project_root = kwargs["project_root"]
        staging_server = kwargs["staging_server"]
        with lcd(project_root):
            with fabric_settings(host_string=staging_server):
                pull_development_to_staging(hg_revision=hg_revision)
