// safari check
var isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
if (isSafari && !webgl_detect()) {
  TweenLite.to($('#safariModal'), .25, {autoAlpha:1})
}



// get rid of loadBar
TweenLite.to($('#loadBar'), .25, {autoAlpha:0})
TweenLite.to($('#wrapper'), .25, {autoAlpha:1})

// Clear out extra space in the body, don't let scrollbars show
document.body.style.margin = 0;
document.body.style.padding = 0;
document.body.style.overflow = 'hidden';
document.body.style.background = "#FFF";

var main = this;

var w = 960;
var h = 800;
var padding = 40;

var albers = d3.geo.albers()
    .scale(80000)
    .origin([-87.63073,41.836084])
    .translate([400,400]);

var path = d3.geo.path().projection(albers);
var data = neighborhood; // census_block
// var data = census_tract;

// three.js & d3 vars
var camera, scene, renderer, geometry, material, mesh;
var mouse = { x: 0, y: 0 }, INTERSECTED;
var plane;
var planeMat;
var camYPos = 200;
var geons = {};
var appConstants  = {

    TRANSLATE_0 : 0,
    TRANSLATE_1 : 0,
    SCALE : 80000,
    origin : [-87.63073,41.836084]
}

var neighborhoods = [];
var blocks = [];
var extrudeMultiplier = 1;

// are we circling the city or a neighborhood?
var flying = false;

// vars for trig flyAround
var centerX = 150;
var centerY = 150;
var radiusX = 300;
var radiusZ = 550;
var radiusHood = 1;
var currentAngle = Math.PI * 1.988;
var angleStep = 0;

// camera position vars
var camPosX;
var camPosY = 200;
var camPosZ;

// lookAt vars
var la = new THREE.Object3D();
var laX;
var laY;
var laZ;

var currentState;
var currentRollover;
var currentCentroid;
var clickedNeighborhood;
var total_savings = 0;

var overFooter = true;

// this file contains all the geo related objects and functions
geons.geoConfig = function() {
    this.TRANSLATE_0 = appConstants.TRANSLATE_0;
    this.TRANSLATE_1 = appConstants.TRANSLATE_1;
    this.SCALE = appConstants.SCALE;
    this.origin = appConstants.origin;

    this.mercator = d3.geo.mercator();
    var wtf = this;
    this.albers = d3.geo.albers()
    .scale(wtf.SCALE)
    .origin(wtf.origin)
    .translate([wtf.TRANSLATE_0,wtf.TRANSLATE_1]);
    
    this.path = d3.geo.path().projection(this.albers);
}

// geoConfig contains the configuration for the geo functions
var geo = new geons.geoConfig();

// three.js setup
function initScene() {

  scene = new THREE.Scene();
  var WIDTH = window.innerWidth, HEIGHT = window.innerHeight;
  var VIEW_ANGLE = 45, NEAR = 1, FAR = 10000;
  projector = new THREE.Projector();

  // create a WebGL renderer, camera, and a scene
  renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.shadowMapEnabled = true;
  renderer.shadowMapSoft = true;

  camera = new THREE.PerspectiveCamera( VIEW_ANGLE, WIDTH / HEIGHT, NEAR, FAR );
  camPosX = Math.cos(currentAngle * Math.PI * 2) * radiusX;
  camPosY = camYPos;
  camPosZ = Math.sin(currentAngle * Math.PI * 2) * radiusZ;


  // intro camera position
  // camera.position.x = 0;
  // camera.position.y = 1500;
  // camera.position.z = 10;
  
  // add and position the camera at a fixed position
  scene.add(camera);
  //camera.lookAt( scene.position );

  // calculate dynamic lookAt object position
  laX = Math.cos(currentAngle * Math.PI * 2) * radiusX * .6;
  laY = 150;
  laZ = Math.sin(currentAngle * Math.PI * 2) * radiusZ * .6;

  //camera.lookAt( scene.position );
  
  // start the renderer, and white background
  renderer.setSize(WIDTH, HEIGHT);
  renderer.setClearColorHex( 0xFFFFFF, 1 );
  
  // add the render target to the page
  $("#container").append(renderer.domElement);

  var darkness = 0.75;

  // add one light above to cast shadow & 4 periperal lights around scene
  addSpotLightAbove(0, 1000, 1);
  addPeripheralSpotlight(-500, 0, 0);
  addPeripheralSpotlight(500, 0, 0);
  addPeripheralSpotlight(0, 0, -500);
  addPeripheralSpotlight(0, 0, 500);
  
  // add a base plane on which we'll render our map
  var planeGeo = new THREE.PlaneGeometry(1000, 1000, 10, 10);
  var planeTex = THREE.ImageUtils.loadTexture(floor_url);
  planeTex.wrapS = planeTex.wrapT = THREE.RepeatWrapping;
  planeTex.repeat.set( 10, 10 );
  //var planeMat = new THREE.MeshLambertMaterial({color: 0xFFFFFF}); // renders ugly radial gradient shadow
  planeMat = new THREE.MeshBasicMaterial( { map: planeTex } ); // use jpg texture to get shadows we want
  planeMat.opacity = 0;
  plane = new THREE.Mesh(planeGeo, planeMat);

  // rotate plane to correct position
  plane.rotation.x = -Math.PI/2;
  plane.receiveShadow = true;
  plane.position.y = 0;
  plane.properties.name = "floor";
  scene.add(plane);
}

