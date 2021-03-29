/* =====================
Leaflet Configuration
===================== */

var map = L.map('map', {
  center: [36.9, -116.8],
  zoom: 6
});
var Stamen_TonerLite = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
  attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  subdomains: 'abcd',
  minZoom: 0,
  maxZoom: 20,
  ext: 'png'
}).addTo(map);

var data;
var range;
var dataList;
var featureGroup;
var featureGroupList = [];
var currentPage = 0;

var cleanData = (rawData) => {
  // Filter out stations without open date, and extract the year number.
  rawData.features = rawData.features.filter( (station) => { 
    if(!!station.properties.open_date) { return true } 
    return false
  }).map((station) => {
    station.properties.open_year = parseInt(station.properties.open_date.substr(0,4));    
    station.properties = (({access_days_time, ev_network,open_year,station_phone,street_address,zip}) => ({access_days_time, ev_network,open_year,station_phone,street_address,zip}))(station.properties)
    return station
  })
  return rawData;
}

var yearRange = (stations) => {
  let years = stations.map((x) => {return x.properties.open_year})
  let low = Math.min(...years);
  let high = Math.max(...years);
  return [low, high]; 
}

var seperateByYear = (stations, range) => {
  let low = range[0];
  let high = range[1];

  let res = [];
  while(low+5 < high){
    res.push(stations.filter((s) => {
      if (s.properties.open_year >= low && s.properties.open_year < low + 5) return true
      return false
    }))
    low += 5;
  }
  res.push(stations.filter((s) => {
    if (s.properties.open_year >= low) return true
    return false
  }))

  return res;
}

var tearDown = () => {
  featureGroupList.forEach((featureGroup) => {
    map.removeLayer(featureGroup);
  })
  featureGroupList = [];
}

var next = () => {
  tearDown();
  currentPage += 1;
  buildPage(currentPage);
}

var prev = () => {
  tearDown();
  currentPage -= 1;
  buildPage(currentPage);
}

var allMarker = {
  radius: 4,
  fillColor: "#00994C",
  color: "#FFFFFF"
}

var oldMarker = {
  radius: 4,
  fillColor: "#00994C",
  color: "#FFFFFF",
  weight: 1,
  opacity: 0.6,
  fillOpacity: 0.5
}

var newMarker = {
  radius: 4,
  fillColor: "#003333",
  color: "#FFFFFF",
  weight: 1,
  opacity: 0.8,
  fillOpacity: 0.6  
}

var addAllToMap = (list) => {
  list.forEach((dat) => {
    let idx = dataList.indexOf(dat);
    allMarker.opacity = Math.pow((idx + 1) / list.length, 3)
    allMarker.fillOpacity = 0.8 * allMarker.opacity
    featureGroupList.push(L.geoJson(dat, {
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, allMarker).bindPopup(feature.properties);
      }
    }).addTo(map));
  })
}

var addToMap = (list, current) => {
  list = list.slice(0, current)
  list.forEach((dat) => {
    let idx = dataList.indexOf(dat);

    featureGroupList.push(L.geoJson(dat, {
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, oldMarker).bindPopup(feature.properties);
      }
    }).addTo(map));    
  })  

  featureGroupList.push(L.geoJson(list[current-1], {
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng, newMarker).bindPopup(feature.properties);
    }
  }).addTo(map));
}

var sumUpList = (list, len) => {
  let total = 0;
  list.slice(0,len).forEach((x) => {total += x.length})
  return total
}

var buildPage = (pageIndex) => {
  if (pageIndex === 0) {
    $("#slide").hide();
    $("#intro").show();
    addAllToMap(dataList, dataList.length); 
  } else {
    $("#intro").hide();
    $("#slide").show();    
    $("#start").text(range[0] + (pageIndex - 1) * 5);
    if (pageIndex < dataList.length) {
      $("#end").text(parseInt($("#start").text()) + 5);
    } else {
      $("#end").text(range[1]);
    }
    $("#num-of-new").text(dataList[pageIndex-1].length)
    $("#total-number").text(sumUpList(dataList, pageIndex))
      
    addToMap(dataList, pageIndex)
  }


  if (pageIndex === 0) {
    $('#prev').prop("disabled", true)
  } else {
    $('#prev').prop("disabled", false)
  }

  if (pageIndex === dataList.length) {
    $('#next').prop("disabled", true)
  } else {
    $('#next').prop("disabled", false)
  }
}




$.ajax('https://developer.nrel.gov/api/alt-fuel-stations/v1.geojson?fuel_type=E85,ELEC&state=CA&access=public&api_key=jZgPV9XwuvMoWKXl7TMGe0yxFzWr1hSvRNrPxWpP').done(function(json) {
  data = cleanData(json).features;
  range = yearRange(data); 
  dataList = seperateByYear(data, range);
  console.log(dataList);
  buildPage(0);
})

$('#next').click(next);
$('#prev').click(prev);


