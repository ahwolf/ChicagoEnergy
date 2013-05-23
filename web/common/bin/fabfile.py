from __future__ import with_statement

import sys
import os
import tempfile
import time
import ConfigParser
import urlparse
import re
import collections
import json

from fabric.api import *
from fabric.utils import abort, warn
import fabric.contrib.files
from fabric.context_managers import settings as fabric_settings
import fabhelp

class ProductionRootUrl(object):
    
    def __init__(self, url_str=None):
        super(ProductionRootUrl, self).__init__()

        # obtain production root url from apache files
        if url_str is None:
            django_project_dir = local("pwd", capture=True)
            apache_conf = os.path.join(django_project_dir, "conf", "noether", 
                                       "apache", "noether.conf")
            try:
                with open(apache_conf,'r') as f:
                    s = f.read()
            except IOError:
                abort("can not find apache configuration %s"%apache_conf)
            result = re.search(
                r"WSGIScriptAlias\s(?P<suburl>.+)\s(?P<path>.+)", 
                s,
            )
            if result is None:
                msg="malformed WSGIScriptAlias in %s"%apache_conf
                abort(msg)
            d = result.groupdict()
            domain = d["path"].split('/')[3]
            suburl = d["suburl"]
            if suburl == '/':
                suburl = ''
            url_str = domain + suburl

        # mimick urlparse.ParseResult attributes
        x = urlparse.urlparse(url_str)
        self.scheme = x.scheme
        self.netloc = x.netloc
        self.path = x.path
        self.params = x.params
        self.query = x.query
        self.fragment = x.fragment

        # add subdomain for convenience
        y = x.path.split('/', 1)[0].split('.')
        if len(y)==3:
            self.subdomain = y[0]
        elif len(y)<3:
            self.subdomain = ''
        else:
            raise TypeError("what is subdomain in this case?")

        # add suburl for convenience
        if self.path.endswith('/'):
            raise TypeError("do not have trailing backslash!")
        if '/' in x.path:
            self.suburl = '/' + x.path.split('/', 1)[1]
        else:
            self.suburl = ''

        # add domain for convenience
        self.domain = x.path.split('/', 1)[0]

        if not self.domain.endswith("datascopeanalytics.com"):
            msg = "everything is assumed to be under datascopeanalytics.com"
            raise TypeError(msg)

    def gettuple(self):
        return (
            self.scheme,
            self.netloc,
            self.path,
            self.params,
            self.query,
            self.fragment,
        )
            
    def geturl(self):
        return urlparse.ParseResult(*self.gettuple()).geturl()

def clone_subrepository(subrepo_url, local_path):
    """clone a mercurial subrepository and handle all of the .hgsub stuff"""

    # clone the common subrepository
    hg_root = fabhelp.get_hg_root()
    fabhelp.progress("create the '%s' subrepository" % 
                     os.path.relpath(local_path, hg_root))
    local("hg clone %s %s"%(subrepo_url, local_path))

    # update .hgsub
    hgsub_filename = os.path.join(hg_root, ".hgsub")
    if os.path.exists(hgsub_filename):
        with open(hgsub_filename) as hgsub_file:
            hgsub = hgsub_file.read()
        # add a trailing newline character
        if hgsub!='' and not hgsub.endswith('\n'):
            hgsub += '\n'
    else:
        hgsub = ''
        
    with open(hgsub_filename,'w') as hgsub_file:
        hgsub_file.write(hgsub)
        hgsub_file.write("%s = %s\n"%(
            os.path.relpath(os.path.join(local("pwd",capture=True),local_path), hg_root),
            subrepo_url,
        ))

def get_pip_version():
    """Parse the version info from output of command line"""
    pip_version = local("pip --version", capture=True)
    pip_version_number = pip_version.split()[1]
    pip_major_version, pip_minor_version = pip_version_number.split('.', 1)
    pip_version = int(pip_major_version) + 0.1 * float(pip_minor_version)
    return pip_version