function addSpotLightAbove(x, y, z) {
  var spotLight = new THREE.SpotLight(0xFFFFFF);
  spotLight.position.set( x, y, z );
  spotLight.castShadow = true;
  spotLight.shadowDarkness = .1;
  spotLight.intensity = 1;
  // spotLight.shadowCameraVisible = true;
  scene.add(spotLight);
}

function addPeripheralSpotlight(x, y, z) {
  var spotLight = new THREE.SpotLight(0xFFFFFF, .35);
  spotLight.position.set( x, y, z );
  spotLight.intensity = .35;
  //spotLight.castShadow = true;
  //spotLight.shadowDarkness = .5;
  //spotLight.shadowCameraVisible = true;
  scene.add(spotLight);
}

function introAnimation() {
  TweenLite.to($('#wrapper'), 0, { autoAlpha:0} );
  TweenLite.to(camera.position, 1, { z:800, ease:Linear.easeNone} );
  TweenLite.to(camera.position, 1.0625, { y:250, ease:Circ.easeInOut, delay: .75} );
  TweenLite.to(camera.position, 1, {x:(Math.cos(currentAngle * Math.PI * 2) * radiusX), ease:Quad.easeOut, delay:.5})
  TweenLite.to(camera.position, .5, { z:(Math.sin(currentAngle * Math.PI * 2) * radiusZ), ease:Quad.easeOut, delay: 1.25, overwrite: false} );
  TweenLite.to($('#wrapper'), .5, { autoAlpha:1, ease:Quad.easeOut, delay: 1.5, overwrite:false} );
  $("#wrapper").show();
}

// TweenLite.delayedCall(1, introAnimation);

// add the loaded gis object (in geojson format) to the map
function addGeoObject() {

    // Show the loader at the beginning of this function
    $("#container").addClass("grayscaleAndLighten");
    TweenLite.to($('#overlay'), .5, {autoAlpha: .75, delay: 0});
    TweenLite.to($('#loader_gif'), 0, {autoAlpha: 1, delay: 0});
    
    // calculate the max and min of all the property values
    var gas_eff_min_max = d3.extent(data.features, function(feature){
        return feature.properties.gas_rank;
    });

    var elec_eff_min_max = d3.extent(data.features, function(feature){
        return feature.properties.elect_rank;
    });
  // convert to mesh and calculate values
  _.each(data.features, function (geoFeature) {
    var feature = geo.path(geoFeature);
    var centroid = geo.path.centroid(geoFeature);

    // we only need to convert it to a three.js path
    mesh = transformSVGPathExposed(feature);
    // the two different scales that we use, extrude determines
    // the height and color is obviously color. You can choose
    // from the max_min that we calculated above, ensure this
    // matches with below where you call these functions.

    var color_scale = d3.scale.quantile()
    //var color_scale = d3.scale.ordinal()
      .domain(gas_eff_min_max)
      //.range([ 'red', 'blue', 'purple']);
      .range(colorbrewer.RdYlGn[9]);

    var extrude_scale = d3.scale.linear()
      .domain(elec_eff_min_max)
      .range([10, 75]);

    // create material color based on gas efficiency Ensure the
    // property matches with the scale above, we'll add automatic
    // matching functionality later
    console.log(geoFeature.properties.gas_efficiency)
    if (geoFeature.properties.gas_efficiency === 0){
       var hexMathColor = parseInt("0xAAAAAA");
    }	
    else{
       var mathColor = color_scale(geoFeature.properties.gas_rank);
       var hexMathColor = parseInt(mathColor.replace("#", "0x"));
    } 
    console.log("Math color is: ",mathColor, hexMathColor);
    material = new THREE.MeshLambertMaterial({
      color: hexMathColor
    });

    // create extrude based on electricity efficiency
    var extrude = extrude_scale(geoFeature.properties.elect_rank);

    // Add the attributes to the mesh for the height of the polygon
    var shape3d = mesh.extrude({
      amount: Math.round(extrude * extrudeMultiplier),
      bevelEnabled: false
    });

    // create a mesh based on material and extruded shape
    var hoodMesh = new THREE.Mesh(shape3d, material);
    // rotate and position the elements nicely in the center
    hoodMesh.rotation.x = Math.PI / 2;
    hoodMesh.translateY(extrude / 2);

    // zero all y positions of extruded objects
    hoodMesh.position.y = extrude * extrudeMultiplier;
    hoodMesh.properties = geoFeature.properties;
    hoodMesh.properties.shape = geoFeature.geometry.coordinates[0]
    hoodMesh.castShadow = true;
    hoodMesh.receiveShadow = false;
    hoodMesh.properties.centroid = centroid;

    var obj = {}
    obj.shape3d = shape3d;
    obj.material = material;
    obj.extrude = extrude  * extrudeMultiplier;
    obj.mesh = hoodMesh;
    obj.props = hoodMesh.properties;
    neighborhoods.push(obj);
    
    // add to scene
    scene.add(hoodMesh);
  });

  // Remove the loader gif at the end of this function
  TweenLite.to($('#overlay'), .5, {autoAlpha: 0});
  TweenLite.to($('#loader_gif'), .5, {autoAlpha: 0});
  TweenLite.delayedCall(.5, colorizeMap);
}

