////////////////// BUTTON ACTIONS //

$("#aboutButton").click(function() {
  currentState = "overlay";
  $("#container").addClass("grayscaleAndLighten");
  TweenLite.to($('#branding'), .5, {autoAlpha: 0, delay: .25});
  TweenLite.to($('#search'), .5, {autoAlpha: 0, delay: .25});
  TweenLite.to($('#overlay'), .5, {autoAlpha: .75, delay: .375});
  TweenLite.to($('#about'), .5, {autoAlpha: 1, delay: .375});
  console.log("clicked about!");
  $.ajax("about/");


  
});

$("#creditsButton").click(function() {
  currentState = "overlay";
  $("#container").addClass("grayscaleAndLighten");
  TweenLite.to($('#branding'), .5, {autoAlpha: 0, delay: .25});
  TweenLite.to($('#search'), .5, {autoAlpha: 0, delay: .25});
  TweenLite.to($('#overlay'), .5, {autoAlpha: .75, delay: .375});
  TweenLite.to($('#credits'), .5, {autoAlpha: 1, delay: .375});
});

$(".closeButton").click(function() {
  currentState = "city";
  TweenLite.to($('#branding'), .5, {autoAlpha: 1, delay: .25});
  TweenLite.to($('#search'), .5, {autoAlpha: 1, delay: .25});
  TweenLite.to($('#overlay'), .5, {autoAlpha: 0});
  TweenLite.to($('#about'), .5, {autoAlpha: 0});
  TweenLite.to($('#credits'), .5, {autoAlpha: 0});
  TweenLite.delayedCall(.5, colorizeMap)
});

function colorizeMap() {
  $("#container").removeClass("grayscaleAndLighten");
}