def setup_virtualenv(virtualenv_name, run_func=local):
    """setup the virtual environment"""

    # make sure that virtualenv is installed
    with settings(warn_only=True):
        if run_func == local:
            virtualenv_exe = run_func("which virtualenv", capture=True)
        else:
            virtualenv_exe = run_func("which virtualenv")
        if virtualenv_exe.failed:
            sudo("apt-get install python-virtualenv")
            if run_func == local:
                virtualenv_exe = run_func("which virtualenv", capture=True)
            else:
                virtualenv_exe = run_func("which virtualenv")

    # set up the virtual environment
    fabhelp.progress("set up the virtual environment")
    
    # change 10/31/2012- using environment variables to specify using
    # setuptools instead of the command option. hopefully this will
    # work across multiple versions of virtualenv
    run_func("export VIRTUALENV_DISTRIBUTE=false")
    run_func("export VIRTUALENV_USE_SETUPTOOLS=true")
    run_func("%s --no-site-packages %s"%(
        virtualenv_exe,
        virtualenv_name,
    ))
    virtualenv_requirements = [
        os.path.join("common", "conf", "virtualenv_requirements.txt"),
        os.path.join("conf", "virtualenv_requirements.txt"),
    ]
    pip_version = get_pip_version()
    PIP_REMOVED_ENVIRONMENT_OPTION = 1.1
    for virtualenv_requirement in virtualenv_requirements:
        if pip_version < PIP_REMOVED_ENVIRONMENT_OPTION:
            run_func("if [ -s %s ]; then pip install -E %s -r %s; fi"%(
                virtualenv_requirement,
                virtualenv_name,
                virtualenv_requirement,
            ))
        else:
            run_func("if [ -s %s ]; then virtualenv %s && %s/bin/pip install -r %s; fi"%(
                virtualenv_requirement,
                virtualenv_name,
                virtualenv_name,
                virtualenv_requirement,
            ))

    hg_root = fabhelp.get_hg_root()
    if run_func == local:
        project_dir = run_func("pwd", capture=True)
    else:
        project_dir = run_func("pwd")
    project_name = os.path.basename(project_dir)

    # add virtualenv to hgignore
    if run_func == local:
        fabhelp.progress("add virtualenv to .hgignore")
        ignore_patterns = (
            os.path.relpath(os.path.join(project_dir,virtualenv_name),hg_root),
        )
        fabhelp.add_to_hgignore(
            ignore_patterns,
            syntax="glob",
            comment="ignore virtualenv for project '%s'"%project_name,
        )

