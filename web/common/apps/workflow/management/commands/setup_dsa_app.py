import sys

from fabric.api import lcd

from django.core.management.base import CommandError

from common.apps.workflow.management.base import BaseCommand
from common.bin.fabfile import add_dsa_app

class Command(BaseCommand):
    __doc__ = """
    This command is used to add a DsA app from
    ssh://poisson//srv/hg/DjangoApps/app_name. This automatically adds
    the settings configurations to conf/app_name.py, modifies
    conf/settings_modules.txt, and runs syncdb.
    """
    args = 'app_name'
    help = __doc__

    def handle(self, *args, **kwargs):
        self.check_args(*args, **kwargs)
        
        app_name = args[0]
        project_root = kwargs["project_root"]
        with lcd(project_root):
            add_dsa_app(app_name)
