// Map stuff
import GoogleMapsLoader from 'google-maps';
import mapstyles from './data/mapstyles.json'
import tenements from './data/expired.json'
import L from './components/leaflet.js' // Check it out... https://blog.webkid.io/rarely-used-leaflet-features/
import './components/Leaflet.GoogleMutant.js'
import * as topojson from "topojson"
import { $, $$, round, numberWithCommas, wait, getDimensions } from './modules/util'
import tooltip from './templates/tooltip.html'
import key from './templates/key.html'
import { Toolbelt } from './modules/toolbelt'

class MasterClass {

    constructor() {

    	var self = this;

    	this.toolbelt = new Toolbelt()

    	this.x = 0

    	this.y = 0

    	this.latitude = -31.395399

    	this.longitude = 150.253718

    	this.colours = ["#FFD700",  "#c69c6d"];

    	this.tenements = ["Petroleum explortion license", "Petroleum accessment lease"];

    	this.categories = []

    	var mapwidth = getDimensions($('#map'))

    	this.zoom = ( mapwidth[0] > 1100 ) ? 7 : ( mapwidth[0]  > 500 ) ? 7 : 7 ;

	    this.map = new L.Map('map', { 
	      renderer: L.canvas(),
	      center: new L.LatLng(self.latitude, self.longitude), 
	      zoom: self.zoom,
	      scrollWheelZoom: false,
	      dragging: true,
	      zoomControl: true,
	      doubleClickZoom: false,
	      zoomAnimation: true
	    })

    	this.topo()

    }

    topo() {

    	this.topo = topojson.feature(tenements, tenements.objects.expired)

    	//console.log(this.topo)

    	/*
		AREA : "5242.0"
		AREA_GEO : 5242.04199759
		COMP : "AUSTRALIAN COALBED METHANE PTY LIMITED"
		D_APP : null
		D_EXP : "2015/02/10"
		D_GRA : "1993/02/11"
		LEASE_TYPE : "Exploration Tenement"
		STATE : "NSW"
		Shape_Area : 5242041318.47
		Shape_Leng : 584637.2971
		T_NAME : "PEL1"
    	*/

    	this.initMap()

    }

	initMap() {

		var self = this

		function getColour(type) {

			console.log(type)

			self.categories.indexOf(type) === -1 ? self.categories.push(type) : '';

			return (type==="PEL") ? "#FFD700" : "#c69c6d" ;

		}

		/*
	"properties": {
					"TITLE_CODE": "PEL",
					"TITLE_NO": "427",
					"ACT_YEAR": 1991,
					"COMPANY": "COMET RIDGE LTD",
					"GRANT_DATE": "1998/05/21",
					"EXPIRY_DAT": "2016/05/20",
					"LAST_RENEW": "01 Mar 2016",
					"GROUPS": "PETROLEUM,",
					"TITLE_AREA": "77 BLOCKS",
					"MINERALS": "Petroleum",
					"RESOURCE": "PETROLEUM",
					"OPERATION": "EXPLORING",
					"TAS_ID": 19884
				}
		*/


		function style(feature) {

		    return {

		        weight: 1,

		        opacity: 1,

		        color: 'white',

		        fillOpacity: 0.7,

		        fillColor: getColour(feature.properties.TITLE_CODE)

		    };
		}

		function onEachFeature(feature, layer) {

		    layer.on({
		        mouseover: setMousePosition
		    });
		}

		function setMousePosition(e) {

			self.y = self.map.latLngToLayerPoint(e.latlng).y

		}

		var styled = L.gridLayer.googleMutant({

		    type: 'roadmap',

		    styles: mapstyles

		}).addTo(self.map);

        this.geojson = L.geoJson(self.topo, {

            style: style,

            onEachFeature: onEachFeature

        }).bindTooltip(function(data) {

        	var datum = data.feature.properties

        	datum.label = (datum.TITLE_CODE === "PEL") ? "Petroleum explortion license": "Petroleum accessment lease" ;

        	datum.COMPANY = (datum.COMPANY!=null) ? datum.COMPANY.replace(/,/g, '<br>') : (datum.RESOURCE==='Exploration Release Area') ? 'An area that comapnies can make <br/>bids on exploration permits for' : 'Not specified' ;

			(datum.COMPANY!=null) ? datum.COMPANY = datum.COMPANY.replace(/;/g, '<br>') : '' ;

			var html = L.Util.template(tooltip, datum)

        	return html

        }, {

  			sticky: true

		}).addTo(self.map);

		self.map.on('tooltipopen', function(e) {

			var mapwidth = getDimensions($('#map'))

			var percentage = 100 / mapwidth[1] * self.y

			e.tooltip.options.direction = (percentage > 50 ) ? 'top' : 'bottom' ;
			
		});

		var isAndroidApp = (window.location.origin === "file://" && /(android)/i.test(navigator.userAgent) ) ? true : false ;

        var el = document.getElementById('map');

        el.ontouchstart = function(e){

	        if (isAndroidApp && window.top.GuardianJSInterface.registerRelatedCardsTouch) {

	          window.top.GuardianJSInterface.registerRelatedCardsTouch(true);

	        }
        };

        el.ontouchend = function(e){

	        if (isAndroidApp && window.top.GuardianJSInterface.registerRelatedCardsTouch) {

	          window.top.GuardianJSInterface.registerRelatedCardsTouch(false);

	        }

        };

        this.createKey()

	}

	createKey() {

		var self = this

		var html = ''

		for (var i = 0; i < self.tenements.length; i++) {

			var datum = { type: self.tenements[i], color: self.colours[i] }

			html += self.toolbelt.mustache(key, datum)

		}

		$('#key').innerHTML = html;

	}

}


GoogleMapsLoader.KEY = 'AIzaSyD8Op4vGvy_plVVJGjuC5r0ZbqmmoTOmKk';
GoogleMapsLoader.REGION = 'AU';
GoogleMapsLoader.load(function(google) {
  var mc = new MasterClass();
});


