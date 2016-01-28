# a couple of notes on Makefiles:
#
# * the first target is the one that is executed from the command line
#   if you type `make` at the command line without any other arguments
# * here are some handy shortcuts
#   http://www.cprogramming.com/tutorial/makefiles_continued.html

# by default run all of these commands
all: django

django: 
	echo "Installing the dependinces necessary to run this repository"
	cd web && ./common/bin/install_dependencies.py
	echo "Installing proper configuration for mysql"
	cd web && ./manage.py setup_virtualenv
	echo "Setting up the virtual environment"
	cd web && ./common/bin/setup_mysql.py
	echo "Creating the necessary tables into the database"
	cd web && ./manage.py syncdb
	echo "Inserting the data into the database"
	cd web && ./manage.py dbshell < web/chicagoEnergy.sql
	echo "Now run './web/manage.py runserver' and open up a browser to the local host!"