def render_apache_configuration(production_root_url, 
                                local_master_django_project_dir=''):
    """setup apache configuration files for BOTH staging and
    production. this does NOT manipulate apache configuration on
    remote servers. it is only intended torender the apache
    templates
    """
    msg = "setup apache configuration files for BOTH staging and production"
    fabhelp.progress(msg)

    # if the production root url has a suburl, the
    # local_master_django_project_dir must be specified!!! WARNING: do not
    # remove this condition --- it is used very strongly below to
    # assume when things need to be written to the staging apache conf
    if production_root_url.suburl and not local_master_django_project_dir:
        msg = "if production_root_url is a suburl django project,\n"
        msg += "you must specify the --parent_project option\n"
        raise TypeError(msg)

    # make sure that master_conf_filename exists if it is specified
    if local_master_django_project_dir:
        local_master_django_project_dir = \
            os.path.abspath(local_master_django_project_dir)
        if not fabhelp.is_django_project(local_master_django_project_dir):
            msg="--parent_project must point to a django project root.\n" 
            msg+="'%s' is not a django project root" % (
                local_master_django_project_dir,
            )
            abort(msg)

        # also need to make sure that local_master_django_project_dir
        # is actually hosting the same domain, otherwise could cause
        # problems!
        filename = os.path.join(local_master_django_project_dir,
                                "conf", "noether", "apache", "noether.conf")
        try:
            f = open(filename)
        except IOError:
            msg = "can not find parent project apache conf in %s\n"%filename
            msg += "have you run setup_staging in %s yet?" % (
                local_master_django_project_dir,
            )
            abort(msg)
        s = f.read()
        f.close()
        result = re.search(r"<VirtualHost (?P<domain>[\w\.]+):\d+>", s)
        if result is None:
            msg = "apache configuration file (%s)\n"%filename 
            msg += "does not appear to be the root VirtualHost"
            abort(msg)
        master_domain = result.groupdict()["domain"]
        if production_root_url.domain!=master_domain:
            msg = "domain of parent_project (%s)\n" % master_domain
            msg += "does not match specified domain (%s)"%(
                production_root_url.domain,
            )
            abort(msg)

    # get the project name --- remember, this command is always run
    # from within the django project
    project_dir = local('pwd', capture=True)
    project_name = os.path.basename(project_dir)

    # setup django
    from django.conf import settings as django_settings
    from django.template.loader import render_to_string
    try:
        django_settings.configure(
            DEBUG=True, 
            TEMPLATE_DEBUG=True,
            TEMPLATE_DIRS=(
                os.path.join(project_dir, 'common', 'templates'),
            ),
        )
    except RuntimeError:
        pass # this is being run from the setup_{staging,production}
             # django command --- hopefully

    # set things up for both staging and production
    for server in ("poisson", "noether",):

        # determing the template to use 
        suburl = production_root_url.suburl
        if server=="poisson" or local_master_django_project_dir:
            conf_template = os.path.join("apache", "suburl.conf")
            if server=="poisson":
                suburl = '/' + production_root_url.subdomain + suburl
        else:
            conf_template = os.path.join("apache", "root.conf")

        # write the configuration template for this server
        conf_filename = os.path.join(project_dir, "conf", 
                                     server, "apache", "%s.conf"%server)
        local("mkdir -p %s"%os.path.dirname(conf_filename))
        hg_root = fabhelp.get_hg_root()
        f = open(conf_filename, 'w')
        f.write(render_to_string(
                conf_template,
                {
                    "subdomain": production_root_url.subdomain,
                    "domain": production_root_url.domain,
                    "suburl": suburl,
                    "server": server,
                    "hg_path_to_django_project": os.path.join(
                        os.path.basename(hg_root),
                        os.path.relpath(project_dir, hg_root)),
                }))
        f.close()
        local("hg add %s"%os.path.relpath(conf_filename, project_dir))

        # include this new apache file as necessary in the appropriate
        # root url apache configuration
        if local_master_django_project_dir:
            remote_django_project_dir = get_remote_project_dir()
            root_apache_filename = os.path.join(
                local_master_django_project_dir, "conf", server, "apache",
                "%s.conf"%server)

            # XXXX TODO: this is probably not enough to simply place the
            # suburls directly before the ####XXXX line. we probably need
            # to order things in a smart way depending on what the suburls
            # are: the most restrictive first like /foo/bar before /foo.
            apache_file = open(root_apache_filename,'r')
            apache_conf = apache_file.read()
            apache_file.close()
            include_directive = "Include %s"%os.path.join(
                remote_django_project_dir, 
                "conf", server, "apache", 
                "%s.conf"%server
            ).replace('/', r'\/')
            if include_directive not in apache_conf:
                local(r"sed 's/####XXXX/%s\n####XXXX/' %s > kk"%(
                    include_directive,
                    root_apache_filename,
                ))
                local("mv kk %s"%root_apache_filename)

    with settings(warn_only=True):
        result = local("hg ci -m 'auto-added apache configuration setup'", 
                       capture=True)
        if result.failed:
            warn("apache configuration already added")

def group_writable_permissions(remote_dir=None):
    
    # lets do this again for the sqlite db file
    fabhelp.progress("make sure permissions are group writable")
    if remote_dir is None:
        # remote_dir = get_remote_project_dir()
        remote_dir = get_remote_repo_dir()
    sudo("chmod -R g+w %s"%remote_dir)

def change_owner(remote_dir=None, username=None):
    """change the owner to username for all files in the subrepository"""

    if remote_dir is None:
        remote_dir = get_remote_repo_dir()
    if username is None:
        username = run("echo $USER")
    sudo("chown -R %s %s"%(username, remote_dir))
    sudo("chown %s /tmp/*"%username)

