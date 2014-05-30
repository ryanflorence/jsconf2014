var app = angular.module('app', ['ngRoute', 'ngResource']);

app.config(function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'index-template.html'
  });

  $routeProvider.when('/contact/:id', {
    templateUrl: 'contact-template.html',
    controller: 'ContactCtrl'
  });

  $routeProvider.when('/edit/:id', {
    templateUrl: 'edit-template.html',
    controller: 'EditCtrl'
  });
});

app.factory('Contacts', function($resource) {
  return $resource('http://localhost:5000/contacts/:id', {id: '@id'}, {
    query: {
      isArray: true,
      transformResponse: function(res) {
        return angular.fromJson(res).contacts;
      }
    },
    get: {
      transformResponse: function(res) {
        return angular.fromJson(res).contact;
      }
    },
    update: {
      method:'PUT',
      transformRequest: function(data) {
        return angular.toJson({contact: data});
      }
    }
  });
});

app.controller('MasterCtrl', function($rootScope, $routeParams, $scope, Contacts) {
  $scope.contacts = Contacts.query();
  $rootScope.$on('contactEdit', function() {
    $scope.contacts = Contacts.query();
  });
  $scope.$on('$routeChangeSuccess', function() {
     $scope.activeId = $routeParams.id;
  });
});

app.controller('ContactCtrl', function($scope, $routeParams, Contacts) {
  $scope.contact = Contacts.get({id: $routeParams.id});
});

app.controller('EditCtrl', function($rootScope, $timeout, $location, $scope, $routeParams, Contacts) {
  var contact = $scope.contact = Contacts.get({id: $routeParams.id}, function() {
    $scope.copy = {
      first: contact.first,
      last: contact.last,
      avatar: contact.avatar
    }
  });

  $scope.save = function() {
    Contacts.update({id: $scope.contact.id}, $scope.copy, function() {
      $location.path('contact/'+$scope.contact.id);
      $rootScope.$emit('contactEdit');
    });
  };
});

