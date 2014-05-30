/** @jsx React.DOM */

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

////////////////////////////////////////////////////////////////////////////////
// App

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

var App = React.createClass({

  getInitialState: function() {
    return { contacts: [] };
  },

  componentWillMount: function() {
    this.getContacts();
    contactStore.onChange = this.getContacts;
  },

  getContacts: function() {
    contactStore.findAll(function(err, contacts) {
      this.setState({contacts: contacts});
    }.bind(this));
  },

  child: function() {
    switch (this.props.route) {
      case 'contact':
        return <Contact id={this.props.contactId} key={this.props.contactId}/>; break;
      case 'edit':
        return <Edit id={this.props.contactId} key={this.props.contactId}/>; break;
      default:
        return <Index/>;
    }
  },

  links: function() {
    return this.state.contacts.map(function(contact) {
      var href = '#/contact/'+contact.id;
      var className = this.props.contactId === contact.id ? 'active' : '';
      return <li><a className={className} href={href}>{contact.first} {contact.last}</a></li>;
    }.bind(this));
  },

  render: function() {
    return (
      <div className="App">
        <ul className="Master">
          {this.links()}
        </ul>
        <div className="Detail">
          {this.child()}
        </div>
      </div>
    );
  }
});

var Index = React.createClass({
  render: function() {
    return <p>Welcome to your address book!</p>;
  }
});

var ContactMixin = {
  getInitialState: function() {
    return {loaded: false};
  },

  componentWillMount: function() {
    contactStore.find(this.props.id, this.handleStoreFind);
  },

  handleStoreFind: function(err, contact) {
    contact.loaded = true;
    this.setState(contact);
  }
}

var Contact = React.createClass({
  mixins: [ContactMixin],
  render: function() {
    var editPath = "#/edit/" + this.state.id;
    return (
      <div className="Contact">
        <h1>{fullName(this.state)}</h1>
        <img src={this.state.avatar}/>
        <br/>
        <a href={editPath}>Edit</a>
      </div>
    );
  }
});

var Edit = React.createClass({
  mixins: [ContactMixin],

  save: function(event) {
    event.preventDefault();
    contactStore.update(this.state.id, {
      first: this.refs.first.getDOMNode().value,
      last: this.refs.last.getDOMNode().value,
      avatar: this.refs.avatar.getDOMNode().value
    });
    window.location.hash = '/contact/'+this.state.id;
  },

  updateAvatar: function() {
    this.setState({avatar: this.refs.avatar.getDOMNode().value});
  },

  render: function() {
    if (!this.state.loaded) return <div>Loading...</div>;
    return (
      <form className="Edit" onSubmit={this.save}>
        <label>First name: <input ref="first" defaultValue={this.state.first}/></label><br/>
        <label>Last name: <input ref="last" defaultValue={this.state.last}/></label><br/>
        <label>Avatar URL: <input ref="avatar" value={this.state.avatar} onChange={this.updateAvatar}/></label><br/>
        <img src={this.state.avatar}/><br/>
        <button type="submit">Save</button>
        <a href={"#/contact/"+this.state.id}>Cancel</a>
      </form>
    );
  }
});

function fullName(contact) {
  return contact.first + ' ' + contact.last;
}

router.match(/\/contact\/(.+)\/?/, function(path, id) {
  React.renderComponent(App({
    route: 'contact',
    contactId: id
  }), document.body);
}.bind(this));

router.match(/\/edit\/(.+)\/?/, function(path, id) {
  React.renderComponent(App({
    contactId: id,
    route: 'edit'
  }), document.body);
}.bind(this));

router.match('\/?', function() {
  React.renderComponent(App({
    route: 'index'
  }), document.body);
});

router.start()

