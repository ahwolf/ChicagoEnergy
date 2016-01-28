#!/usr/bin/env python

__doc__ = """This script installs a bunch of common source packages
using apt-get, gem, and pip as appropriate. By default, it installs
all system dependencies, but particualr packages can be specified as
arguments to the Installer to install particular components. If no
packages have been specified, this script also looks to run the
install script located at

  ../../bin/install_dependencies.py

This module makes no assumptions beyond the standard python installation, making it a django-free way of installing all system dependencies.
"""

import subprocess
import sys
import os
import glob
import optparse

try:
    from fabric.api import local, settings, lcd
except ImportError, e:
    sys.stderr.write("fabric not installed yet...")
    FABRIC_INSTALLED = False
else:
    FABRIC_INSTALLED = True

class ColoredOutput(object):
    """simple class for printing out colored output"""

    beg = None
    end = "\033[0m"
    def __init__(self, text):
        self.text = text

    def __str__(self):
        return self.beg + str(self.text) + self.end

class Red(ColoredOutput):
    """red output"""
    beg = "\033[31m"

class Green(ColoredOutput):
    """green output"""
    beg = "\033[32m"

class Installer(object):
    """installer class

    by default, the Installer class will run all methods that start
    with 'install_' during the instantiation of the class. 
    """

    # by default, the installer will directly call all methods that
    # start with 'install_'. if any *args are specified, it tries to
    # install these methods only
    def __init__(self, *args, **kwargs):
        
        if not FABRIC_INSTALLED:
            self.install_fabric()
            print(Red("re-run command now that fabric has been installed"))
            sys.exit(0)

        if args:
            for arg in args:
                attr = "install_%s" % arg
                getattr(self, attr)()

        else:
            for attr in dir(self):
                if attr.startswith('install_'):
                    getattr(self, attr)()

    def local(self, command, verbose=True):
        """this command emulates fabric's 'local' command."""
        if verbose:
            print(Green(command))
        if FABRIC_INSTALLED:
            local(command)
        else:
            retcode = subprocess.call(command, shell=True)
            if retcode!=0:
                print(Red("command failed, see above"))
                sys.exit(retcode)

    def is_apt_installed(self, package):
        """check to see if apt package is installed"""
        cmd = "dpkg --get-selections"
        pipe = subprocess.Popen(cmd, shell=True, 
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        pipe.wait()

        installed = False
        for line in pipe.stdout:
            pkg, status = line.strip().split()
            if pkg==package and status.startswith("install"):
                installed = True

        return installed

    def apt_install_packages(self, *packages):
        """install a system package with apt-get"""
        package_str = ''
        for package in packages:
            if not self.is_apt_installed(package):
                package_str += ' ' + package
        if package_str:
            self.local("sudo apt-get install -y %s"%package_str)

    def is_pip_installed(self, module):
        """check to see if a package is available via pip"""
        try:
            __import__(module)
        except ImportError:
            return False
        return True

    def pip_install_packages(self, *package_module_list):
        """install a package with pip"""
        package_str = ''
        for package, module in package_module_list:
            if not self.is_pip_installed(module):
                package_str += ' ' + package
        if package_str:
            self.local("sudo pip install %s"%package)

    def is_gem_installed(self, package):
        """check to see if a gem package is installed"""
        cmd = "gem list -i %s"%package
        pipe = subprocess.Popen(cmd, shell=True, 
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        pipe.wait()
        return not bool(pipe.returncode)

    def gem_install_packages(self, *packages):
        """install a gem package"""
        package_str = ''
        for package in packages:
            if not self.is_gem_installed(packages):
                package_str += ' ' + package
        if package_str:
            self.local("sudo gem install %s"%package)

    def install_pip(self):
        """convenience function for installing pip"""
        self.apt_install_packages('python-pip', 'python-setuptools')

    def install_fabric(self):
        """convenience function for installing fabric"""
        self.install_pip()
        self.apt_install_packages('python-dev')
        self.pip_install_packages(('Fabric', 'fabric'),)

    def install_gem(self):
        """convenience function for installing gem"""
        self.apt_install_packages("gem", "rubygems", "build-essential", 
                                   "libruby", "ruby1.8-dev",)

class ConvenienceInstaller(Installer):
    """an installer for many common python packages"""

    def install_geo_dependencies(self):
        self.apt_install_packages("binutils", "libproj-dev", "gdal-bin", "libspatialindex-dev")

    def install_python_software_properties(self):
        """this is needed to add the latest version of mercurial"""
        self.apt_install_packages("python-software-properties")

    def install_mercurial(self): 
        """add the latest version of mercurial"""
        self.install_python_software_properties()

        if not glob.glob("/etc/apt/sources.list.d/mercurial-ppa-releases*list"):
            self.local("sudo add-apt-repository ppa:mercurial-ppa/releases")
            self.local("sudo apt-get update")
            self.apt_install_packages("mercurial")

    def install_django(self):
        """convenience function for installing django"""
        # self.apt_install_packages('python-django')
        self.pip_install_packages(("Django==1.2.5", "django"),)

    def install_openssh_server(self):
        """convenience function for installing openssh-server"""
        self.apt_install_packages('openssh-server')

    def install_sass(self):
        """convenience function for installing sass"""
        self.gem_install_packages("-v=3.0.25 haml")

    def install_virtualenv(self):
        """convenience function for installing virtualenv"""
        self.apt_install_packages("python-virtualenv")

    def install_memcached(self):
        """convenience function for installing memcached"""
        self.apt_install_packages("python-memcache", "memcached")

    def install_git(self):
        """convenience function for installing git"""
        self.apt_install_packages("git-core")

    def install_mysql_server(self):
        self.apt_install_packages("mysql-server")

    def install_mysql_client(self):
        self.apt_install_packages("mysql-client")

    def install_mysqldb(self):
        """convenience function for installing mysql"""
        self.apt_install_packages("libmysqlclient-dev", "python-mysqldb")

    def install_libapache2_mod_wsgi(self): 
        self.apt_install_packages("libapache2-mod-wsgi")

    def install_openssl(self): 
        self.apt_install_packages("openssl")

    def install_beautiful_soup(self):
        """convenience function for installing beautifulsoup"""
        self.apt_install_packages("python-beautifulsoup")

    def install_sphinx(self):
        """convenience function for installing sphinx"""
        self.apt_install_packages("python-sphinx")

if __name__ == "__main__":

    parser = optparse.OptionParser(
        usage = __doc__ + """
[unix]$ ./%prog [options] [dep [dep [...]]]""")
    options, args = parser.parse_args()

    ConvenienceInstaller(*args)
    
    # try to run installer for local project setup if nothing has been
    # installed locally
    if not args:
        conf_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), '..', '..', 'bin')
        )
        local_install_dependencies = os.path.join(conf_dir, 
                                                  "install_dependencies.py")
        if os.path.exists(local_install_dependencies):
            installer = Installer()
            installer.local("python %s %s" % (
                local_install_dependencies,
                ' '.join(args),
            ))