TweenLite.delayedCall(.125, startFlying, ["city"]);

function startFlying(state) {
  flying = true;
  currentState = state;
  TweenLite.to(planeMat, .5, {opacity:1, delay:.5})
  TweenLite.to(plane.position, .5, {y:-10, delay:.5})
}

function flyAround() {

  // ease into flying animation
  if (angleStep < .00015) angleStep += .000001; // change back to .00015 & .000001 for launch

  currentAngle += angleStep;

  switch (currentState) {
    case "city" :
      camPosX = Math.cos(currentAngle * Math.PI * 2) * radiusX;
      camPosZ = Math.sin(currentAngle * Math.PI * 2) * radiusZ;
      // calculate dynamic lookAt object position
      laX = Math.cos(currentAngle * Math.PI * 2) * radiusX * .6;
      laY = 150;
      laZ = Math.sin(currentAngle * Math.PI * 2) * radiusZ * .6;
    break;

    case "neighborhood" :
      camPosX = Math.cos(currentAngle * Math.PI * 2) * radiusHood;
      camPosZ = Math.sin(currentAngle * Math.PI * 2) * radiusHood;
    break;

    default :
    break;
  }

  if (currentAngle < -1 ) {
    currentAngle = 0;
    stage.removeEventListener(Event.ENTER_FRAME, advanceCircle);
    start_btn.addEventListener(MouseEvent.CLICK, startCircle);
  }
}

