# a couple of notes on Makefiles:
#
# * the first target is the one that is executed from the command line
#   if you type `make` at the command line without any other arguments
# * here are some handy shortcuts
#   http://www.cprogramming.com/tutorial/makefiles_continued.html

# by default run all of these commands
all: django

django: 
	./web/common/bin/install_dependencies
	echo "Installing the dependinces necessary to run this repository"
	./web/manage.py setup_virtualenv
	echo "Setting up the virtual environment"
	./web/common/bin/setup_mysql.py
	echo "Installing proper configuration for mysql"
	./web/manage.py syncdb
	echo "Creating the necessary tables into the database"
	./web/manage.py dbshell < data.sql
	echo "Inserting the data into the database"
	echo "Now run './web/manage.py runserver' and open up a browser to the local host!"
