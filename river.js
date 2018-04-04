
$('#map svg').on('click', function (e) {
    var x = e.clientX;
    var y = e.clientY;
//    console.log(x,y);
    var geohash = searchLatLon(x, y);
//    console.dir(geohash);
    var center = getCenterLatLon(geohash.rect);
//    console.dir(center);

    // おしたとこ
    var elev = getElevetaion(center.lat, center.lon, '中央', geohash.rect);

    // まわり
    var neighbours = Geohash.neighbours(geohash.geohash);
    //console.log(neighbours);
    setTimeout(function() {
        var n = searchGeohashToLatLon(neighbours.n);
        var center = getCenterLatLon(n.rect);
        var elev = getElevetaion(center.lat, center.lon, '北', n.rect);
    
        var s = searchGeohashToLatLon(neighbours.s);
        var center = getCenterLatLon(s.rect);
        var elev = getElevetaion(center.lat, center.lon, '南', s.rect);
    
        var e = searchGeohashToLatLon(neighbours.e);
        var center = getCenterLatLon(e.rect);
        var elev = getElevetaion(center.lat, center.lon, '東', e.rect);
    
        var w = searchGeohashToLatLon(neighbours.w);
        var center = getCenterLatLon(w.rect);
        var elev = getElevetaion(center.lat, center.lon, '西', w.rect);
        
    }, 200);



});

var center_elev = null;

function getElevetaion (lat, lon, vector, rect) {
    var url = 'http://cyberjapandata2.gsi.go.jp/general/dem/scripts/getelevation.php?lat='+lat+'&lon='+lon;
    var ret;
    $.ajax({
        url : url,
        dataType: "jsonp",
        success : function (data)  {
            if (vector == '中央') {
                center_elev = data.elevation;
                canvasLayer.drawRect(rect, "rgba(200, 0, 0, 0.3)");
                return;
            }
            if (center_elev == null) {
                return;
            }

            if (center_elev < data.elevation) {
                canvasLayer.drawRect(rect, "rgba(200, 0, 0, 0.3)");
            } else {
                canvasLayer.drawRect(rect, "rgba(0, 0, 200, 0.3)");
            }

        }
    });

}




function getCenterLatLon(rect) {
    return {
        lat : (rect.ne.Lat + rect.sw.Lat)/2,
        lon : (rect.ne.Lon + rect.sw.Lon)/2,
    };
}

function searchGeohashToLatLon(geohash) {
    return {
        geohash : geohash,
        rect : geohashmap.get(geohash),
    };
}


function searchLatLon (x, y) {
    var geohash = undefined;
    geohashmap.forEach(function (d, geohashkey) {
//        console.dir(d);
        if (d.nepx.x > x &&
            d.nepx.y < y &&
            d.swpx.x < x &&
            d.swpx.y > y
        ) {
//            console.dir(d);
//            console.dir(geohashkey);
            geohash = {
                geohash : geohashkey,
                rect : d,
            };
        }
    });
    return geohash;
}