/*
  model-test.js

  This file is optional, but is strongly recommended. It tests the `getData` function to ensure its translating
  correctly.
*/

const test = require('tape')
const Model = require('../model')
const model = new Model()
const nock = require('nock')

test('should properly fetch from the API and translate features', t => {
  nock('https://san.jumpbikes.com')
  .get('/opendata/gbfs.json')
  .reply(200, require('./fixtures/gbfs.json'))

  nock('https://san.jumpbikes.com')
  .get('/opendata/free_bike_status.json')
  .reply(200, require('./fixtures/input.json'))

  model.getData({
    params: {
      host: 'jump_san_diego'
    }
  }, (err, geojson) => {
    t.error(err)
    t.equal(geojson.type, 'FeatureCollection', 'creates a feature collection object')
    t.ok(geojson.features, 'has features')
    const feature = geojson.features[0]
    t.equal(feature.type, 'Feature', 'has proper type')
    t.equal(feature.geometry.type, 'Point', 'creates point geometry')
    t.deepEqual(feature.geometry.coordinates, [-117.12053833333333, 32.67469166666667], 'translates geometry correctly')
    t.ok(feature.properties, 'creates attributes')
    // t.equal(feature.properties.expires, new Date(1484268019000).toISOString(), 'translates expires field correctly')
    // t.equal(feature.properties.expires, new Date(1484268019000).toISOString(), 'translates serviceDate field correctly')
    // t.equal(feature.properties.expires, new Date(1484268019000).toISOString(), 'translates time field correctly')
    t.end()
  })
})