def restart_server(memcached_ram=64):
    """restart apache and memcached on the remote server"""

    group_writable_permissions()

    fabhelp.progress("restart apache and memcached")
    sudo("/etc/init.d/apache2 restart")

    # get the memcached port
    from django.conf import settings as django_settings
    u = urlparse.urlparse(django_settings.CACHE_BACKEND)
    port = u.port

    # # this does not work for some very strange reason
    # sudo("/etc/init.d/memcached restart")

    # this is basically how the LA Times does it...
    # https://github.com/datadesk/latimes-fabric-functions/blob/master/fabfile.py
    with settings(warn_only=True):
        pid = run("pgrep memcached")
        if not pid.failed:
            sudo("kill %s"%pid)
    sudo("memcached -u www-data -p %s -m %s -d"%(
        port,
        memcached_ram,
    ))

def remote_initdb_from_fixture(project_dir, virtualenv_name):
    """initialize a remote database from fixtures in the remote
    project_dir with virtual environment virtualenv_name"""

    fabhelp.progress("initialize a remote database from the fixture")

    # infer the REMOTE relative path from the project root to the
    # dbstate filaname from the (possibly LOCAL) settings
    dbstate = None
    if fabhelp.is_dbvcs_installed():
        from common.apps.dbvcs.conf import settings as dbvcs_settings
        from django.conf import settings as django_settings
        dbstate = os.path.relpath(dbvcs_settings.DBVCS_STATE_FILENAME, 
                                  django_settings.PROJECT_ROOT)

    with cd(project_dir):
        run("./common/bin/setup_mysql.py") # get the mysql stuff setup
        run("./manage.py setup_virtualenv")
        syncdb_flags = "--noinput"
        if fabhelp.is_dbvcs_installed():
            run("./manage.py setup_dbvcs_hooks")
            syncdb_flags += " --ignore-dbstate"
        run("./manage.py syncdb %s" % syncdb_flags)
        if fabhelp.is_dbvcs_installed():
            run("./manage.py fixture2database")

def remote_clone_or_pull(remote_dir, repo_url):
    """clone repository repo_url onto remote machine at remote_dir
    """
    group_writable_permissions(remote_dir=remote_dir)
    with cd(remote_dir):
        with fabric_settings(warn_only=True):
            result = run("hg clone %s"%repo_url)
            if result.failed:
                d = os.path.basename(repo_url)
                with cd(os.path.join(remote_dir, d)):
                    result = run("hg pull")
                    result = run("hg update")
                    if result.failed:
                        abort("wtf happened?!?!")
    group_writable_permissions(remote_dir=remote_dir)