// ***** AARON CODE!!
function drawmap(shape){
  if (google_map !== ""){
    // first remove the overlay from the map
      chicagoOverlay.setMap(null);
      var shape_coords = [];

      // Push the shape to show on the map
      _.each(shape, function(item){
        shape_coords.push(new google.maps.LatLng(item[1],item[0]));
      });
      // var shape_coords = [
      // new google.maps.LatLng(41.836084, -87.63073),
      // new google.maps.LatLng(41.836084, -87.59073),
      // new google.maps.LatLng(41.876084, -87.59073),
      // new google.maps.LatLng(41.876084, -87.63073),
      // new google.maps.LatLng(41.836084, -87.63073)
      // ];

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
}


function render() {

  la.x = laX;
  la.y = laY;
  la.z = laZ;
  camera.lookAt( la );

  camera.position.x = camPosX;
  camera.position.y = camPosY;
  camera.position.z = camPosZ;

  if (flying) flyAround();


  //////////////////////////////
  ///* BEGIN ROLLOVER LOGIC *///
  //////////////////////////////
  var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
  projector.unprojectVector( vector, camera );
  var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
  var intersects = raycaster.intersectObjects( scene.children );

  if (intersects.length > 0 && currentState == "city" && !overFooter || currentState == "neighborhood" && !overFooter) {
  
    if ( INTERSECTED !== intersects[ 0 ].object ) {
      if ( INTERSECTED && INTERSECTED.properties.name !== "floor" ) {
        INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
      }
      INTERSECTED = intersects[ 0 ].object;

      // if mouse is intersecting the floor, fade out tooltip
      if (INTERSECTED.properties.name == "floor") {
        TweenLite.to(rolloverTip, .25, {autoAlpha:0});
        return;
      }

      TweenLite.to(rolloverTip, .25, {autoAlpha:1})
      INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
      INTERSECTED.material.emissive.setHex( 0x900800 );

      // log which object is beneath the mouse
      currentRollover = INTERSECTED.properties.name;
      currentCentroid = INTERSECTED.properties.centroid;
      drawmap(INTERSECTED.properties.shape);
      var max_rank = data.features.length;
      if (currentState == "neighborhood"){
	  $("#neighborhoodText").html(INTERSECTED.properties.nice.replace(/ [S|N|W|E] /, " Block of "));
	  $("#tipSubHead").html("ENERGY USE");
console.log(INTERSECTED.properties.gas_efficiency.toFixed(2));
    if (INTERSECTED.properties.gas_efficiency === 0){
        $("#tipGasRankText").html("N/A");
    }
    else{
       $("#tipGasRankText").html(INTERSECTED.properties.gas_efficiency.toFixed(2) + " th");
    }
    if (INTERSECTED.properties.elect_efficiency === 0){
      $("#tipElectricRankText").html("N/A");
    }
    else{
      $("#tipElectricRankText").html(INTERSECTED.properties.elect_efficiency.toFixed(2) + " kWh");
	}
      $("#detailText").html("");
      }
      else if (currentState == "city"){
	  $("#neighborhoodText").html(INTERSECTED.properties.name);
	  $("#tipSubHead").html("NEIGHBORHOOD RANK");
	  $("#tipGasRankText").html(INTERSECTED.properties.gas_rank + " / " + max_rank);
	  $("#tipElectricRankText").html(INTERSECTED.properties.elect_rank + " / " + max_rank);
	  $("#detailText").html("• CLICK FOR DETAIL •");
      }

    }

  } else {
    
    TweenLite.to(rolloverTip, .25, {autoAlpha:0});
    currentRollover = "";  

    if ( INTERSECTED && INTERSECTED.properties.name !== "floor" ) {
      INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
    }

    // change color of object on rollover only if it's not the floor
    if (INTERSECTED && INTERSECTED.properties.name == "floor") {
      INTERSECTED = null;
    }


    currentRollover = "";
    INTERSECTED = null;

  }

  // AARON CODE FOR TWEENING THE TOTAL
  $("#total_savings").html(total_savings.toFixed());

  ////////////////////////////
  ///* END ROLLOVER LOGIC *///
  ////////////////////////////

  renderer.render( scene, camera );
}

function disappearCity(clickedHood) {
  //var obj = neighborhoods[59];

  // currentState = "neighborhood";

  TweenLite.to(rolloverTip, .25, {autoAlpha:0});
  TweenLite.to(planeMat, .5, {opacity:0, delay:.5});

  var i;
  var totalNeighborhoods = neighborhoods.length;
  var delay = 1/256;
  var time = .5;
  var totalTime = time + totalNeighborhoods * delay + .25;

  for (i = totalNeighborhoods - 1; i >=0; i--)
  {
    var obj = neighborhoods[i];
    TweenLite.to(obj.mesh.scale, time, {z:.01, ease:Expo.easeOut, delay: i * delay})
    TweenLite.to(obj.mesh.position, time, {y:obj.extrude * .01, ease:Expo.easeOut, overwrite:false, delay: i * delay});
    if (clickedNeighborhood !== obj.props.name) TweenLite.to(obj.material, time, {opacity:0, delay:.25 + i * delay, onComplete: cleanUpNeighborhood, onCompleteParams: [obj]});
    else TweenLite.to(obj.material, time, {opacity:0, delay:.25 + i * delay + .75, onComplete: cleanUpNeighborhood, onCompleteParams: [obj]});
    // TweenLite.to(obj.material, time, {opacity:0, delay:.25 + i * delay});
    // TweenLite.delayedCall(25 + i * delay, cleanUpNeighborhood, [obj]);
  }

  TweenLite.delayedCall(totalTime - .5, greyContainer);
  TweenLite.to($("#branding"), .25, {autoAlpha:0, delay:totalTime - 1});
  TweenLite.to($(".search"), .25, {autoAlpha:0, delay:totalTime - 1});
  // TweenLite.to($("#key"), .25, {autoAlpha:0, delay:totalTime - 1});
  TweenLite.to($("#footer"), .25, {autoAlpha:0, delay:totalTime - 1});
  TweenLite.to($("#hoodOverviewContainer"), .25, {autoAlpha:1, delay:totalTime - 1});
  TweenLite.to($("#container"), .25, {autoAlpha:0, delay:totalTime - .25});
  TweenLite.delayedCall(totalTime - .25, growNeighborhoodDetail);

}

function cleanUpNeighborhood(obj) {
  scene.remove(obj.mesh);
  // clean up
  obj.shape3d.dispose();
  obj.material.dispose();
  delete obj.mesh;
}

function create2Dmap(){

  var vis = d3.select("#wrapper")
    .append("svg")
    .attr("viewbox", "200 200 800 800")//+ window.innerWidth+" "+window.innerHeight)
    .attr("width", "100%")
    .attr("height", "100%");

  // Change the albers projection and path
  var albers_2D = d3.geo.albers()
    .scale(800000)
    .origin([data.centroid[0],data.centroid[1]])
    .translate([400,400]);

  var path_2D = d3.geo.path().projection(albers_2D);

  // calculate the max and min of all the property values
  var gas_eff_min_max = d3.extent(data.features, function(feature){
    return feature.properties.gas_rank;
  });

  var color_scale = d3.scale.quantile()
    .domain(gas_eff_min_max)
    .range(colorbrewer.RdYlGn[9]);

  var blocks = vis.selectAll("path")
    .data(data.features);

  var numBlocks = data.features.length;
  console.log("numblocks is: " + numBlocks);

  blocks.enter().append("path")
    .attr('fill', function(d){return color_scale(d.properties.gas_rank);})
    .attr('stroke',"none")
    .attr("d", path_2D);
    d3.selectAll("path").on("mouseover", function(d){
        console.log("mouseover!");
      $("#neighborhoodText").html(d.properties.name);
      $("#tipGasRankText").html(d.properties.gas_rank + " / " + numBlocks);
      $("#tipElectricRankText").html(d.properties.elect_rank + " / " + numBlocks);
    });
}

function growNeighborhoodDetail() {
  // data = census_block;
  extrudeMultiplier = .15;
  console.log(data);
  // create2Dmap();

  TweenLite.delayedCall(.25,addGeoObject);
  // $("#neighborhoodText").html(d.properties.name);
  // $("#tipGasRankText").html(d.properties.gas_rank + " / " + numBlocks);
  // $("#tipElectricRankText").html(d.properties.elect_rank + " / " + numBlocks);

  TweenLite.to($("#container"), .25, {autoAlpha:1})
}

function greyContainer() {
  $("#container").addClass("grayscaleAndLighten");
}

function colorizeContainer() {
  $("#container").removeClass("grayscaleAndLighten");
}

function removeBlocks() {
  var i;
  console.log("new code!");
  var totalNeighborhoods = neighborhoods.length;
  for (i = totalNeighborhoods - 1; i >= 0; i--)
  {
    var obj = neighborhoods[i];
    cleanUpNeighborhood(obj);
  }

  TweenLite.to($("#container"),.25,{autoAlpha:1});
  // tween camera position via camPosX/Y vars
  TweenLite.to(main, 2, {camPosX: cityCamPosX, camPosY:cityCamPosY, camPosZ: cityCamPosZ, ease:Quint.easeInOut});
  // tween lookAt position
  TweenLite.to(main, 1.5, {laX: cityLaX, laY:cityLaY, laZ: cityLaZ, delay:.5, ease:Quint.easeInOut, onComplete: setCurrentState, onCompleteParams: ["city", "resumeFlying"]});

  // kill the city

  TweenLite.delayedCall(1.5, reappearCity); 

  // TweenLite.delayedCall(.5, removeHelperFunction);
  // removeHelperFunction();
}

function removeHelperFunction (){
  TweenLite.to($("#container"),.25,{autoAlpha:1});
  // tween camera position via camPosX/Y vars
  TweenLite.to(main, 2, {camPosX: cityCamPosX, camPosY:cityCamPosY, camPosZ: cityCamPosZ, delay: 1.25, ease:Quint.easeInOut});
  // tween lookAt position
  TweenLite.to(main, 1.5, {laX: cityLaX, laY:cityLaY, laZ: cityLaZ, delay:1.75, ease:Quint.easeInOut, onComplete: setCurrentState, onCompleteParams: ["city", "resumeFlying"]});

  // kill the city

  TweenLite.delayedCall(1, reappearCity); 
}

function transition_neighborhood(){
  // tween camera position via camPosX/Y vars
  TweenLite.to(main, 2, {camPosX: cityCamPosX, camPosY:cityCamPosY, camPosZ: cityCamPosZ, ease:Quint.easeInOut});
  // tween lookAt position
  TweenLite.to(main, 1.5, {laX: cityLaX, laY:cityLaY, laZ: cityLaZ, delay:.5, ease:Quint.easeInOut, onComplete: setCurrentState, onCompleteParams: ["city", "resumeFlying"]});

  // kill the city
  // reappearCity();
  // TweenLite.delayedCall(.75, reappearCity); 

}
function reappearCity(clickedHood) {
  //var obj = neighborhoods[59];

  // TweenLite.to($("#container"), .125, {autoAlpha:0});
  // removeBlocks();
  // TweenLite.to($("#container"), .125, {autoAlpha:1});

  // fix up the google map
  var newCenter = new google.maps.LatLng(41.836084, -87.63073); // chicago
  google_map.setZoom(9);
  google_map.setCenter(newCenter);
  // clear neighborhoods array
  neighborhoods = [];

  // currentState = "neighborhood";
  data = neighborhood;
  extrudeMultiplier = 1;
  addGeoObject();

  // TweenLite.to(rolloverTip, .25, {autoAlpha:1});
  TweenLite.to(planeMat, .5, {opacity:1, delay:.5});

  var i;
  var totalNeighborhoods = neighborhoods.length;
  var delay = 1/256;
  var time = .5;
  var totalTime = time + totalNeighborhoods * delay + .25;

  for (i = 0; i < totalNeighborhoods; i++)
  {
    var obj = neighborhoods[i];

    // initialize objects to flattened & invisible positions
    TweenLite.to(obj.mesh.scale, 0, {z:.01, ease:Expo.easeOut})
    TweenLite.to(obj.mesh.position, 0, {y:obj.extrude * .01, ease:Expo.easeOut, overwrite:false});
    TweenLite.to(obj.material, 0, {opacity:0});

    TweenLite.to(obj.mesh.scale, time, {z:1, ease:Expo.easeOut, delay: .25 + i * delay, overwrite:false})
    TweenLite.to(obj.mesh.position, time, {y:obj.extrude, ease:Expo.easeOut, overwrite:false, delay: .25 + i * delay, overwrite:false});
    TweenLite.to(obj.material, time, {opacity:1, delay:i * delay, overwrite:false});
  }

  TweenLite.to($("#hoodOverviewContainer"), .25, {autoAlpha:0});
  TweenLite.to($("#branding"), .25, {autoAlpha:1, delay:totalTime - 1});
  TweenLite.to($(".search"), .25, {autoAlpha:1, delay:totalTime - 1});
  TweenLite.to($("#key"), .25, {autoAlpha:1, delay:totalTime - 1});
  TweenLite.to($("#footer"), .25, {autoAlpha:1, delay:totalTime - 1});

  TweenLite.delayedCall(totalTime, setCurrentState, ["city"]);
}

function animate() {
  requestAnimationFrame( animate );
  render();
}

initScene();
addGeoObject();
animate();
//console.log(neighborhoods);
//renderer.render( scene, camera );
console.log("Social media is: ", social_media);
if (social_media === "facebook"){
  FB.init({appId: facebook_app_id, status: true, cookie: true});
  $("#energyEfficiencyButton").trigger("click");

  var obj = {
      method: 'feed',
      // redirect_uri: 'http://chicagoenergy.datascopeanalytics.com',
      link: 'https://developers.facebook.com/docs/reference/dialogs/',
      picture: fb_screenshot_url,
      name: 'Chicago Energy Data Map',
      caption: 'Improving energy efficiency in Chicago',
      description: 'I just pledged to be more energy efficient on behalf of my neighborhood via the Chicago Energy Data Map!'
  };

  function callback(response) {
  }

  FB.ui(obj, callback);
  }
else if (social_media == "twitter"){
    var tweet = encodeURIComponent("I just pledged to improve energy efficiency in Chicago! http://chicagoenergy.datascopeanalytics.com/ Thanks @OpenDataChicago #chicagoEnergy");
    window.open("http://twitter.com/intent/tweet?text=" + tweet, "", "height=300, width=600");
}


function pledge_return(response) {
    if (response.length !== 0) {

        var html = ""
        var total = 0;
        _.each(response, function(item) {
            total += item.savings;
            html += "<li><span class='pledge_name'>" + item.name + "</span> $<span class='pledge_savings'>" + item.savings + "</span><button class='tipButton'>I'LL DO THIS!</button></li>"
        });
        $("#tipsList").html(html);

        $(".tipButton").click(function() {
            var pledge_amount = parseInt($(this).siblings(".pledge_savings").text());
            if (!$(this).hasClass('tipButtonClicked')) {
                // add this pledge
                var new_savings = total_savings + pledge_amount;
                $(this).addClass("tipButtonClicked").removeClass(".tipButton");
            } else {
                // remove this pledge
                var new_savings = total_savings - pledge_amount;
                $(this).removeClass("tipButtonClicked").addClass(".tipButton");
            }
            // tween to the new value
            TweenLite.to(main, .5, {
                total_savings: new_savings
            });
        });


    } else {
        // nothing to display not sure what to do

    }
}

function check_neighborhood(){

  var address = document.getElementById("neighborhoodEntry").value.toLowerCase();

  if (neighborhood_object[address]){
    // Okay, now we just need to goto the neighborhood call server?
    currentRollover = neighborhood_object[address];

    var pledge_array = _.map($(".tipButtonClicked"), function(node){
        return $(node).siblings('.pledge_name').text();
    });
    var name = $(".tipButtonClicked").siblings('span').text();
    var subtype = $("#subtypeChoices").val();
    console.log("hello");
    $.ajax({url: auth,
           data:{subtype:subtype,
               name: pledge_array,
               neighborhood:neighborhood_object[address]
           }
       })
    .done(function(response){
        console.log("heelo: ",response);
        if (response === "failure"){
         TweenLite.to($('#socialLogin'), .25, {autoAlpha: 1});
        }
        else{
            // We had a success, lets say thanks for the pledge!
            window.location.href = neighborhood_url + "?social_media=" + response;
        }
    });

  }
  // Not a neighborhood, maybe a valid address?
  else{
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({'address':address}, function(results, status){
        var point = results[0].geometry.location
        var lat = point.kb;
        var lon = point.jb;
        console.log(lat,lon, address)
        $.ajax({
            url:find_census_block,
            data:{lat:lat,
              lon: lon},
              success:function(data){
                console.log(data);
                // If data is valid, then we have a census block otherwise
                // we have a bad search
                if (data !==""){
                    currentRollover = data;
                    var pledge_array = _.map($(".tipButtonClicked"), function(node){
                        return $(node).siblings('.pledge_name').text();
                    });
                    var name = $(".tipButtonClicked").siblings('span').text();
                    var subtype = $("#subtypeChoices").val();
                    $.ajax({url: auth,
                       data:{subtype:subtype,
                         name: pledge_array,
                         neighborhood:data
                     }
                    })
                    .done(function(response){
                        if (response === "failure"){
                           TweenLite.to($('#socialLogin'), .25, {autoAlpha: 1});
                       }
                       else{
                         // We had a success, lets say thanks for the pledge!
                         window.location.href = neighborhood_url + "?social_media=" + response;
                       }
                    });
                }
                // reset the search value
                else{
                    var input = document.getElementById('neighborhoodEntry');
                    input.value = "ENTER ADDRESS OR NEIGHBORHOOD";
                }
            }
        })
    });




  }
}


////////////////// BUTTON ACTIONS //


$("#aboutButton").click(function() {
  currentState = "overlay";
  $("#container").addClass("grayscaleAndLighten");
  TweenLite.to($('#branding'), .5, {autoAlpha: 0, delay: .25});
  TweenLite.to($('#addressField'), .5, {autoAlpha: 0, delay: .25});
  TweenLite.to($('#map_canvas'), .5, {autoAlpha: 0, delay: .25});
  TweenLite.to($('#overlay'), .5, {autoAlpha: .75, delay: .375});
  TweenLite.to($('#about'), .5, {autoAlpha: 1, delay: .375});
  TweenLite.to($('#key'), .5, {autoAlpha: 0, delay: .25});
});

$("#leaderboardButton").click(function() {
  currentState = "overlay";
  $("#container").addClass("grayscaleAndLighten");
  TweenLite.to($('#branding'), .5, {autoAlpha: 0, delay: .25});
  TweenLite.to($('#addressField'), .5, {autoAlpha: 0, delay: .25});
  TweenLite.to($('#map_canvas'), .5, {autoAlpha: 0, delay: .25});
  // TweenLite.to($('#overlay'), .5, {autoAlpha: .75, delay: .375});
  TweenLite.to($('#leaderboard'), .5, {autoAlpha: 1, delay: .375});
  TweenLite.to($('#key'), .5, {autoAlpha: 0, delay: .25});
  $.ajax({url: leaderboard})
    .done(function (leaders){
        var html = ""
        _.each(leaders, function(leader, index){
		html +=  "<li>"+leader[0]+' <div class="pledge">'+leader[1]+ ' / $'+ leader[2] + "</div></li>";
        });
        $("#board").html(html);
    });
});

$(".closeButton").click(function() {
  currentState = "city";
  TweenLite.to($('#branding'), .5, {autoAlpha: 1, delay: .25});
  TweenLite.to($('#addressField'), .5, {autoAlpha: 1, delay: .25});
  TweenLite.to($('#map_canvas'), .5, {autoAlpha: 1, delay: .25});
  TweenLite.to($('#overlay'), .5, {autoAlpha: 0});
  TweenLite.to($('#about'), .5, {autoAlpha: 0});
  TweenLite.to($('#leaderboard'), .5, {autoAlpha: 0});
  TweenLite.to($('#efficiencyTips'), .5, {autoAlpha: 0});
  TweenLite.to($('#key'), .5, {autoAlpha: 1, delay: .25});
  TweenLite.delayedCall(.5, colorizeMap)
});



$("#energyEfficiencyButton").click(function() {
  currentState = "overlay";
  $("#container").addClass("grayscaleAndLighten");
  TweenLite.to($('#branding'), .5, {autoAlpha: 0, delay: .25});
  TweenLite.to($('#addressField'), .5, {autoAlpha: 0, delay: .25});
  TweenLite.to($('#map_canvas'), .5, {autoAlpha: 0, delay: .25});
  TweenLite.to($('#key'), .5, {autoAlpha: 0, delay: .25});
  // TweenLite.to($('#overlay'), .5, {autoAlpha: .75, delay: .375});
  TweenLite.to($('#efficiencyTips'), .5, {autoAlpha: 1, delay: .375});
  var subtype = $("#subtypeChoices").val();

  $.ajax({url: pledge,
         data:{subtype:subtype}
     })
    .done(pledge_return);
});

$("#backToCityButton").click(function() {
  // hide 'back to city' button
  TweenLite.to($('#backToCityButton'), .25, {autoAlpha:0});
  TweenLite.to($('#container'), .25, {autoAlpha:0});
  TweenLite.to($('#key'), .25, {autoAlpha:0});
  TweenLite.to($('#hoodOverviewContainer'), .25, {autoAlpha:0, onComplete:cheatRefresh});
  // TweenLite.delayCall(.25,removeBlocks); 
  
//  removeBlocks();
});

function cheatRefresh() {
    window.location.reload();
}

$(".socialButton").click(function() {
  TweenLite.to($('#socialLogin'), .25, {autoAlpha: 0});
});
  
// change when they select a different subtype

$("#subtypeChoices").change(function() {

    var subtype = $(this).val();
    TweenLite.to(main, .5, {total_savings:0});
    $.ajax({
        url: pledge,
        data: {
            subtype: subtype
        }
    })
    .done(pledge_return);
})

// May not be required because of the auto complete functionality
$('#neighborhoodEntry').keypress(function(e) {
    console.log("you typed something");
    if (e.which == 13) {
        check_neighborhood();
    }
});

///// AUTO COMPLETE
var neighborhood_names = _.values(neighborhood_object);
$("#neighborhoodEntry").betterAutocomplete('init',neighborhood_names,{},{
    select:function (result, $input){
        console.log("You selected something.");
        $input.val(result.title);
        $input.blur();
        check_neighborhood();
    }
});


function colorizeMap() {
  $("#container").removeClass("grayscaleAndLighten");
}

////////////////// EVENT LISTENERS //

document.addEventListener( 'mousemove', onDocumentMouseMove, false );
window.addEventListener( 'resize', onWindowResize, false );
document.addEventListener( 'click', onDocumentClick, false );

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
  
  // set the d3 map dimensions?


}

