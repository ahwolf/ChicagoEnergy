#!/bin/bash

# link to scss files instead of css
for d in admin registration; do 
    find ./${d} -type f -exec sed -i 's/\.css/\.scss/g' {} \;
done