def setup_staging(production_root_url, virtualenv_name="env", 
                  local_master_django_project_dir='', use_master_auth=True):
    """setup the staging environment based on the production root url
    for example, acme.datascopeanalytics.com/hello-world will be hosted
    on the staging server at staging.datascopeanalytics.com/acme/hello-world

    if this project is setup at a suburl, then a
    local_master_django_project_dir MUST be specified
    """

    # create a modified urlparse object
    production_root_url = ProductionRootUrl(production_root_url)

    # setup apache
    render_apache_configuration(
        production_root_url,
        local_master_django_project_dir=local_master_django_project_dir,
    )

    # since we want login permissions to persist across subdomain
    # sites, we need to add some lines to settings to use database
    # routers to access the user and session information in the
    # local_master_django_project
    if local_master_django_project_dir and use_master_auth:
        fabhelp.progress("updating django settings to share user sessions")
        for server in ("localhost", "poisson", "noether"):
            project_dir = local('pwd', capture=True)
            settings_filename = os.path.join(project_dir, 'conf', server,
                                             'settings.py')
            quoted = lambda s: '"' + s + '"'
            rel_path = os.path.relpath(
                os.path.abspath(local_master_django_project_dir), 
                project_dir)
            rel_path_str = ', '.join(map(quoted, rel_path.split(os.sep)))
            f = open(settings_filename, 'a')
            f.write(r"""
from common.conf.settings import _shared_user_sessions
(DATABASES, DATABASE_ROUTERS, MIDDLEWARE_CLASSES) = \
    _shared_user_sessions(
        os.path.join(PROJECT_ROOT, %s), 
        DATABASES, DATABASE_ROUTERS, MIDDLEWARE_CLASSES
)
"""%rel_path_str)
            f.close()
        local("hg ci -m 'updated django settings to share user sessions'")

    # push all changes into parent repository so that they can be
    # cloned on remote staging server
    fabhelp.progress("push any local changes to repository")
    with fabric_settings(warn_only=True):
        local("hg push")
    
    # clone parent repository
    fabhelp.progress("clone the project repository")
    result = local("hg showconfig | grep paths.default", capture=True)
    repo_url = result.split('=', 1)[1].strip()
    remote_dir = "/srv/www/%s" % production_root_url.domain
    sudo("mkdir -p %s"%remote_dir)
    remote_clone_or_pull(remote_dir, repo_url)

    # do we need to do something with a database here? yes, we do. syncdb.
    django_project_dir = get_remote_project_dir()
    remote_initdb_from_fixture(django_project_dir, 
                               virtualenv_name=virtualenv_name)
    
    # XXXX TODO: this is probably not enough to simply place the
    # suburls directly before the ####XXXX line. we probably need to
    # order things in a smart way depending on what the suburls are:
    # the most restrictive first like /foo/bar before /foo.

    # setup remote apache stuff. this only has to be done if there is
    # not already a local master django project specified. suburl
    # projects are already installed by the apache configuration
    # written in render_apache_configuration function above
    if not local_master_django_project_dir:
        fabhelp.progress("setup remote apache on staging")
        django_project_dir = get_remote_project_dir()
        root_apache_filename = \
            "/etc/apache2/sites-available/staging.datascopeanalytics.com"
        sudo(r"sed 's/####XXXX/Include %s\n  ####XXXX/' %s > kk"%(
            os.path.join(django_project_dir, "conf", "poisson", "apache", 
                         "poisson.conf").replace('/', r'\/'),
            root_apache_filename,
        ))
        sudo("mv kk %s"%root_apache_filename)

    # that smells like cauliflower. gross.
    restart_server()

def get_staging_apache_filename():

    from django.conf import settings
    apache_filename = os.path.join(settings.PROJECT_ROOT, 
                                   "conf", "poisson", "apache", "poisson.conf")
    if not os.path.exists(apache_filename):
        msg = "staging environment is not configured (can't find poisson.conf)."
        msg += "\nto setup staging environment, run:"
        msg += "\n  ./manage.py setup_staging"
        abort(msg)
    return apache_filename

def get_remote_project_dir():
    """get the remote project directory from the staging apache
    filename. note that staging and production remote project
    directories are in the same location on the server.
    """

    apache_filename = get_staging_apache_filename()
    with open(apache_filename,'r') as apache_file:
        s = apache_file.read()
        remote_project_dir = s.split(r"<Directory")[1].split(r'>')[0].strip()
    return remote_project_dir

def get_remote_repo_dir():
    """get the remote project directory from the staging apache
    filename. note that staging and production remote project
    directories are in the same location on the server.
    """

    remote_project_dir = get_remote_project_dir()
    with cd(remote_project_dir):
        remote_repo_dir = run("hg root 2> /dev/null")
    return remote_repo_dir

def setup_linode(production_root_url):
    """get things set up on linode"""

    # make sure the secret key exists
    fabhelp.progress("adding subdomain '%s'to linode resources"%\
                         production_root_url.subdomain)
    linoderc = ConfigParser.ConfigParser()
    linoderc.read([
        os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "conf",
            "linoderc",
        ),
        os.path.expanduser("~/.linoderc"),
    ])
    try:
        linode_secret_key = linoderc.get("keys", "secret")
    except ConfigParser.NoOptionError:
        msg = "need to add the secret linode key to ~/.linoderc file.\n"
        msg += "for more information, see common/conf/linoderc"
        abort(msg)
    
    # create linode_api instance
    from linode.api import Api
    linode_api = Api(linode_secret_key)

    # get the domainid 
    domainid = None
    for d in linode_api.domain_list():
        if d["DOMAIN"] == "datascopeanalytics.com":
            domainid = d["DOMAINID"]

    # get ip address for datascopeanalytics.com
    import socket
    addrinfos = socket.getaddrinfo("datascopeanalytics.com", 80)
    for addrinfo in addrinfos[1:]:
        assert addrinfos[0][4][0] == addrinfo[4][0]
    datascopeanalytics_ip_address = addrinfos[0][4][0]

    # create new domain resource for this subdomain as necessary
    create_resource = True
    for r in linode_api.domain_resource_list(domainid=domainid):
        if r["TYPE"].lower() == 'a' and \
                r["NAME"]==production_root_url.subdomain:
            create_resource = False
            warn("subdomain '%s' already exists..."%\
                     production_root_url.subdomain)
            break
    if create_resource:
        linode_api.domain_resource_create(
            domainid=domainid, 
            type="A", 
            name=production_root_url.subdomain, 
            target=datascopeanalytics_ip_address,
        )

