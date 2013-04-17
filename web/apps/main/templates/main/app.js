// Clear out extra space in the body, don't let scrollbars show
document.body.style.margin = 0;
document.body.style.padding = 0;
document.body.style.overflow = 'hidden';
document.body.style.background = "#FFF";

var w = 960;
var h = 800;
var padding = 40;

var albers = d3.geo.albers()
    .scale(80000)
    .origin([-87.63073,41.836084])
    .translate([400,400]);

var path = d3.geo.path().projection(albers);

/*
// 2D rendering, not used for three.js
var vis = d3.select("#main_container")
    .append("svg")
    .attr("width", w)
    .attr("height", h);
*/

// change what you would like data to equal for different geo projections
//var data = ward;
var data = neighborhood;
// var data = census_tract;

// calculate the max and min of all the property values
var gas_min_max = d3.extent(data.features, function(feature){
    return feature.properties.gas;
});

var elec_min_max = d3.extent(data.features, function(feature){
    return feature.properties.elect;
});

var gas_eff_min_max = d3.extent(data.features, function(feature){
    return feature.properties.gas_efficiency;
});

var elec_eff_min_max = d3.extent(data.features, function(feature){
    return feature.properties.elect_efficiency;
});

// Render using d3
/*
var color_scale = d3.scale.linear()
    .domain(elec_eff_min_max)
    .range(['red','blue']);

vis.selectAll("path")
    .data(data.features)
    .enter().append("path")
    .attr('fill', function(d){return color_scale(d.properties.elect_efficiency);})
    .attr('stroke',"black")
    .attr("d", path);
*/

// Render using three.js

// The following code was copied from
// http://www.smartjava.org/content/render-geographic-information-3d-threejs-and-d3js
// and updated to take advantage of built in d3 tools

// three.js setup & basic functions
var camera, scene, renderer, geometry, material, mesh;

var appConstants  = {

    TRANSLATE_0 : 0,
    TRANSLATE_1 : 0,
    SCALE : 80000,
    origin : [-87.63073,41.836084]
}

var geons = {};

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

var stats = new Stats();
stats.setMode( 0 );
document.body.appendChild( stats.domElement );
// Align top-left
stats.domElement.style.position = 'absolute';
stats.domElement.style.left = '0px';
stats.domElement.style.top = '0px';

// geoConfig contains the configuration for the geo functions
geo = new geons.geoConfig();

initScene();
addGeoObject();
animate();
//enderer.render( scene, camera );

//////////////////////////////////////////////////////
/*
* NOTE FOR AARON:DsA:
*
* the following line is a looping function: requestAnimationFrame( animate );
* it calls itself in the argument, so anything w/in the {} runs every frame
* that the render() function gets called is what was moving the camera (you'll see the commented code w/in)
* the stats begin/end is for the included Stats.js - gives us our frameRate in the top left
*/
//////////////////////////////////////////////////////

function animate() {
  stats.begin();
  // note: three.js includes requestAnimationFrame shim  
  requestAnimationFrame( animate );
  render();
  stats.end();

  // keep the camera looking at the center point
  // we will update scene.position to the neighborhood center points as they're clicked
  camera.lookAt( scene.position );
}

function render() {
  renderer.render( scene, camera );
  //camera.position.y -= .2;
  //camera.position.z -= .5;
}

