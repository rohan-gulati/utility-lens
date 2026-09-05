[out:json][timeout:60];
(
  nwr["power"](28.615,77.115,28.655,77.165);
  nwr["man_made"~"water_works|water_tower|storage_tank|reservoir_covered|wastewater_plant|pumping_station|pipeline"](28.615,77.115,28.655,77.165);
  nwr["amenity"="water_point"](28.615,77.115,28.655,77.165);
);
out tags center;