def setup_production(virtualenv_name="env"):
    """setup the production environment"""

    # get project dirs and subdomain to use throughout
    remote_project_dir = get_remote_project_dir()
    remote_dir = '/'.join(remote_project_dir.split('/')[:4])
    production_root_url = ProductionRootUrl()

    # setup linode resources
    setup_linode(production_root_url)

    # apache is already setup by the setup_staging command (which
    # calls render_apache_configuration)

    # if this is a suburl production project, need to over-ride the
    # settings to use the suburl_settings
    if production_root_url.suburl:
        fabhelp.progress("updating settings for a production url environment")
        filename = os.path.abspath(
            os.path.join(
                os.path.dirname(__file__),"..","..",
                "conf","noether","settings.py"
            )
        )
        with open(filename, 'r') as f:
            lines = f.readlines()
        with open(filename, 'w') as f:
            for line in lines:
                if line.strip()=="from common.conf.noether.settings import *":
                    s = "from common.conf.noether.suburl_settings import *\n"
                    f.write(s)
                else:
                    f.write(line)

        local("hg ci -m 'autocheckin: using suburl settings for production'")

    # push all changes into parent repository so that they can be
    # cloned on remote staging server
    fabhelp.progress("push local changes to development repository."+
                     " propagate to staging")
    with fabric_settings(warn_only = True):
        local("hg push")
    local("./manage.py pull_development_to_staging")

    # clone parent repository
    fabhelp.progress("clone the project repository from staging environment")
    result = local("hg showconfig | grep paths.default", capture=True)
    repo_url = "ssh://poisson/" + os.path.join(
        remote_dir,
        os.path.basename(result.split('=', 1)[1].strip()),
    )
    sudo("mkdir -p %s"%remote_dir)
    remote_clone_or_pull(remote_dir, repo_url)

    # do we need to do something with a database here? yes, we do. syncdb.
    django_project_dir = get_remote_project_dir()
    remote_initdb_from_fixture(django_project_dir, virtualenv_name)

    # include the apache configuration file in the server's virtual
    # host configuration file for the sandbox server ---- only need to
    # do this if this is the root url! everything else is taken care
    # of in the apache configuration by render_apache_configuration
    # function that is executed during setup_staging
    if not production_root_url.suburl:
        fabhelp.progress("setup apache")
        conf_filename = os.path.join(django_project_dir, "conf", "noether", 
                                     "apache", "noether.conf")
        apache_conf = "/etc/apache2/sites-available/" + \
            production_root_url.domain
        if fabric.contrib.files.exists(apache_conf, use_sudo=True):
            sudo("mv -f %s %s.backup "%(apache_conf, apache_conf))
        sudo("ln -s %s %s" % (conf_filename, apache_conf))
        sudo("mkdir -p /srv/www/%s/logs" % production_root_url.domain)
        sudo("a2ensite %s"%production_root_url.domain)
    
    # that smells like cauliflower. gross.
    restart_server()

