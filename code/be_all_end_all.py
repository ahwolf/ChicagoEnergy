# standard library
import os
import sys
import csv
import json

# 3rd party
from utils import read_shapefile, create_spatial_index, aggregate_metrics, \
    write_json

# set this to an amount (in lat/lng units) that for boundary
# simplification (None for no simplification)
SIMPLIFICATION = .001

# read in boundary info using the utils file read_shapefile
BOUNDARY_DATA = '../data/Chicago_boundaries/'

# --------------------------------------------- read in all of the boundary data
# CENSUS_BLOCK_2000 = read_shapefile(
#     os.path.join(BOUNDARY_DATA, 'Census Blocks.shp'),
#     id_fieldname = "CENSUS_B_1",
#     simplification = SIMPLIFICATION,
# )
# CENSUS_BLOCK_2000_INDEX = create_spatial_index(CENSUS_BLOCK_2000)

CENSUS_BLOCK_2010 = read_shapefile(
    os.path.join(BOUNDARY_DATA, 'CensusBlockTIGER2010.shp'),
    id_fieldname = "GEOID10",
    simplification = SIMPLIFICATION,
)
# print CENSUS_BLOCK_2010

# SCHOOL = read_shapefile(
#     os.path.join(BOUNDARY_DATA, 'BoundaryGrades10.shp'),
#     id_fieldname = "SCHOOLID",
#     simplification = SIMPLIFICATION,
# )

# CENSUS_TRACT_2000 = read_shapefile(
#     os.path.join(BOUNDARY_DATA, 'Census_Tracts.shp'),
#     id_fieldname = "CENSUS_T_1",
#     simplification = SIMPLIFICATION,
# )

# CENSUS_TRACT_2010 = read_shapefile(
#     os.path.join(BOUNDARY_DATA, 'CensusTractsTIGER2010.shp'),
#     id_fieldname = "GEOID10",
#     simplification = SIMPLIFICATION,
# )

# COMMUNITY_AREA = read_shapefile(
#     os.path.join(BOUNDARY_DATA, 'CommAreas.shp'),
#     id_fieldname = "COMMUNITY",
#     simplification = SIMPLIFICATION,
# )

NEIGHBORHOOD = read_shapefile(
    os.path.join(BOUNDARY_DATA, 'Neighborhoods_2012b.shp'),
    id_fieldname = "PRI_NEIGH",
    simplification = SIMPLIFICATION,
)

# WARD = read_shapefile(
#     os.path.join(BOUNDARY_DATA, 'Wards.shp'),
#     id_fieldname = "WARD",
#     simplification = SIMPLIFICATION,
# )
with open("ward.js", 'r') as infile, open("ward_1.js", 'w') as outfile:

    LONG_WARD = json.loads(infile.read())

    for item in LONG_WARD['features']:

        # print list(WARD[item["id"]].exterior.coords)
        item['geometry']['coordinates'] = [list(WARD[item["id"]].exterior.coords)]

    # for key, item in WARD.iteritems():
    #     WARD[key] = list(item.exterior.coords)

    outfile.write("var ward = " + json.dumps(LONG_WARD))
f
print >> sys.stderr, "ANALIZATION COMPLETE"

# ------------------------------------ read in energy data (csv?) from Accenture
# 
# this is currently using the "old" data prior to Accenture massive
# data restructuring undertaking of almost a full year </sarcasm>
with open('../data/DATA/demo_shortened_for_Ideo.csv','rU') as stream:
    reader = csv.reader(stream)

    # skip the header row
    header_row = reader.next()

    # convert spreadsheet to a dictionary keyed by block ID and with
    # values of a list with ["energy usage", "gas usage", "square footage"]
    census_2000_energy = {}
    for row in reader:
        census_2000_energy[row[2]] = \
            [float(row[3]), float(row[6]), float(row[4])]

# test to see how much overlap in census blocks and print out a
# message about matching between spreadsheet block IDs and census
# block IDs
spreadsheet_blocks = set(census_2000_energy.keys())
chicago_blocks = set(CENSUS_BLOCK_2000.keys())
print >> sys.stderr, "Unknown blocks in spreadsheet: %s" % \
    spreadsheet_blocks.difference(chicago_blocks)
print >> sys.stderr, "# of Missing blocks in spreadsheet: %s" % \
    len(chicago_blocks.difference(spreadsheet_blocks))

# --------------------------------------------- maybe read in census information


# --------------------------------------- aggregate metrics and write JSON files
for zoom_level in [
        WARD,
        COMMUNITY_AREA,
        NEIGHBORHOOD,
        SCHOOL,
        CENSUS_TRACT_2010,
    ]:
    aggregate_dict = aggregate_metrics(
        WARD,
        CENSUS_BLOCK_2000,
        CENSUS_BLOCK_2000_INDEX,
        census_2000_energy,
    )
    write_json(aggregate_dict, None)

