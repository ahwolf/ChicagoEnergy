import sys
from optparse import OptionParser, make_option

class BaseParser(OptionParser):

    option_list = ()

    def __init__(self, *args, **kwargs):
        if not kwargs.has_key('option_list'):
            kwargs['option_list'] = self.option_list
        OptionParser.__init__(self, *args, **kwargs)

class HgVersionParser(BaseParser):
    
    option_list = BaseParser.option_list + (
        make_option(
            "-r", "--revision", dest="hg_revision",
            type="str", 
            help="hg revision ['%default']",
            default="tip",
        ),
    )

class VirtualenvParser(BaseParser):
    option_list = BaseParser.option_list + (
        # make_option('-e', '--virtualenv_name', dest='virtualenv_name',
        #             type='str',
        #             help="name of the python virtualenv ['%default']",
        #             default="env"),
    )

class StagingServerParser(BaseParser):

    option_list = BaseParser.option_list + (
        make_option('-s', '--staging_server', dest='staging_server',
                    type='str',
                    help="staging server name ['%default']",
                    default='li133-35.members.linode.com'),
    )

class ProductionServerParser(BaseParser):

    option_list = BaseParser.option_list + (
        make_option('-p', '--production_server', dest='production_server',
                    type='str',
                    help="production server name ['%default']",
                    default='li245-232.members.linode.com'),
    )

class ServerParser(StagingServerParser, ProductionServerParser):
    
    option_list = StagingServerParser.option_list \
        + ProductionServerParser.option_list

class ApacheSetupParser(BaseParser):
    
    option_list = BaseParser.option_list + (
        make_option('-r', '--parent_project', dest='parent_project',
                    type='str',
                    help="parent django project that hosts root domain of"+\
                        "this suburl django project ['%default']",
                    default=''),
        make_option('--no-master-auth', dest='no_master_auth',
                    action="store_true",
                    help="When specifying a parent project with -r, don't use"+\
                        " parent project's auth database. ['%default']",
                    default=False),
    )

class TestHyperlinksParser(BaseParser):

    option_list = BaseParser.option_list + (
        make_option(
            '--domain', type='str', dest='domain', 
            default='http://localhost:8000/',
            help="test the existance of all hyperlinks originating from this"+\
                " domain. ['%default']",
        ),
        make_option(
            '--max-depth', type='int', dest='max_depth', 
            default=sys.maxint,
            help="check the existance of all links in the specified domain up to and including max depth distance from starting url specified by --domain ['%default']",
        ),
    )
