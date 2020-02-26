import 'ol/ol.css';
import React, { Component } from "react";
import OlMap from "ol/Map";
import OlView from "ol/View";
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';

import OlLayerTile from "ol/layer/Tile";
import { Vector as VectorLayer } from 'ol/layer';
import VectorSource from 'ol/source/Vector';

import OlSourceOSM from "ol/source/OSM";
import { fromLonLat } from 'ol/proj';

import './App.css'

const istanbulLonLat = [28.979530, 41.015137];




export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = { center: fromLonLat(istanbulLonLat), zoom: 13, selectedDistrict: null, selectedPark: null, parkData: null, loaded: false };

    this.olmap = new OlMap({
      target: null,
      layers: [
        new OlLayerTile({
          source: new OlSourceOSM()
        }),

      ],
      view: new OlView({
        center: this.state.center,
        zoom: this.state.zoom
      })
    });
  }

  updateMap() {
    this.olmap.getView().setCenter(this.state.center);
    this.olmap.getView().setZoom(this.state.zoom);
  }

  componentDidMount() {
    fetch('https://api.ibb.gov.tr/ispark/Park')
      .then(
        (response) => {
          if (response.status !== 200) {
            console.log('Looks like there was a problem. Status Code: ' +
              response.status);
            return;
          }
          response.json().then((data) => {
            let parsedData = {};
            for (let key in data) {
              let val = data[key];
              const district = val["Ilce"];

              if (!(district in parsedData)) {
                parsedData[district] = {};

              }
              parsedData[district][val['ParkID']] = val;
            }
            this.olmap.setTarget("map");
            var layer = new VectorLayer({
              source: new VectorSource({
                features: data.map((entry) => new Feature({
                  geometry: new Point(fromLonLat([parseFloat(entry.Longitude), parseFloat(entry.Latitude)]))
                }))
              })
            });
            this.olmap.addLayer(layer);
            // Listen to map changes
            this.olmap.on("moveend", () => {
              let center = this.olmap.getView().getCenter();
              let zoom = this.olmap.getView().getZoom();
              this.setState({ center, zoom, parkData: parsedData, loaded: true });
            });
            // this.setState((state, props) => {
            //   return { parkData: parsedData, loaded: true };
            // });
          });
        }
      )
    // .catch(function (err) {
    //   console.log('Fetch Error :-S', err);
    // });
  }

  // shouldComponentUpdate(nextProps, nextState) {
  //   let center = this.olmap.getView().getCenter();
  //   let zoom = this.olmap.getView().getZoom();
  //   if (center === nextState.center && zoom === nextState.zoom) return false;
  //   return true;
  // }

  renderDisticts() {
    return Object.keys(this.state.parkData).map((district) => (
      <option key={district}>{district}</option>
    ))
  }

  renderParkAreas() {
    const parkSpaces = this.state.parkData[this.state.selectedDistrict];
    return Object.keys(parkSpaces).map((parkID) => {
      let parkSpace = parkSpaces[parkID];
      return (
        <option value={parkID} key={parkID}>{parkSpace.ParkAdi}</option>
      );
    })
  }

  onDistrictSelect = (event) => {
    if (event.target.value !== `-1`) {
      this.setState({ selectedDistrict: event.target.value });

    }
  }

  onParkSpaceSelect = (event) => {
    if (event.target.value !== `-1`) {
      const parkSpace = this.state.parkData[this.state.selectedDistrict][event.target.value];
      this.setState({ selectedPark: parkSpace, center: fromLonLat([parseFloat(parkSpace.Longitude), parseFloat(parkSpace.Latitude)]), zoom: 17 });
    }

  }

  renderMap() {
    return (
      <div style={{ position: 'absolute', top: 20, right: 20, backgroundColor: '#ffffff', padding: 5 }}>
        <div>
          <p>District</p>
          <select onChange={this.onDistrictSelect}>
            <option value="-1">--</option>
            {this.state.loaded ? this.renderDisticts() : <option>--</option>}
          </select>
        </div>
        <div>
          <p>Park Space</p>
          <select onChange={this.onParkSpaceSelect}>
            <option value="-1">--</option>
            {this.state.selectedDistrict != null ? this.renderParkAreas() : <option>--</option>}
          </select>
        </div>
        {this.state.selectedPark != null ? <div>
          <p><span style={{fontWeight: 'bold'}}>Capacity: </span> <span>{this.state.selectedPark.BosKapasite}</span>/<span>{this.state.selectedPark.Kapasitesi}</span></p>
          <p><span style={{fontWeight: 'bold'}}>Park Tipi: </span><span>{this.state.selectedPark.ParkTipi}</span></p>
        </div> : <div></div>}

      </div>
    );
  }

  renderLoading() {
    return (
      <div>
        <h3>Loading...</h3>
      </div>
    );
  }
  render() {
    this.updateMap(); // Update map on render?
    return (
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute' }} id="map"></div>
        {
          this.state.loaded ? this.renderMap() : this.renderLoading()
        }
      </div>

    );
  }
}



