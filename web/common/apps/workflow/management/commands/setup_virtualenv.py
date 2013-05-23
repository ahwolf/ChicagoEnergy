import sys
import os
import optparse

from fabric.api import lcd

from common.apps.workflow.management.base import BaseCommand
from common.apps.workflow.management.option_parsers import VirtualenvParser
from common.bin.fabfile import setup_virtualenv

class Command(BaseCommand):
    __doc__ = """
    This command is used to setup the virtual
    environment. For more details, see the `virtualenv documentation`_
    
    .. _virtualenv documentation: http://pypi.python.org/pypi/virtualenv
    """

    args = ''
    help = __doc__
    option_list = BaseCommand.option_list + \
       tuple(VirtualenvParser('').option_list)

    def handle(self, *args, **kwargs):
        self.check_args(*args, **kwargs)

        virtualenv_name = "env"
        project_root = kwargs["project_root"]
        with lcd(project_root):
            setup_virtualenv(virtualenv_name)
