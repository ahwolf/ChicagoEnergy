var loadBar = document.getElementById("loadBarInner");
document.getElementById('loadBar').style.opacity = 1;

var queue = new createjs.LoadQueue(false);
queue.addEventListener("complete", handleComplete);
queue.addEventListener("progress", handleProgress);
queue.loadManifest([
   //{src:"./js/app_preload.js"} // got rid of id: "my_js",

   // img
   {src:"{{STATIC_URL}}main/img/branding.png"},
   {src:"{{STATIC_URL}}main/img/checkIcon.png"},
   {src:"{{STATIC_URL}}main/img/chiStar.png"},
   {src:"{{STATIC_URL}}main/img/facebook.png"},
   {src:"{{STATIC_URL}}main/img/floor.jpg"},
   {src:"{{STATIC_URL}}main/img/fourGreyStars.png"},
   {src:"{{STATIC_URL}}main/img/google.png"},
   {src:"{{STATIC_URL}}main/img/key.png"},
   {src:"{{STATIC_URL}}main/img/locationPin.png"},
   {src:"{{STATIC_URL}}main/img/searchButton.png"},
   {src:"{{STATIC_URL}}main/img/searchIcon.png"},
   {src:"{{STATIC_URL}}main/img/selectArrow.png"},
   {src:"{{STATIC_URL}}main/img/starsTipsHeader.png"},
   {src:"{{STATIC_URL}}main/img/tooltipCarrot.png"},
   {src:"{{STATIC_URL}}main/img/twitter.png"},
   // js
   {src:"http://cdnjs.cloudflare.com/ajax/libs/gsap/latest/plugins/CSSPlugin.min.js"},
   {src:"{{STATIC_URL}}common/js/lib/easing/EasePack.min.js"},
   {src:"{{STATIC_URL}}common/js/lib/TweenLite.min.js"},
   {src:"{{STATIC_URL}}common/js/lib/threejs/Stats.js"},
   {src:"{{STATIC_URL}}common/js/lib/threejs/three.min.js"},
   {src:"{{STATIC_URL}}common/js/lib/d3/d3.v2.js"},
   {src:"{{STATIC_URL}}common/js/lib/threejs/d3-threeD.js"},
   {src:"{{STATIC_URL}}main/colorbrewerChi.js"},
   {src:"{{STATIC_URL}}common/js/lib/jquery.min.js"},
   {src:"{{STATIC_URL}}common/js/lib/underscore-1.3.3-min.js"},
   {src:"{{STATIC_URL}}main/js/jquery.better-autocomplete.js"},
   {src:"{{STATIC_URL}}main/js/neighborhood_new.js"},
]);

function handleProgress(event) {
  //use event.loaded to get the percentage of the loading
  loadBar.style.width = Math.ceil(event.progress * 300) + "px";
  console.log("loading");
}

var appQueue;

function handleComplete() {
  // load app js stuff only when other assets are loaded
  appQueue = new createjs.LoadQueue(false);
  appQueue.addEventListener("complete", handleAppQueueComplete);
  console.log("completed");
  appQueue.loadManifest([
     {src:"{{STATIC_URL}}main/js/google_api.js"},
     {src:"{{STATIC_URL}}main/js/app.js"},
  ]);
}

function handleAppQueueComplete() {
  console.log('app js loaded');
}

// i guess this isn't necessary anymore
// var myjs = queue.getResult("my_js");
// var head= document.getElementsByTagName('head')[0];
// var script= document.createElement('script');
// script.type= 'text/javascript';
// script.src= myjs;
// head.appendChild(script);