#!/bin/bash

# exit on any error
set -e

# if the .fonts directory exists. exit with error
if [ -e ~/.fonts ]; then
    echo "ERROR: conflicting ~/.fonts directory."
    echo "    remove ~/.fonts or back it up in some way"
    exit 1;
fi

# create a soft link to the shared fonts folder
cd $(dirname $0)/../desktop
ln -s `pwd` ~/.fonts

# reload the fonts in X session
sudo fc-cache -f