// Set up the three.js scene. This is the most basic setup without
// any special stuff
function initScene() {

  scene = new THREE.Scene();

  // set the scene size
  var WIDTH = window.innerWidth, HEIGHT = window.innerHeight;

  // set some camera attributes
  var VIEW_ANGLE = 45, NEAR = 1, FAR = 10000;

  // create a WebGL renderer, camera, and a scene
  renderer = new THREE.WebGLRenderer({antialias:true});

  camera = new THREE.PerspectiveCamera( VIEW_ANGLE, WIDTH / HEIGHT, NEAR, FAR );
  camera.position.y = 250;
  camera.position.z = 500;
  
  // add and position the camera at a fixed position
  scene.add(camera);
  camera.lookAt( scene.position );
  
  // start the renderer, and black background
  renderer.setSize(WIDTH, HEIGHT);
  renderer.setClearColorHex( 0xFFFFFF, 1 );
  
  // add the render target to the page
  $("#main_container").append(renderer.domElement);

  

  // lighting
  var spotLightAbove = new THREE.SpotLight(0xFFFFFF);
  spotLightAbove.position.set( 0, 1000, 0 );
  scene.add(spotLightAbove);

  var spotLightLeft = new THREE.SpotLight(0xFFFFFF, .35);
  spotLightLeft.position.set( -500, 0, 0 );
  scene.add(spotLightLeft);

  var spotLightRight = new THREE.SpotLight(0xFFFFFF, .35);
  spotLightRight.position.set( 500, 0, 0 );
  scene.add(spotLightRight);

  var spotLightTop = new THREE.SpotLight(0xFFFFFF, .35);
  spotLightTop.position.set( 0, 0, -500 );
  scene.add(spotLightTop);

  var spotLightBottom = new THREE.SpotLight(0xFFFFFF, .35);
  spotLightBottom.position.set( 0, 0, 500 );
  scene.add(spotLightBottom);
  
  // add a base plane on which we'll render our map
  var planeGeo = new THREE.PlaneGeometry(10000, 10000, 10, 10);
  var planeMat = new THREE.MeshLambertMaterial({color: 0xFFFFFF});
  var plane = new THREE.Mesh(planeGeo, planeMat);

  // rotate it to correct position
  plane.rotation.x = -Math.PI/2;
  //scene.add(plane);
}


// add the loaded gis object (in geojson format) to the map
function addGeoObject() {

  // convert to mesh and calculate values
  _.each(data.features, function (geoFeature) {
    var feature = geo.path(geoFeature);

    // we only need to convert it to a three.js path
    mesh = transformSVGPathExposed(feature);

    // the two different scales that we use, extrude determines
    // the height and color is obviously color. You can choose
    // from the max_min that we calculated above, ensure this
    // matches with below where you call these functions.

    var color_scale = d3.scale.quantile()
    //var color_scale = d3.scale.ordinal()
      .domain(gas_eff_min_max)

      // Use this for the reverse color direction
      // .range([ '#D7191C', '#FDAE61', '#FFFFBF', '#A6D96A', '#1A9641']);
      .range([ '#1A9641', '#A6D96A', '#FFFFBF', '#FDAE61', '#D7191C']);


    var extrude_scale = d3.scale.linear()
      .domain(elec_eff_min_max)
      .range([0, 100]);

    // create material color based on gas efficiency Ensure the
    // property matches with the scale above, we'll add automatic
    // matching functionality later
    var mathColor = color_scale(geoFeature.properties.gas_efficiency);
    console.log(mathColor);
    // Need to convert the color into a hexadecimal number
    var hexMathColor = parseInt(mathColor.replace("#", "0x"));

    // Change the color of the material!
    material = new THREE.MeshLambertMaterial({
      color: hexMathColor
    });

    // create extrude based on electricity efficiency
    var extrude = extrude_scale(geoFeature.properties.elect_efficiency);

    // Add the attributes to the mesh for the height of the polygon
    var shape3d = mesh.extrude({
      amount: Math.round(extrude),
      bevelEnabled: false
    });

    // create a mesh based on material and extruded shape
    var toAdd = new THREE.Mesh(shape3d, material);
    // rotate and position the elements nicely in the center
    toAdd.rotation.x = Math.PI / 2;
    //toAdd.rotation.z = Math.PI * .5;
    toAdd.translateY(extrude / 2);

    // add to scene
    scene.add(toAdd);

  });
}



////////////////// EVENT LISTENERS //

document.addEventListener( 'mousemove', onDocumentMouseMove, false );
window.addEventListener( 'resize', onWindowResize, false );
document.onkeypress = returnKey;

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );

}


function onDocumentMouseMove( event ) {

  event.preventDefault();
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}

function returnKey(evt)
{
  var evt  = (evt) ? evt : ((event) ? event : null);
 
  // keyCode 32 = spacebar
  if ((evt.keyCode == 32)) 
  {
    var newX = Math.random() * 500 - 250;
    var newY = Math.random() * 200 + 50;
    var newZ = Math.random() * 1000 - 500;
    TweenLite.to(camera.position, 1, {x:newX, y:newY, z:newZ, ease:Quad.easeInOut});
  }
}