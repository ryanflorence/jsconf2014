angular.module('address-book.main', ['ngRoute']);

angular.module('address-book.main').config(function($routeProvider) {

  $routeProvider.when('/', {
    controller: 'AppCtrl',
    templateUrl: '/templates/app.html'
  });

  $routeProvider.when('/contact/:id', {
    controller: '',
    templateUrl: '/templates/contact.html'
  });

});

angular.module('address-book', ['address-book.main']);

