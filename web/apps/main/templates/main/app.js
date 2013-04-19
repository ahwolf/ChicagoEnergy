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
var vis = d3.select("#container")
    .append("svg")
    .attr("width", w)
    .attr("height", h);
*/

// change what you would like data to equal for different geo projections
//var data = ward;
var data = {{neighborhood_geojson}};
// var data = neighborhood;
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

// three.js setup & basic functions
var camera, scene, renderer, geometry, material, mesh;

var camYPos = 200;

var mouse = { x: 0, y: 0 }, INTERSECTED;

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

function animate() {
  stats.begin(); 
  requestAnimationFrame( animate );
  render();
  stats.end();
  //camera.lookAt( scene.position );
}

// Set up the three.js scene. This is the most basic setup without
// any special stuff
function initScene() {

  scene = new THREE.Scene();

  // set the scene size
  var WIDTH = window.innerWidth, HEIGHT = window.innerHeight;

  // set some camera attributes
  var VIEW_ANGLE = 45, NEAR = 1, FAR = 10000;

  projector = new THREE.Projector();

  // create a WebGL renderer, camera, and a scene
  renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.shadowMapEnabled = true;
  renderer.shadowMapSoft = true;

  camera = new THREE.PerspectiveCamera( VIEW_ANGLE, WIDTH / HEIGHT, NEAR, FAR );
  camera.position.x = Math.cos(currentAngle * Math.PI * 2) * radiusX;
  camera.position.y = camYPos;
  camera.position.z = Math.sin(currentAngle * Math.PI * 2) * radiusZ;
  
  // add and position the camera at a fixed position
  scene.add(camera);
  //camera.lookAt( scene.position );

  // calculate dynamic lookAt object position
  var la = new THREE.Object3D();
  la.x = Math.cos(currentAngle * Math.PI * 2) * radiusX * .6;
  la.y = 150;
  la.z = Math.sin(currentAngle * Math.PI * 2) * radiusZ * .6;
  camera.lookAt( la );


  
  // start the renderer, and white background
  renderer.setSize(WIDTH, HEIGHT);
  renderer.setClearColorHex( 0xFFFFFF, 1 );
  
  // add the render target to the page
  $("#container").append(renderer.domElement);

  var darkness = 0.75;

  // lighting
  var spotLightAbove = new THREE.SpotLight(0xFFFFFF);
  spotLightAbove.position.set( 0, 1000, 0 );
  spotLightAbove.castShadow = true;
  spotLightAbove.shadowDarkness = darkness;
  //spotLightAbove.shadowCameraVisible = true;
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
  var planeGeo = new THREE.PlaneGeometry(10000, 10000, 1, 1);
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
      //.range([ 'red', 'blue', 'purple']);
      .range(colorbrewer.RdYlGn[9]);

    var extrude_scale = d3.scale.linear()
      .domain(elec_eff_min_max)
      .range([10, 75]);

    // create material color based on gas efficiency Ensure the
    // property matches with the scale above, we'll add automatic
    // matching functionality later
    var mathColor = color_scale(geoFeature.properties.gas_efficiency);

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

    // zero all y positions of extruded objects
    toAdd.position.y = extrude;
    toAdd.properties = geoFeature.properties;

    toAdd.castShadow = true;
    toAdd.receiveShadow = false;

    // add to scene
    scene.add(toAdd);
  });
}

var flying = false;

var centerX = 150;
var centerY = 150;
var radiusX = 300;
var radiusZ = 550;
var currentAngle = Math.PI * 1.988;
var angleStep = 0;

//TweenLite.delayedCall(0, startFlying);

function startFlying() {
  flying = true;
}

function flyAround() {

  // ease into flying animation
  if (angleStep < .00015) angleStep += .000001;

  currentAngle += angleStep;
  camera.position.x = Math.cos(currentAngle * Math.PI * 2) * radiusX;
  camera.position.z = Math.sin(currentAngle * Math.PI * 2) * radiusZ;

  // calculate dynamic lookAt object position
  var la = new THREE.Object3D();
  la.x = Math.cos(currentAngle * Math.PI * 2) * radiusX * .6;
  la.y = 150;
  la.z = Math.sin(currentAngle * Math.PI * 2) * radiusZ * .6;
  camera.lookAt( la );

  if (currentAngle < -1 ) {
    currentAngle = 0;
    stage.removeEventListener(Event.ENTER_FRAME, advanceCircle);
    start_btn.addEventListener(MouseEvent.CLICK, startCircle);
  }
}

function render() {

  if (flying) flyAround();

  // begin rollover stuff
  var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
  projector.unprojectVector( vector, camera );

  var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

  var intersects = raycaster.intersectObjects( scene.children );

  if ( intersects.length > 0 ) {

    if ( INTERSECTED != intersects[ 0 ].object ) {

      if ( INTERSECTED ) {
        INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
      }

      INTERSECTED = intersects[ 0 ].object;
      INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
      INTERSECTED.material.emissive.setHex( 0x900800 );
      //console.log(INTERSECTED);

      $("#neighborhoodText").html(INTERSECTED.properties.name);
      console.log(INTERSECTED.properties.name);

      TweenLite.to(rolloverTip, .125, {autoAlpha:1})

    }

  } else {

    TweenLite.to(rolloverTip, .125, {autoAlpha:0})

    if ( INTERSECTED ) {
      INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
    }

    INTERSECTED = null;

  }
  // end rollover stuff

  renderer.render( scene, camera );
  //camera.position.y -= .2;
  //camera.position.z -= .5;
}

initScene();
addGeoObject();
animate();
//renderer.render( scene, camera );

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

  TweenLite.to($('#rolloverTip'), 0, { css: { left: event.pageX - 22, top: event.pageY - 59 }, ease:Back.easeOut});

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