function req(method, url, data, cb) {
  var req = new XMLHttpRequest();
  req.onload = function() {
    if (req.status >= 300) {
      cb && cb(new Error(req.status));
    } else {
      cb && cb(null, JSON.parse(req.response));
    }
  };
  req.open(method, url);
  req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  req.send(JSON.stringify(data));
}

var router = {
  routes: [],

  start: function() {
    window.addEventListener('hashchange', this.handleRoute.bind(this));
    this.handleRoute();
  },

  match: function(matcher, handler) {
    this.routes.push({matcher: matcher, handler: handler});
  },

  handleRoute: function() {
    var path = window.location.hash.substr(1);
    console.log(path);
    for (var i = 0, l = this.routes.length; i < l; i ++) {
      var route = this.routes[i];
      var match = path.match(route.matcher);
      if (match) {
        route.handler.apply(null, match);
        return;
      }
    }
  }
};

var api = 'http://localhost:5000';

var contactStore = {
  cache: {
    loaded: false,
    records: [],
    map: {}
  },

  onChange: function() {},

  find: function(id, cb) {
    var cache = this.cache;
    if (cache.map[id]) {
      return cb(null, cache.map[id]);
    }
    req('GET', api+'/contacts/'+id, null, function(err, res) {
      console.log('find');
      if (err) return cb(err);
      var record = cache.map[res.contact.id] || res.contact;
      if (cache.map[record.id]) {
        for (var prop in res.contact) {
          record[prop] = res.contact[prop];
        }
      } else {
        cache.records.push(record);
        cache.map[record.id] = record;
      }
      cb(null, record);
      this.onChange();
    }.bind(this));
  },

  findAll: function(cb) {
    var cache = this.cache;
    if (cache.loaded) {
      return cb && cb(null, cache.records);
    }
    req('GET', api+'/contacts', null, function(err, res) {
      console.log('findAll');
      if (err) return cb(err);
      cache.loaded = true;
      cache.records = res.contacts;
      res.contacts.forEach(function(record) {
        if (cache.map[record.id]) {
          var cached = cache.map[record.id];
          for (var prop in record) {
            cached[prop] = record[prop];
          }
        } else {
          cache.map[record.id] = record;
        }
      });
      cb(null, res.contacts);
      this.onChange();
    }.bind(this));
  },

  update: function(id, props, cb) {
    var contact = this.cache.map[id];
    for (var prop in props) contact[prop] = props[prop];
    req('PUT', api+'/contacts/'+id, {contact: contact}, function() {
      this.onChange();
    }.bind(this));
  }
};


