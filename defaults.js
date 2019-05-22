var path = require('path')
var home = require('os-homedir')
var merge = require('deep-extend')
var nonPrivate = require('non-private-ip')
var ssbCaps = require('ssb-caps')
var ssbKeys = require('ssb-keys')
var get = require('lodash.get')

var fixConnections = require('./util/fix-connections')
var defaultPorts = require('./default-ports')

var SEC = 1e3
var MIN = 60 * SEC

module.exports = function setDefaults (name, config) {
  var baseDefaults = {
    // just use an ipv4 address by default.
    // there have been some reports of seemingly non-private
    // ipv6 addresses being returned and not working.
    // https://github.com/ssbc/scuttlebot/pull/102
    path: path.join(home() || 'browser', '.' + name),
    party: true,
    timeout: 0,
    pub: true,
    local: true,
    friends: {
      dunbar: 150,
      hops: 3
    },
    gossip: {
      connections: 3
    },
    connections: {
      outgoing: {
        net: [{ transform: 'shs' }],
        onion: [{ transform: 'shs' }]
      }
    },
    timers: {
      connection: 0,
      reconnect: 5 * SEC,
      ping: 5 * MIN,
      handshake: 5 * SEC
    },
    // change these to make a test network that will not connect to the main network.
    caps: ssbCaps,
    master: [],
    logging: { level: 'notice' }
  }
  config = merge(baseDefaults, config || {})

  if (!config.connections.incoming) {
    config.connections.incoming = {
      net: [{
        host: config.host || nonPrivate.v4 || '::',
        port: config.port || defaultPorts.net,
        scope: ['device', 'local', 'public'],
        transform: 'shs'
      }],
      ws: [{
        host: config.host || nonPrivate.v4 || '::',
        port: get(config, 'ws.port', defaultPorts.ws),
        scope: ['device', 'local', 'public'],
        transform: 'shs'
      }]
    }
  }
  config = fixConnections(config)

  if (config.keys == null) {
    config.keys = ssbKeys.loadOrCreateSync(path.join(config.path, 'secret'))
  }

  return config
}
