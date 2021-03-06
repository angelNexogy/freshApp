var myApp = angular.module('starter',
        [
            'ui.router',
            'Security', 
            'Kandy', 
            'Controllers'
        ]);

//This will handle all of our routing
myApp.config(function ($stateProvider, $urlRouterProvider) {

    // For any unmatched url, redirect to /
    $urlRouterProvider.otherwise("/");

    // Now set up the states
    $stateProvider
            .state('login', {
                url: "/",
                templateUrl: 'templates/login.html',
                controller: 'AuthController'
            })
            .state('home', {
                url: "/home",
                templateUrl: 'templates/home.html',
                controller: 'HomeController',
                // params: {init: true}
                // defaultParams: {init: true}
            })  
            .state('home.chat', {
                url: "/chat",
                templateUrl: 'templates/chat.html',
                controller: 'ChatController'
            })                
            .state('home.call', {
                url: "/call",
                templateUrl: 'templates/dialogs/call.html',
                controller: 'CallController'
            })
    //         .state('app.receive_call', {
    //             url: "/receive",
    //             templateUrl: 'templates/get_call.html',
    //             controller: 'IncomingCallController'
    //         })     
    //         .state('app.call', {
    //             url: "/call",
    //             templateUrl: 'templates/call.html',
    //             controller: 'CallController'
    //         }) 
    //         .state('logout', {
    //             url: "/logout",
    //             controller: 'LogoutController'
    //         })
    //         .state('layout', {
    //             url: "/dashboard",
    //             templateUrl: 'templates/views/layout.html',
    //             controller: 'AppController',
    //         })
    //         .state({
    //             parent: "layout",
    //             name: "home",
    //             url: "/home",
    //             templateUrl: 'templates/views/dashboard.html',
    //             controller: 'DashboardCtrl',
    //             nav: 1,
    //             content: '<i class="icon-dashboard"></i> Dashboard'
    //         })
    //         //this routes are of payors
    //         .state('layout.newPayor', {
    //             url: "/newPayor",
    //             templateUrl: 'templates/views/payor/payor.html',
    //             controller: 'MyNewPayorCtrl'
    //         })

    //         .state('layout.payorList', {
    //             url: "/payorList",
    //             templateUrl: 'templates/views/payor/payorList.html',
    //             controller: 'MyPayorCtrl'
    //         })

    //         //this routes are of billers
    //         .state('layout.newBiller', {
    //             url: "/newBiller",
    //             templateUrl: 'templates/views/biller/biller.html',
    //             controller: 'MyNewBillerCtrl'
    //         });
});

myApp.run(function ($rootScope, $state, $location, SecurityAuthFactory) {    

    // SecurityAuthFactory.authObj().$unauth();
    // $rootScope.logged = true;    

    SecurityAuthFactory.authObj().$onAuth(function(authData) {
        if(!authData){
            // $rootScope.logged = false;
            $state.go('login');            
        }
        // else
        //     $rootScope.logged = true;
    });

    $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState) {

        // console.log(toState);
        if(!SecurityAuthFactory.authObj().$getAuth() && toState.name !== 'login') {
            event.preventDefault();
            // $rootScope.logged = false;
            $state.go('login');
        }
        else if(SecurityAuthFactory.authObj().$getAuth() && toState.name == 'login'){
            event.preventDefault();
            $state.go('home'/*, {init: false}*/);
        }
    });
});