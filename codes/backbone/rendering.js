var ContactsView = Backbone.View.extend({
  initialize: function() {
    this.collection.on('reset', this.render, this);
  },

  render: function() {
    // do something great here
    // maybe a little _.template
    // or some handlebars
  }
});

var contactsView = new ContactsView({
  collection: contacts
});

