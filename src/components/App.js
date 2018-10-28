import React, { Component } from "react";
import LocationList from "./LocationList";

class App extends Component {
  /**
   * Constructor
   */
  constructor(props) {
    super(props);
    this.state = {
      alllocations: require("./place.json"), // Get the locations from the JSON file
      map: "",
      infowindow: "",
      prevmarker: ""
    };

    // retain object instance when used in the function
    this.initMap = this.initMap.bind(this);
    this.openInfoWindow = this.openInfoWindow.bind(this);
    this.closeInfoWindow = this.closeInfoWindow.bind(this);
  }

  componentDidMount() {
    // Connect the initMap() function within this class to the global window context,
    // so Google Maps can invoke it
    window.initMap = this.initMap;
    // Asynchronously load the Google Maps script, passing in the callback reference
    loadMap(
      "https://maps.googleapis.com/maps/api/js?key=AIzaSyBtmQJwMUpChLfVpLhBmEDPGIZ-JdQv-lg&callback=initMap"
    );
  }

  /**
   * Initialise the map once the google map script is loaded
   */
  initMap() {
    var self = this;

    var mapview = document.getElementById("map");
    mapview.style.height = window.innerHeight + "px";
    var map = new window.google.maps.Map(mapview, {
      center: { lat: 32.39488314867296, lng: -93.81043195724487 },
      zoom: 15,
      mapTypeControl: false
    });

    var InfoWindow = new window.google.maps.InfoWindow({});

    window.google.maps.event.addListener(InfoWindow, "closeclick", function() {
      self.closeInfoWindow();
    });

    this.setState({
      map: map,
      infowindow: InfoWindow
    });

    window.google.maps.event.addDomListener(window, "resize", function() {
      var center = map.getCenter();
      window.google.maps.event.trigger(map, "resize");
      self.state.map.setCenter(center);
    });

    window.google.maps.event.addListener(map, "click", function() {
      self.closeInfoWindow();
    });

    var alllocations = [];
    this.state.alllocations.forEach(function(location) {
      var longname = location.name + " - " + location.type;
      var marker = new window.google.maps.Marker({
        position: new window.google.maps.LatLng(
          location.latitude,
          location.longitude
        ),
        animation: window.google.maps.Animation.DROP,
        map: map
      });

      marker.addListener("click", function() {
        self.openInfoWindow(marker);
      });

      location.longname = longname;
      location.marker = marker;
      location.display = true;
      alllocations.push(location);
    });
    this.setState({
      alllocations: alllocations
    });
  }

  /**
   * Open the infoWindow for the marker
   * @param {object} location marker
   */
  openInfoWindow(marker) {
    this.closeInfoWindow();
    this.state.infowindow.open(this.state.map, marker);
    marker.setAnimation(window.google.maps.Animation.BOUNCE);
    this.setState({
      prevmarker: marker
    });
    this.state.infowindow.setContent("Please wait loading data...");
    this.state.map.setCenter(marker.getPosition());
    this.state.map.panBy(0, -200);
    this.getMarkerInfo(marker);
  }

  /**
   * Retrive the location data from the foursquare api
   */
  getMarkerInfo(marker) {
    var self = this;

    // Add the api keys for foursquare
    var clientId = "NEYVVNKFDEZOH30OYKE210TVBU2KW3TPV2LQQYSWZ3KPOTXT";
    var clientSecret = "5CIMZHMEJJ0KAYEHRTGA4B3PA40UI3OKGUDSYJXOFKA1FGCO";

    // Build the api endpoint
    var url =
      "https://api.foursquare.com/v2/venues/search?client_id=" +
      clientId +
      "&client_secret=" +
      clientSecret +
      "&v=20130815&ll=" +
      marker.getPosition().lat() +
      "," +
      marker.getPosition().lng() +
      "&limit=1";
    fetch(url)
      .then(function(response) {
        if (response.status !== 200) {
          self.state.infowindow.setContent("Sorry data can't be loaded");
          return;
        }

        // Get the text in the response
        response.json().then(function(data) {
          console.log(data);

          var location_data = data.response.venues[0];
          var place = `<h3>${location_data.name}</h3>`;
          var street = `<p>${location_data.location.formattedAddress[0]}</p>`;
          var checkinsCount =
            "<b>Number of CheckIn's: </b>" +
            location_data.stats.checkinsCount +
            "<br>";
          var readMore =
            '<a href="https://foursquare.com/v/' +
            location_data.id +
            '" target="_blank">Read More on <b>Foursquare Website</b></a>';
          self.state.infowindow.setContent(
            place + street + checkinsCount + readMore
          );
        });
      })
      .catch(function(err) {
        self.state.infowindow.setContent("Sorry but the data can not be loaded");
      });
  }

  /**
   * Close the info window previously opened
   *
   * @memberof App
   */
  closeInfoWindow() {
    if (this.state.prevmarker) {
      this.state.prevmarker.setAnimation(null);
    }
    this.setState({
      prevmarker: ""
    });
    this.state.infowindow.close();
  }

  /**
   * Render for react
   */
  render() {
    return (
      <div>
        <LocationList
          key="100"
          alllocations={this.state.alllocations}
          openInfoWindow={this.openInfoWindow}
          closeInfoWindow={this.closeInfoWindow}
        />
        <div id="map" />
      </div>
    );
  }
}

export default App;

/**
 * Load the google maps
 * @param {src} url of the google maps script
 */
function loadMap(src) {
  var ref = window.document.getElementsByTagName("script")[0];
  var script = window.document.createElement("script");
  script.src = src;
  script.async = true;
  script.onerror = function() {
    document.write("Sorry but google maps can not be loaded");
  };
  ref.parentNode.insertBefore(script, ref);
}
