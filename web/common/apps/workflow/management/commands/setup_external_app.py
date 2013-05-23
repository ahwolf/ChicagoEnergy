import sys

from fabric.api import lcd

from django.core.management.base import CommandError

from common.apps.workflow.management.base import BaseCommand
# from common.bin.fabfile import add_external_app

class Command(BaseCommand):
    __doc__ = """
    This command is used to add an external app to the current django
    project. 

    NotImplementedError
    """
    args = ''
    help = __doc__

    def handle(self, *args, **kwargs):
        self.check_args(*args, **kwargs)
        
        raise NotImplementedError
