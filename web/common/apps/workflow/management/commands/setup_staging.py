import sys

from fabric.api import lcd, settings as fabric_settings, local

from common.bin.fabfile import setup_staging
from common.apps.workflow.management.option_parsers import StagingServerParser,\
    ApacheSetupParser
from setup_virtualenv import Command as BaseCommand

class Command(BaseCommand):
    __doc__ = """
    This command is used to initialize the staging
    environment for this project. It automatically creates all of the
    apache files needed for both staging and production but it does
    NOT initialize the production server.

    production_root_url: URL of the ultimately served project
    (e.g. subdomain.datascopeanalytics.com/suburl)
    """

    args = 'production_root_url'
    help = __doc__
    option_list = BaseCommand.option_list + \
       tuple(StagingServerParser('').option_list) + \
       tuple(ApacheSetupParser('').option_list)

    def handle(self, *args, **kwargs):
        self.check_args(*args, **kwargs)

        production_root_url = args[0]
        staging_server = kwargs["staging_server"]
        project_root = kwargs["project_root"]
        parent_project = kwargs["parent_project"]
        use_master_auth = not kwargs["no_master_auth"]
        with lcd(project_root):
            with fabric_settings(host_string=staging_server):
                setup_staging(
                    production_root_url, 
                    local_master_django_project_dir=parent_project,
                    use_master_auth=use_master_auth,
                )
