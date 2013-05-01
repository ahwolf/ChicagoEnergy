// from http://gmaps-samples-v3.googlecode.com/svn/trunk/styledmaps/wizard/index.html
var mapStyle = [
  {
    "featureType": "landscape",
    "stylers": [
      { "visibility": "off" }
    ]
  },{
    "featureType": "road.highway",
    "stylers": [
      { "color": "#c1c1c1" }
    ]
  },{
    "featureType": "road.arterial",
    "stylers": [
      { "color": "#c2c2c2" }
    ]
  },{
    "featureType": "road.local",
    "stylers": [
      { "color": "#d1d1d1" }
    ]
  },{
    "featureType": "transit.line",
    "stylers": [
      { "visibility": "simplified" }
    ]
  },{
    "featureType": "transit.station",
    "stylers": [
      { "lightness": 26 },
      { "saturation": -78 }
    ]
  },{
    "featureType": "poi",
    "stylers": [
      { "lightness": 35 }
    ]
  },{
  },{
  },{
  },{
    "featureType": "administrative",
    "stylers": [
      { "visibility": "off" }
    ]
  },{
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      { "color": "#808080" }
    ]
  },{
    "featureType": "road.highway",
    "elementType": "labels",
    "stylers": [
      { "visibility": "off" }
    ]
  },{
    "featureType": "poi"  },{
    "featureType": "road",
    "elementType": "labels",
    "stylers": [
      { "visibility": "off" }
    ]
  },{
    "featureType": "road",
    "elementType": "labels.text",
    "stylers": [
      { "visibility": "on" }
    ]
  },{
    "featureType": "poi.business",
    "stylers": [
      { "visibility": "off" }
    ]
  },{
    "featureType": "water",
    "stylers": [
      { "lightness": 35 }
    ]
  },{
  }
];



var google_map = "";
var chicagoOverlay = "";
var currentRollover = "";
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

var neighborhood_names = _.values(neighborhood_object);

$('#textEntry').keypress(function(e) {
    console.log("here", e)
    if (e.which == 13) {
        console.log("here");
        google_api();
    }
});

$("#textEntry").betterAutocomplete('init',neighborhood_names,{},{
    select:function (result, $input){
        console.log("selected");
        $input.val(result.title);
        $input.blur();
        google_api();
    }
});

initialize();
function initialize() {
  var mapOptions = {
    center: new google.maps.LatLng(41.836084, -87.63073), // chicago
    zoom: 9,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    styles: mapStyle,
    streetViewControl: false,
    scaleControl: false,
    rotateControl: false,
    mapTypeControl: false,
    zoomControl: false,
  };
  google_map = new google.maps.Map(document.getElementById("map_canvas"),
                            mapOptions);

  console.log(google_map);
  var shape_coords = [
    new google.maps.LatLng(41.836084, -87.63073),
    new google.maps.LatLng(41.836084, -87.59073),
    new google.maps.LatLng(41.876084, -87.59073),
    new google.maps.LatLng(41.876084, -87.63073),
    new google.maps.LatLng(41.836084, -87.63073)
  ];
  chicagoOverlay = new google.maps.Polygon({
    paths: shape_coords,
    strokeColor: '#FF0000',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#FF0000',
    fillOpacity: 0.35
  });
  chicagoOverlay.setMap(google_map);
}

//google.maps.event.addDomListener(window, 'load', initialize);

function google_api(){
    console.log("inside api")
    var address = document.getElementById("textEntry").value.toLowerCase();
    console.log(address);
    if (neighborhood_object[address]){
        // Okay, now we just call the onDocumentClick method
        currentRollover = neighborhood_object[address];
        currentCentroid = _.find(scene.children, function(mesh){
            return mesh.properties.name == currentRollover;
        }).properties.centroid;
        console.log(currentCentroid);
        onDocumentClick();
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
                url:find_census_block,
                data:{lat:lat,
                      lon: lon},
                success:function(data){
                    console.log("success!");
                    console.log(data);
                    
                    // If data is valid, then we have a census block otherwise
                    // we have a bad search
                    if (data !==""){
                        currentRollover = data;
                        currentCentroid = _.find(scene.children, function(mesh){
                            return mesh.properties.name == currentRollover;
                        }).properties.centroid;
                        google_map.setZoom(10);
                        console.log(currentCentroid);
                        onDocumentClick();
                        // re_draw the census_blocks with the census id's
                    }
                    // reset the search value
                    else{
                        var input = document.getElementById('textEntry');
                        input.value = "ENTER ADDRESS OR NEIGHBORHOOD";

                    }
                }
            })
        });
    }
}