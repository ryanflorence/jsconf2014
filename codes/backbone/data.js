var Contact = Backbone.Model.extend({
  defaults: {
    first: 'John',
    last: 'Doe'
  },

  fullName: function() {
    return this.get('first') + ' ' + this.get('last')
  }
});

var ContactCollection = Backbone.Collection.extend({
  model: Contact,
  url: api+'/contacts',
  comparator: function(a, b) {
    return a.get('last') > b.get('last');
  }
});

var contacts = new ContactCollection();

contacts.fetch();

