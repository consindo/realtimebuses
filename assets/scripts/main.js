
function indexBtns () {
    $("#displayNetwork").on("click", function(e) {
        window.location.href = "display-network.html";
    });
    $("#displayRoute").on("click", function(e) {
        window.location.href = "display-route.html";
    });
};


function networkMap () {
    var map = new L.Map("map", {
        center: [-36.8485, 174.7633],
        zoom: 10,
        zoomControl: false
    });
    L.tileLayer('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);


    var pts;

    function loadData () {
      protobuf.load("assets/protobuf/gtfs-realtime.proto", function(err, root) {
          if (err)
              throw err;
          var f = root.lookupType("transit_realtime.FeedMessage");

          var xhr = new XMLHttpRequest();
          xhr.open("GET", "data/vehicle_locations.pb", true);
          xhr.responseType = "arraybuffer";
          xhr.onload = function(evt) {
              var m = f.decode (new Uint8Array(xhr.response));
              addPositions(m.entity);
          }
          xhr.send(null);
      });
    };
    function addPositions (feed) {
      console.log(feed);
      var data = {
          "type": "FeatureCollection",
          "features": []
      };
      for (var i=0; i<feed.length; i++) {
        if (feed[i].vehicle) {
          if (feed[i].vehicle.position) {
            data.features.push({
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [
                  feed[i].vehicle.position.longitude,
                  feed[i].vehicle.position.latitude
                ]
              },
              "properties": {
                "delay": 0,
                "delaytype": "arrival"
              }
            });
          }
        }
        console.log(feed[i]);
      }
      console.log(data);
      if (pts != undefined) pts.clearLayers();
      pts = L.geoJSON(data, {
          pointToLayer: function(feature, latlng) {
              return L.circleMarker(latlng, {
                  radius: 2,
                  fillColor: "#990000",
                  weight: 0,
                  fillOpacity: 0.8
              });
          }
      }).addTo(map);
    };

    loadData();
    // setTimeout(function () {
    //     pts.clearLayers();
    //
    // }, 1000);
};

function networkStatus () {
    protobuf.load("assets/protobuf/gtfs-realtime.proto", function(err, root) {
        if (err)
            throw err;
        var f = root.lookupType("transit_realtime.FeedMessage");

        var xhr = new XMLHttpRequest();
        xhr.open("GET", "data/trip_updates.pb", true);
        xhr.responseType = "arraybuffer";
        xhr.onload = function(evt) {
            var m = f.decode (new Uint8Array(xhr.response));
            setStatus(m.entity);
        }
        xhr.send(null);
    });
};

function setStatus (data) {
    var ontime = 0, n = 0;
    var tab = [0, 0, 0, 0, 0, 0, 0]; // [<-5, -5--1, -1-5, 5-10, 10-20, 20-30, 30+]
    for (i=0; i<data.length; i++) {
        if (data[i].tripUpdate) {
            var stu = data[i].tripUpdate.stopTimeUpdate[0];
            var del;
            if (stu.arrival) {
                del = stu.arrival.delay;
            } else if (stu.departure) {
                del = stu.departure.delay;
            }
            n++;
            if (del > -60 && del < 60*5) ontime++;

            if (del < -5*60) tab[0]++
            else if (del < -60) tab[1]++;
            else if (del < 60*5) tab[2]++;
            else if (del < 60*10) tab[3]++;
            else if (del < 60*20) tab[4]++;
            else if (del < 60*30) tab[5]++;
            else tab[6]++;
        }
    }
    $("#nwPerc").html(Math.round(ontime/n*100));
    for (i=0;i<tab.length; i++) {
        $("#deltab" + i).html(tab[i]);
    }
};


function projectPoint(x, y) {
    var point = map.latLngToLayerPoint(new L.LatLng(y, x));
    this.stream.point(point.x, point.y);
};
