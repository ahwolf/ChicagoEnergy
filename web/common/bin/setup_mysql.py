#!/usr/bin/env python
"""
This command creates the necessary database and authentication
credentials for using mysql as a backend for this django project. By
default, it uses the database name, user, and password that are
specified in common.conf.localhost.settings.

If any modification to these settings are specified by the optional
command line arguments --name, --user, or --password, these settings
are applied in

  conf/localhost/settings.py
  conf/poisson/settings.py
  conf/noether/settings.py

NOTE: This script can not be incorporated as a django management
command because it is used to avoid mysql exceptions that occur when
running manage.py
"""
import sys
import os
import optparse
import getpass

from fabric.colors import yellow as warning, red as error

import MySQLdb

if __name__ == "__main__":

    parser = optparse.OptionParser(
        usage = __doc__ + """
[unix]$ ./%prog [options]""")

    parser.add_option("-d","--database", type="str", dest="database",
                      help="MySQL database name [%default]")
    parser.add_option("-u","--user", type="str", dest="user",
                      help="MySQL database user [%default]")
    parser.add_option("-p","--password", type="str", dest="password",
                      help="MySQL password for user [%default]")

    # get the defaults from the django settings module
    sys.path.append(os.path.abspath(os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "..",
        "..",
    )))
    import common.conf.localhost.settings as settings
    parser.set_defaults(
        database=settings.DATABASES['default']['NAME'],
        user=settings.DATABASES['default']['USER'],
        password=settings.DATABASES['default']['PASSWORD'],
    )

    # parse the arguments and options
    (options, args) = parser.parse_args()
    database = options.database
    user = options.user
    password = options.password

    #-------------------------------------------------------------- MySQL setup
    # create a database connection to the MySQL server as the
    # MySQL root user
    connection = MySQLdb.connect(
        host='localhost',
        user='root',
        passwd=getpass.getpass('Enter the MySQL root user password: '),
    )
    cursor = connection.cursor()

    # try to create the database. if it already exists, move
    # onward (and only warn the user)
    try:
        cursor.execute('CREATE DATABASE %s' % database)
    except MySQLdb.ProgrammingError:
        message = "Warning: database '%s' already exists\n"%database
        sys.stderr.write(warning(message))

    # try to create the user. if it already exists, move
    # onward (and only warn the user)
    try:
        cursor.execute("CREATE USER '%s'@'localhost' IDENTIFIED BY '%s'" \
                           % (user, password))
    except MySQLdb.OperationalError:
        message = "Warning: user '%s' already exists\n" % user
        sys.stderr.write(warning(message))

        # if the user already exists, there could be a conflict in the
        # password that is specified in mysql and the password that is
        # in the django settings file. check to see if it is possible
        # to authenticate with this user and, if not, throw an error
        try:
            user_connection = MySQLdb.connect(
                host='localhost',
                user=user,
                passwd=password,
                )
        except MySQLdb.OperationalError:
            m="Error: user '%s' with password '%s' does not authenticate\n"%(
                user, 
                password,
            )
            sys.stderr.write(error(m))
            raise 

    # grant django-ish permissions on this database to user
    cursor.execute("GRANT ALL ON %s.* TO '%s'@'localhost';" \
                       % (database, user))

    # close the connection
    connection.close()

    #------------------------------------------------------------- django setup
    # these are all of the settings files that need to be updated
    settings_filenames = (
        os.path.join(settings.PROJECT_ROOT, "conf", "localhost", "settings.py"),
        os.path.join(settings.PROJECT_ROOT, "conf", "poisson", "settings.py"),
        os.path.join(settings.PROJECT_ROOT, "conf", "noether", "settings.py"),
    )

    # get the default values from the parser.
    default = parser.get_default_values()

    # update the database name if it is different than the default
    if database != default.database:
        sys.stderr.write("updating the database name in conf/*/settings.py\n")
        for settings_filename in settings_filenames:
            stream = open(settings_filename, 'a')
            stream.write("DATABASES['default']['NAME'] = '%s'\n"%database)
            stream.close()

    # update the user if it is different than the default
    if user != default.user:
        sys.stderr.write("updating the user name in conf/*/settings.py\n")
        for settings_filename in settings_filenames:
            stream = open(settings_filename, 'a')
            stream.write("DATABASES['default']['USER'] = '%s'\n"%user)
            stream.close()

    # update the password if it is different than the default
    if password != default.password:
        sys.stderr.write("updating the password in conf/*/settings.py\n")
        for settings_filename in settings_filenames:
            stream = open(settings_filename, 'a')
            stream.write("DATABASES['default']['PASSWORD'] = '%s'\n"%password)
            stream.close()

