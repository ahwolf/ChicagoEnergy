#!/bin/bash

# quick n dirty script to install spatialindex which is required by rtree
wget http://download.osgeo.org/libspatialindex/spatialindex-src-1.7.0.tar.bz2
tar xjvf spatialindex-src-1.7.0.tar.bz2
cd spatialindex-src-1.7.0
./configure && make && sudo make install