def add_dsa_app(app_name=None):
    """add an app from the DjangoApps collection of repositories"""
    
    # make sure project name is provided 
    if app_name is None:
        app_name = prompt("Please enter an app name: ")

    # remember some directories
    cur_dir, bin_dir, src_dir = fabhelp.get_cur_bin_src_directories()

    # make sure we are in the root of the django project
    if not fabhelp.is_django_project(cur_dir, in_root_dir=True):
        abort("This command must be run from root of django project")

    # abort if local changes to .hgignore or .hgsub
    hg_root = fabhelp.get_hg_root()
    hg_modified_files = [
        os.path.join(hg_root, ".hgsub"),
        os.path.join(cur_dir, "conf", "settings_modules.txt"),
    ]
    fabhelp.abort_if_local_changes(hg_modified_files)

    # clone the subrepository in the right place
    clone_subrepository(
        "ssh://poisson//srv/hg/DjangoApps/%s"%app_name, 
        os.path.join(cur_dir, "apps", app_name),
    )

    # create the settings file
    fabhelp.progress("creating the conf/%s.py settings for project"%app_name)
    from django.conf import settings as django_settings
    from django.template.loader import render_to_string
    try:
        django_settings.configure(
            DEBUG=True, 
            TEMPLATE_DEBUG=True,
            TEMPLATE_DIRS=(
                os.path.join(cur_dir, 'templates'),
            ),
        )
    except RuntimeError:
        pass # this is being run from the setup_dsa_app django command
             # --- hopefully
    f = open(os.path.join(cur_dir, "conf", "%s.py"%app_name), 'w')
    f.write(render_to_string(".settings_template.py", {
        "app_name": app_name,
        "is_dbvcs_installed": fabhelp.is_dbvcs_installed(),
    }))
    f.close()
    
    # add the settings to the settings_modules.txt file
    fabhelp.progress("add the settings file to conf/settings_modules.txt")
    f = open(os.path.join(cur_dir, "conf", "settings_modules.txt"), 'a')
    f.write("""
# automatically including %s
conf/%s.py
"""%(app_name, app_name))
    f.close()

    # add the media soft links
    fabhelp.progress("soft links for media")
    with lcd(".media"):
        local("ln -s ../apps/%s/media/%s %s"%(app_name, app_name, app_name))
    with lcd(".static"):
        local("ln -s ../apps/%s/static/%s %s"%(app_name, app_name, app_name))

    # synchronize the database and dump the database
    fabhelp.progress("syncdb and database2fixture (as necessary)!")
    local("./manage.py syncdb --noinput")
    if fabhelp.is_dbvcs_installed():
        local("./manage.py database2fixture --all")

    # add these fixtures to the repository. make sure to change into
    # the local directory first in case the dbvcs data directory is a
    # subrepository
    if fabhelp.is_dbvcs_installed():
        result = local("./manage.py listfixtures apps.%s" % app_name, 
                       capture=True)
        for filename in result.split():
            d, f = os.path.split(filename)
            with lcd(d):
                local("hg add %s"%f)

    # run hg add
    fabhelp.progress("add everything to the mercurial repository")
    local("hg add %s"%' '.join([
        os.path.join(cur_dir, "conf", "%s.py"%app_name),
        os.path.join(cur_dir, ".media", app_name),
        os.path.join(cur_dir, ".static", app_name),
    ]))

def update_remote(hg_revision='tip'):
    """update remote repository"""

    change_owner()
    group_writable_permissions()

    # get a list of all of the django projects in this 
    rel_django_project_dirs = []
    hg_root = fabhelp.get_hg_root()
    for root, dirs, files in os.walk(hg_root):
        d = os.path.join(hg_root, root)
        try:
            dirs.remove('.hg') # ignore mercurial repositories
        except ValueError:
            pass # .hg is not in dirs
        if fabhelp.is_django_project(d):
            rel_django_project_dirs.append(os.path.relpath(d, hg_root))
            dirs[:] = [] # no need to decend any further... save time!

    # get the remote directory from the apache file
    fabhelp.progress("updating remote repository")
    remote_repo_dir = get_remote_repo_dir()
    with cd(remote_repo_dir):
        with fabric_settings(warn_only = True):
            run("hg pull")

        # run database2fixture for each django repository in this repository
        for rel_django_project_dir in rel_django_project_dirs:
            with cd(rel_django_project_dir):
                if fabhelp.is_dbvcs_installed():
                    run("./manage.py database2fixture")

        run("hg update -r %s"%hg_revision)

    remote_project_dir = get_remote_project_dir()
    with cd(remote_project_dir):
        run("./manage.py setup_virtualenv") # add new packages when necessary
        group_writable_permissions()

