[out:json][timeout:180];
area["name"="Delhi"]["admin_level"="4"]->.d;
(
  nwr["man_made"="wastewater_plant"](area.d);
  nwr["man_made"="water_works"](area.d);
  nwr["power"="substation"]["voltage"](area.d);
);
out tags center;
