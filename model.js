/*
  model.js

  This file is required. It must export a class with at least one public function called `getData`

  Documentation: http://koopjs.github.io/docs/usage/provider
*/
const request = require('request').defaults({gzip: true, json: true})
const config = require('config')

function Model (koop) {}

// Public function to return data from the
// Return: GeoJSON FeatureCollection
//
// Config parameters (config/default.json)
// req.
//
// URL path parameters:
// req.params.host (if index.js:hosts true)
// req.params.id  (if index.js:disableIdParam false)
// req.params.layer
// req.params.method
Model.prototype.getData = function (req, callback) {
  // const key = config.gdfs.key
  const system = req.params.host;
  const systemInfo = config.gdfs.systems[system];

  // Call the remote API with our developer key
  request(systemInfo['Auto-Discovery URL'], (err, res, body) => {
    if (err) return callback(err)

    let feeds = '';
    if(body.data.hasOwnProperty('en')) {
      feeds = body.data.en.feeds;
    } else {
      feeds = body.data.feeds;
    }
    
    const freeBikesInfo = feeds.find((feedInfo) => {
      return feedInfo.name === 'free_bike_status';
    });

    request(freeBikesInfo.url, (err, bikesRes, bikesBody) => {
      
      // translate the response into geojson
      const geojson = translate(bikesBody.data);
  
      // Optional: cache data for 10 seconds at a time by setting the ttl or "Time to Live"
      geojson.ttl = 60
  
      // Optional: Service metadata and geometry type
      geojson.metadata = {
        title: 'free_bike_status',
        description: `Generated from ${freeBikesInfo.url}`,
        geometryType: 'Point' // Default is automatic detection in Koop
      }
  
      // hand off the data to Koop
      callback(null, geojson)
    });

  })
}

function translate (input) {
  return {
    type: 'FeatureCollection',
    features: input.bikes.map(formatFeature)
  }
}

function formatFeature (inputFeature) {
  // Most of what we need to do here is extract the longitude and latitude
  const feature = {
    type: 'Feature',
    properties: inputFeature,
    geometry: {
      type: 'Point',
      coordinates: [inputFeature.lon, inputFeature.lat]
    }
  }
  // But we also want to translate a few of the date fields so they are easier to use downstream
  // const dateFields = ['expires', 'serviceDate', 'time']
  // dateFields.forEach(field => {
  //   feature.properties[field] = new Date(feature.properties[field]).toISOString()
  // })
  return feature
}

module.exports = Model;