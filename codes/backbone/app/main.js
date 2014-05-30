////////////////////////////////////////////////////////////////////////////////
// Stuff I had to add

Backbone.View.prototype.render = function() {
  var template = document.querySelector('[template-name="'+this.templateName+'"]').innerHTML;
  var html = _.template(template, this.serialize());
  this.$el.html(html);
  if (this.afterRender) this.afterRender();
};

Backbone.View.prototype.serialize = function() {
  return this;
};

Backbone.Collection.prototype.parse = extractRoot;

Backbone.Model.prototype.parse = extractRoot;

Backbone.Collection.prototype.findModel = function(id) {
  var model = this.get(id);
  if (!model) {
    model = this.add({id: id});
    model.fetch();
  }
  return model;
};

function extractRoot(res) {
  return res[this.rootKey] ? res[this.rootKey] : res;
}

$('body').on('click', 'a:not([external])', function(event) {
  if (event.metaKey || event.ctrlKey || event.shiftKey)
    return;
  event.preventDefault();
  Backbone.history.navigate(event.target.hash, {trigger: true});
});

////////////////////////////////////////////////////////////////////////////////
// The app

var api = 'http://localhost:5000';
//var api = 'http://addressbook-api.herokuapp.com';

var Contact = Backbone.Model.extend({
  urlRoot: api+'/contacts',

  defaults: {
    first: 'Jane',
    last: 'Doe'
  },

  rootKey: 'contact',

  fullName: function() {
    return this.get('first') + ' ' + this.get('last');
  },

  toJSON: function() {
    return {contact: this.attributes};
  }
});

var ContactCollection = Backbone.Collection.extend({
  model: Contact,

  rootKey: 'contacts',

  url: api+'/contacts',

  comparator: function(a, b) {
    return a.fullName() > b.fullName();
  }
});

var AppView = Backbone.View.extend({
  templateName: 'app',

  initialize: function(options) {
    this.childView = options.childView;
    this.collection.on('reset', this.render, this);
    this.collection.on('add', this.render, this);
    this.collection.on('remove', this.render, this);
  },

  renderChildViews: function(child) {
    this.childView = child || this.childView;
    this.childView.setElement(this.$('.childView'));
    this.childView.render();
    this.renderListItems();
  },

  afterRender: function() {
    this.renderChildViews();
  },

  renderListItems: function() {
    var list = this.$('.items');
    list.empty();
    this.collection.each(function(contact) {
      var view = new ContactListItemView({model: contact});
      view.render();
      view.$el.appendTo(list);
    });
  }

});

var ContactListItemView = Backbone.View.extend({
  templateName: 'contact-list-item',

  initialize: function() {
    this.model.on('change', this.render, this);
    this.className = '';
    var match = location.hash.match(/contact\/(.+)/);
    if (match && match[1] == this.model.get('id')) {
      this.className = 'active';
    }
  }
});

var ContactView = Backbone.View.extend({
  templateName: 'contact',
});

var EditView = Backbone.View.extend({
  templateName: 'edit',

  events: {
    'input [name=avatar]': 'renderAvatar',
    'submit form': 'save'
  },

  save: function(event) {
    event.preventDefault();
    var props = this.$('form').serializeArray().reduce(function(props, pair) {
      props[pair.name] = pair.value;
      return props;
    }, {});
    this.model.save(props);
    Backbone.history.navigate('/contact/'+this.model.get('id'), {trigger: true});
  },

  renderAvatar: function(event) {
    this.$('img').attr('src', event.target.value);
  }
});

var Router = Backbone.Router.extend({
  routes: {
    '': 'app',
    'contact/:id': 'contact',
    'edit/:id': 'edit'
  },

  initialize: function() {
    this.contacts = new ContactCollection();
  },

  app: function(options) {
    options = options || {};
    this.appView = new AppView({
      el: '#app',
      collection: this.contacts,
      childView: options.childView || new IndexView()
    });
    this.appView.render();
    this.contacts.fetch();
  },

  contact: function(id) {
    var model = this.contacts.findModel(id);
    this.renderDetail(new ContactView({model: model}));
  },

  edit: function(id) {
    var model = this.contacts.findModel(id);
    this.renderDetail(new EditView({model: model}));
  },

  renderDetail: function(view) {
    if (!this.appView) {
      this.app({childView: view});
    } else {
      this.appView.renderChildViews(view);
    }
  }
});

var IndexView = Backbone.View.extend({
  templateName: 'index'
});

new Router();
Backbone.history.start();

