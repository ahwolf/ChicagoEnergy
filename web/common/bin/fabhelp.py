"""methods that are useful for fabric manipulation
"""

import sys
import os
import re
import subprocess

from fabric.api import *
from fabric.context_managers import settings, hide
import fabric.colors

def progress(message):
    """print out progress along the way"""
    print("")
    print(fabric.colors.green(message))

def get_bin_directory():
    """get the directory of all of the settings templates"""
    return os.path.dirname(__file__)

def get_cur_bin_src_directories():
    """get all of the relevant directories needed to set up django projects"""
    bin_dir = get_bin_directory()
    return (
        os.getcwd(),
        bin_dir,
        os.path.join(os.path.dirname(bin_dir), "src"),
    )

# def get_hg_root(ldir=None):
#     """find the mercurial root"""
#     ldir = ldir or ''
#     with lcd(ldir):
#         with settings(hide("warnings", "running", "stdout", "stderr"), 
#                       warn_only=True):
#             hg_root = local("hg root", capture=True)
#             if hg_root.failed:
#                 msg = "directory '%s' is not in a mercurial project" % ldir
#                 msg += '\n"hg root" output:' + hg_root
#                 msg += '\n"hg root" stderr:' + hg_root.stderr
#                 raise ValueError(msg)
#     return hg_root

def is_django_project(d, in_root_dir=False):
    """make sure that directory d is actually a django project and
    optionally that this is in the root directory.  
    """
    isproject = (os.path.exists(d) and os.path.isdir(d))
    for f in ("apps", "common", "conf", ".media"): # do not include env
        if not os.path.isdir(os.path.join(d, f)):
            isproject = False
        if in_root_dir and not os.path.exists(f):
            isproject = False
        if not isproject: 
            break
    return isproject

def is_dbvcs_installed():
    """method to determine if dbvcs is installed"""
    from django.conf import settings as django_settings
    return any(x.endswith("dbvcs") for x in django_settings.INSTALLED_APPS)

def is_local_hg_repo():
    """check to see if directory d is actually a mercurial repository"""
    cmd = "hg root"
    pipe = subprocess.Popen(cmd, shell=True, 
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    pipe.wait()
    return not bool(pipe.returncode)
    

def abort_if_local_changes(hg_modified_files):
    # check to see if any dependent files have been locally
    # modified. override any personal hg st alias to get reliable
    # behavior of command
    config = "--config alias.status='st -S'"
    output = local("hg st %s %s"%(config,' '.join(hg_modified_files)), 
                   capture=True)
    if output:
        abort("check in local changes first for the following files:\n%s"%\
                  output)

def abort_if_incoming_changes():
    # check to see if there are any incoming changes
    with settings(warn_only=True):
        output = local("hg incoming", capture=True)
        if not output.failed:
            abort("pull, resolve conflicts as necessary before running:\n%s"%\
                      output)
        else:
            progress("ignore the above warning from hg")

class HgIgnore(object):

    comment_char = '#'

    def __init__(self, filename):
        self.filename = filename
        self.patterns = {
            "glob": set(),
            "regex": set(),
        }
        self.last_syntax = "regex"
        self.commentre = re.compile(r'((^|[^\\])(\\\\)*)#.*')

        self.init_patterns()

    def _check_syntax(self, syntax):
        assert syntax in self.patterns

    def init_patterns(self):
        if not os.path.exists(self.filename):
            return
        f = open(self.filename, 'r')
        syntax = self.last_syntax
        for line in f:
            if line.strip().startswith("syntax"):
                syntax = line.strip().split(':')[-1].strip()
                self._check_syntax(syntax)
            else:
                if self.comment_char in line:
                    # remove comments prefixed by an even number of escapes
                    line = self.commentre.sub(r'\1', line)
                    # fixup properly escaped comments that survived the above
                    line = line.replace("\\#", "#")
                pattern = line.rstrip()
                if pattern:
                    self.patterns[syntax].add(pattern)

        self.last_syntax = syntax

    def add_patterns(self, patterns, syntax="glob", comment=''):

        self._check_syntax(syntax)

        # see if any of the new patterns are new
        new_patterns = []
        for pattern in patterns:
            if pattern not in self.patterns[syntax]:
                new_patterns.append(pattern)

        # add all of the new patterns to the hgignore file
        if new_patterns:
            f = open(self.filename, 'a')
            f.write('\n')
            if syntax != self.last_syntax:
                f.write("syntax: %s\n"%syntax)
            if comment:
                f.write("# %s\n"%comment)
            for pattern in new_patterns:
                f.write(pattern + '\n')
            f.close()

        return new_patterns

def add_to_hgignore(patterns, syntax="regex", hgignore_path=None, comment=''):
    """add all new patterns to hgignore file"""

    if hgignore_path is None:
        hg_root = get_hg_root()
        hgignore_path = os.path.join(hg_root, ".hgignore")

    # read hgignore patterns
    hgignore = HgIgnore(hgignore_path)
    hgignore.add_patterns(patterns, syntax=syntax, comment=comment)