def pull_development_to_staging(hg_revision='tip'):
    """pull changes in development repository into staging
    environment, setup db as necessary, and restart server"""


    update_remote(hg_revision=hg_revision)
    restart_server()

def pull_staging_to_production(hg_revision='tip'):
    """pull changes in staging repository into the production
    environment, setup db as necessary, and restart server"""

    update_remote(hg_revision=hg_revision)
    restart_server()

def pull_remote_to_localhost(remotehost):
    """pull remotehost changes into local repository and update. this
    includes all subrepositories
    """

    assert remotehost in ("poisson", "noether",)
    
    # dump database and check in as necessary
    fabhelp.progress("dump remote database and auto check-in")
    remote_project_dir = get_remote_project_dir()
    with cd(remote_project_dir):
        if fabhelp.is_dbvcs_installed():
            run("./manage.py database2fixture")
        cmd="hg ci -m 'auto-checkin: adding data for pull_remote_to_localhost'"
        with fabric_settings(warn_only=True):
            result = run(cmd)
            if result.failed:
                # there were no changes to check in
                if result.return_code==1:
                    pass 
                # something else happened. this is a problem, so abort
                else:
                    abort("hg ci failed. see above output for details")

    # recursively get all of the subrepository directories. breadth
    # first search here
    fabhelp.progress("find all of the subrepository directories")
    from django.conf import settings as django_settings
    with lcd(django_settings.PROJECT_ROOT):
        local_repo_dir = fabhelp.get_hg_root()
    remote_repo_dir = get_remote_repo_dir()
    hgsub_directories=collections.deque([local_repo_dir])
    subrepo_directory_list = [local_repo_dir]
    while len(hgsub_directories):
        hgsub_directory = hgsub_directories.popleft()
        hgsub_filename = os.path.join(hgsub_directory, '.hgsub')
        if os.path.exists(hgsub_filename):
            hgsub = open(hgsub_filename)
            for line in hgsub:
                l = line.split('=')
                if len(l)==2:
                    directory = l[0].strip()
                    subrepo_directory = os.path.join(hgsub_directory,directory)
                    subrepo_directory_list.append(subrepo_directory)
                    hgsub_directories.append(subrepo_directory)
                elif line.strip(): # this is a non-empty line
                    raise TypeError("%s has unexpected format"%hgsub_filename)
            hgsub.close()

    # reorder subrepo reldir list to always get subdirectories first 
    subrepo_directory_list.reverse()

    # pull changes into base repository and all
    # subrepositories. iterate over all of the subrepo reldir's and
    # pull in the new information so that there aren't any problems
    # with remote heads, etc.
    fabhelp.progress("recursively pull subrepos and the base repo")
    for subrepo_directory in subrepo_directory_list:
        with lcd(subrepo_directory):
            subrepo_reldir = os.path.relpath(subrepo_directory, local_repo_dir)
            remote_dir = os.path.join(remote_repo_dir, subrepo_reldir)

            # if remote dir exists, pull from that
            # subrepository. remote_dir may not exist if there are
            # locally added subrepos that have not been put on
            # production yet.
            with fabric_settings(warn_only=True):
                exists = run("test -d %s"%remote_dir)
                if exists.succeeded:
                    local("hg pull ssh://%s/%s"%(remotehost, remote_dir))

    # # XXXX THIS IS CAUSING WIERD ERROR WITH PARAMIKO ?!?!
    # # locally update
    # fabhelp.progress("update local repository (or at least try)")
    # with lcd(local_repo_dir):
    #     with fabric_settings(warn_only=True):
    #         result = local("hg up", capture=True)
    #         if result.failed:
    #             pass # nothing to update
    msg="next: update your local repository to get all incoming change sets"
    fabhelp.progress(msg)

def pull_staging_to_localhost():
    pull_remote_to_localhost("poisson")

def pull_production_to_localhost():
    pull_remote_to_localhost("noether")


    
