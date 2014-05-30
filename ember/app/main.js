var App = Ember.Application.create();

App.ApplicationAdapter = DS.RESTAdapter.extend({
  host: 'http://addressbook-api.herokuapp.com'
});

App.Contact = DS.Model.extend({
  first: DS.attr(),
  last: DS.attr(),
  avatar: DS.attr(),
  fullName: function() {
    return this.get('first') + ' ' + this.get('last');
  }.property('first', 'last')
});

App.Router.map(function() {
  this.resource('contact', {path: 'contact/:id'});
  this.resource('edit', {path: 'edit/:id'});
});

App.ApplicationRoute = Ember.Route.extend({
  model: function() {
    return this.get('store').find('contact');
  }
});

App.ContactRoute = Ember.Route.extend({
  model: function(params) {
    return this.get('store').find('contact', params.id);
  }
});

App.EditRoute = Ember.Route.extend({
  model: function(params) {
    return this.get('store').find('contact', params.id);
  }
});

App.EditController = Ember.ObjectController.extend({
  actions: {
    save: function() {
      var model = this.get('model');
      model.setProperties(this.get('copy'));
      model.save();
      this.transitionToRoute('contact', model);
    }
  },

  copy: function() {
    // use a copy so the UI doesn't update all weird ...
    return Ember.copy(this.get('model').serialize());
  }.property('model')
});

