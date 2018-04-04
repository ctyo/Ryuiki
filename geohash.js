/**
 * 初期化
 */
var ymap = new Y.Map("map", {
    "configure": {
        "dragging": true,
//        "singleClickPan": true,
        "doubleClickZoom": true,
        "continuousZoom": true,
        "scrollWheelZoom": true
    }
});

var geohashmap = new Map();

/**
 * いろいろかくよ
 * @class CanvasLayer
 * @extends {Y.Layer}
 */
class CanvasLayer extends Y.Layer {
    constructor(targetid, geohash_precision) {
        super();
        self.targetid_ = targetid;
        self.canvas_ = null;
        self.geohash_precision = parseInt(geohash_precision) || 7;
        self.geohashArray = new Array();

    }

    drawRect(rect, color) {
        var ctx = self.canvas_.getContext('2d');
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.fillRect(rect.swpx.x, rect.nepx.y, rect.nepx.x - rect.swpx.x, rect.swpx.y - rect.nepx.y);
    }

    drawLayer() {
        var that = this;

        if (self.canvas_) {
            self.canvas_.remove();
            self.geohashArray = new Array();
        }

        var elem = document.getElementById(self.targetid_)
        var canvas = document.createElement("canvas");
        canvas.style.position = "fixed";
        canvas.width = elem.offsetWidth;    // はめ込み先の幅
        canvas.height = elem.offsetHeight;  // はめ込み先の高さ
        canvas.style.top = 0;
        canvas.style.left = 0;
        self.canvas_ = canvas;

        var container = this.getMapContainer(); // canvas をはめ込む親要素を取得
        if (!container || !container[0]) {
            return;
        }
        container[0].appendChild(canvas);   // canvas をはめ込む

        var ymap = this.getMap();
        var center = ymap.getCenter()
        var geohash = Geohash.encode(center.Lat, center.Lon, self.geohash_precision);


        var strokeGeohash = function (geohash) {
            var bounds = Geohash.bounds(geohash);
            var ne = that.fromLatLngToContainerPixel(new Y.LatLng(bounds.ne.lat, bounds.ne.lon));
            var sw = that.fromLatLngToContainerPixel(new Y.LatLng(bounds.sw.lat, bounds.sw.lon));
            // canvas に描画する
            var ctx = self.canvas_.getContext('2d');
            ctx.strokeStyle = "red";
            ctx.strokeRect(sw.x, ne.y, ne.x - sw.x, sw.y - ne.y);
            geohashmap.set(geohash, {
                ne : new Y.LatLng(bounds.ne.lat, bounds.ne.lon),
                sw : new Y.LatLng(bounds.sw.lat, bounds.sw.lon),
                nepx : ne,
                swpx : sw,
            });
            //ctx.strokeText(geohash, sw.x + 5, ne.y + 15);
        }

        var limit = 900;
        var fillGeohash = function (geohash) {
            // 描画済みか確認
            if (self.geohashArray.includes(geohash)) {
                //console.dir(self.data);
                return;
            }
            // 一応リミット...
            if (self.geohashArray.length > limit) {
                return;
            }

            // 描画エリア内か確認
            var bounds = Geohash.bounds(geohash);
            var ymap = that.getMap();
            var map_bounds = ymap.getBounds();
            if (!(
                map_bounds.containsLatLng(new Y.LatLng(bounds.ne.lat, bounds.ne.lon)) || // 北東
                map_bounds.containsLatLng(new Y.LatLng(bounds.sw.lat, bounds.ne.lon)) || // 北西
                map_bounds.containsLatLng(new Y.LatLng(bounds.sw.lat, bounds.sw.lon)) || // 南西
                map_bounds.containsLatLng(new Y.LatLng(bounds.ne.lat, bounds.sw.lon))    // 南東
            )) {
                return;
            }

            // 描画してリストに追加
            self.geohashArray.push(geohash);
            strokeGeohash(geohash);

            var neighbours = Geohash.neighbours(geohash);
            for (var angle in neighbours) {
                fillGeohash(neighbours[angle]);
            }
        }
        fillGeohash(geohash);
    }
}

var url = new URL(window.location);
var canvasLayer = new CanvasLayer('map', url.searchParams.get('geohash_length'));
ymap.addLayer(canvasLayer);
var lat = url.searchParams.get('lat');
var lon = url.searchParams.get('lon');

ymap.drawMap(new Y.LatLng(lat, lon), url.searchParams.get('z') || 16, Y.LayerSetId.NORMAL);
