function google_api(){
    var neighborhood_object = {
        "albany park" : "Albany Park",
        "archer heights" : "Archer Heights",
        "armour square" : "Armour Square",
        "ashburn" : "Ashburn",
        "auburn gresham" : "Auburn Gresham",
        "austin" : "Austin",
        "avalon park" : "Avalon Park",
        "avondale" : "Avondale",
        "belmont cragin" : "Belmont Cragin",
        "beverly" : "Beverly",
        "bridgeport" : "Bridgeport",
        "brighton park" : "Brighton Park",
        "burnside" : "Burnside",
        "calumet heights" : "Calumet Heights",
        "chatham" : "Chatham",
        "chicago lawn" : "Chicago Lawn",
        "clearing" : "Clearing",
        "douglas" : "Douglas",
        "dunning" : "Dunning",
        "east garfield park" : "East Garfield Park",
        "east side" : "East Side",
        "edgewater" : "Edgewater",
        "edison park" : "Edison Park",
        "englewood" : "Englewood",
        "forest glen" : "Forest Glen",
        "fuller park" : "Fuller Park",
        "gage park" : "Gage Park",
        "garfield ridge" : "Garfield Ridge",
        "grand boulevard" : "Grand Boulevard",
        "greater grand crossing" : "Greater Grand Crossing",
        "hegewisch" : "Hegewisch",
        "hermosa" : "Hermosa",
        "humboldt park" : "Humboldt Park",
        "hyde park" : "Hyde Park",
        "irving park" : "Irving Park",
        "jefferson park" : "Jefferson Park",
        "kenwood" : "Kenwood",
        "lake view" : "Lake View",
        "lincoln park" : "Lincoln Park",
        "lincoln square" : "Lincoln Square",
        "logan square" : "Logan Square",
        "loop" : "Loop",
        "lower west side" : "Lower West Side",
        "mckinley park" : "McKinley Park",
        "montclare" : "Montclare",
        "morgan park" : "Morgan Park",
        "mount greenwood" : "Mount Greenwood",
        "near north side" : "Near North Side",
        "near south side" : "Near South Side",
        "near west side" : "Near West Side",
        "new city" : "New City",
        "north center" : "North Center",
        "north lawndale" : "North Lawndale",
        "north park" : "North Park",
        "norwood park" : "Norwood Park",
        "o'hare" : "O'Hare",
        "oakland" : "Oakland",
        "portage park" : "Portage Park",
        "pullman" : "Pullman",
        "riverdale" : "Riverdale",
        "rogers park" : "Rogers Park",
        "roseland" : "Roseland",
        "south chicago" : "South Chicago",
        "south deering" : "South Deering",
        "south lawndale" : "South Lawndale",
        "south shore" : "South Shore",
        "uptown" : "Uptown",
        "washington heights" : "Washington Heights",
        "washington park" : "Washington Park",
        "west elsdon" : "West Elsdon",
        "west englewood" : "West Englewood",
        "west garfield park" : "West Garfield Park",
        "west lawn" : "West Lawn",
        "west pullman" : "West Pullman",
        "west ridge" : "West Ridge",
        "west town" : "West Town",
        "woodlawn" : "Woodlawn"
    }
    var address = document.getElementById("textEntry").value.toLowerCase();
    if (neighborhood_object[address]){
        // Okay, now we just need to goto the neighborhood call server?
        var address = neighborhood_object[address];
    }
    // ajax call
    else{
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({'address':address}, function(results, status){
            console.log(results, status);
            var point = results[0].geometry.location
            console.log(point);
            var lat = point.kb;
            var lon = point.jb;

            $.ajax({
                url:"find_census_block",
                data:{lat:lat,
                      lon: lon}
            })
        });
    }
}