function onDocumentMouseMove(event) {

  event.preventDefault();
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

  TweenLite.to($('#rolloverTip'), .1, { css: { left: event.pageX - 28, top: event.pageY - 150 }});

  // detect mouse position
  if ( event.pageY >= window.innerHeight - 61 && currentState == "city")
  {
    overFooter = true;
  } else {
    overFooter = false;
  }
}

var cityCamPosX, cityCamPosY, cityCamPosZ, cityLaX, cityLaY, cityLaZ; 

function onDocumentClick(event) {
  // save city view vars
  cityCamPosX = camPosX;
  cityCamPosY = camPosY;
  cityCamPosZ = camPosZ;
  cityLaX = laX;
  cityLaY = laY;
  cityLaZ = laZ;

  // if we've clicked on a neighborhood
  if (INTERSECTED.properties.name !== "floor" && currentRollover !== "" && currentState == "city" && !overFooter) {
    $("#hoodOverviewSubHead").html(INTERSECTED.properties.name + " Census Block Detail");
    console.log(camPosX, camPosZ);

    clickedNeighborhood = currentRollover;
    currentState = "";
    flying = false;
    //angleStep = 0;
    var newLaX = currentCentroid[0];
    var newLaY = 30;
    var newLaZ = currentCentroid[1];
    var angle = getAngle(camPosX, camPosZ, newLaX, newLaZ);
    var dist = getDistance(camPosX, camPosZ, newLaX, newLaZ);
    var newDist = dist - radiusHood;
    var newCamPosX = camPosX + Math.cos(angle) * newDist;
    var newCamPosZ = camPosZ + Math.sin(angle) * newDist;


  $.ajax({url:census_blocks,
           data:{name:clickedNeighborhood,
            building_subtype: 'All'
           }
       })
    .done(function(response){
      data = response;        
      // Adjust the google map

      google_map.setZoom(12);
      console.log(data.centroid);
      var newCenter = new google.maps.LatLng(data.centroid[1], data.centroid[0]);
      google_map.setCenter(newCenter);    
      

    // tween lookAt position
    TweenLite.to(main, 2, {laX: newLaX, laY:newLaY, laZ: newLaZ, ease:Quint.easeInOut});
    // tween camera position via camPosX/Y vars
    TweenLite.to(main, 2, {camPosX: newCamPosX, camPosY:60, camPosZ: newCamPosZ, delay:0, ease:Quint.easeInOut, onComplete: setCurrentState, onCompleteParams: ["neighborhood"]});

    // show 'back to city' button
    TweenLite.to($('#backToCityButton'), .25, {autoAlpha:1, delay: 1.75});

    // kill the city
    TweenLite.delayedCall(.75, disappearCity);
    });
  }
}

function getAngle(x1, y1, x2, y2) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    return Math.atan2(dy,dx);
}

function getDistance(x1, y1, x2, y2) {
  var xs = 0;
  var ys = 0;
  xs = x2 - x1;
  xs = xs * xs;
  ys = y2 - y1;
  ys = ys * ys;
  return Math.sqrt(xs + ys);
}

function setCurrentState(state, fly) {
  console.log(camPosX, camPosZ);
  currentState = state;
  if (fly == "resumeFlying") flying = true;
}

// WebGL detect
function webgl_detect(return_context)
{
    if (!!window.WebGLRenderingContext) {
        var canvas = document.createElement("canvas"),
             names = ["webgl", "experimental-webgl", "moz-webgl", "webkit-3d"],
           context = false;
 
        for(var i=0;i<4;i++) {
            try {
                context = canvas.getContext(names[i]);
                if (context && typeof context.getParameter == "function") {
                    // WebGL is enabled
                    if (return_context) {
                        // return WebGL object if the function's argument is present
                        return {name:names[i], gl:context};
                    }
                    // else, return just true
                    return true;
                }
            } catch(e) {}
        }
 
        // WebGL is supported, but disabled
        return false;
    }
 
    // WebGL not supported
    return false;
}