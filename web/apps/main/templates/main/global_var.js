var auth ="{% url 'auth' %}";
var leaderboard = "{% url 'leaderboard' %}";
var pledge = "{% url 'pledge' %}";
var find_census_block = "{% url 'find_census_block' %}";
var census_blocks = "{% url 'census_blocks' %}";
var floor_url = "{{STATIC_URL}}main/img/floor.jpg";
var neighborhood_url = "{% url 'neighborhoods' %}";
var social_media = "{{social_media}}";
var facebook_app_id = "{{FACEBOOK_APP_ID}}";

console.log("global var: ", social_media)