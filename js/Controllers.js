angular.module('Controllers', ['Security', 'Kandy'])

.controller('AuthController', function($rootScope, $scope, $state, SecurityAuthFactory, KandyManager) {
	//User login data
	$scope.loginData = {};

	//User register data
	$scope.registerData = {
		user: {
			  kandy: {
			    country_code: 'US',
			  }
		}
	};

  //Flag to switch between form_login and register_login
  // $scope.showLoginForm = true;

  $scope.passwordLogin = function() {
    var email = $scope.loginData.email;
    var password = $scope.loginData.password;

    loginUser(email, password);
  }

  var loginUser = function(email, password){

    SecurityAuthFactory.authObj().$authWithPassword({
      email: email,
      password: password
    }).then(function(authData) {

        // $state.go('app');
        $rootScope.logged = true;
        $state.go('home');        

    }).catch(function(error) {

		alert('Unknown username or wrong password');
      // $ionicPopup.alert({
      //   title: 'Authentication failed',
      //   template: 'Unknown username or wrong password'
      // });      
    });

  }

  $scope.userRegister = function(){

    SecurityAuthFactory.authObj().$createUser({
      email: $scope.registerData.email,
      password: $scope.registerData.password
    }).then(function(userData) {

      //Create Kandy user
      var kandy_user_id = String(userData.uid).replace(':', '');

      KandyManager.kandyCreateUser(kandy_user_id, $scope.registerData.user.country_code, $scope.registerData.user.first_name, $scope.registerData.user.last_name).then(function(res){
          
          //Add user kandy passoword to user data
          $scope.registerData.user.kandy.password = res.user_password;

          //Create Firebase user
          $scope.registerData.user.email = $scope.registerData.email;

          $scope.registerData.user.kandy.user_id = kandy_user_id;

          var userRef = SecurityAuthFactory.managerFB().child('/users/' + userData.uid);
          userRef.set($scope.registerData.user);

          //Make a login afeter register successfull
          loginUser($scope.registerData.email, $scope.registerData.password);
      });
    }).catch(function(error) {
        console.log(error);

        alert('Registration Failed');
        // $ionicPopup.alert({
        //   title: 'Registration failed',
        //   template: 'Invalid arguments'
        // });
    });
    
  };
})

.controller('BaseController', function($rootScope, $scope, $state, SecurityAuthFactory, KandyManager) {

  $scope.hola = 'logged';
  $scope.login = null;
  $scope.call_id = null;
  $scope.contacts = [];
  $scope.contacts_loader = true;
  $scope.user = {};

  $scope.logout = function(){
    SecurityAuthFactory.authObj().$unauth();
    KandyManager.logout();      
  };

  $scope.onLoginSuccess = function(){
      console.info('logged');
      $scope.login = 'logged';

      KandyManager.getDirectory($scope.onGetDirectory);
      // $state.go('app.video');
      // KandyAPI.Phone.updatePresence(0); 
      // loadAddressBook();

      // setInterval(function(){
      //     KandyManager.getIM(getIMSuccessCallback, getIMFailedCallback);
      // }, 1000); 
  };

  $scope.onLoginFailed = function(){
      console.error('log failed');
  };

  $scope.onCallInitiate = function(call){
      console.info('call initiate: ' + call.getId());

      $scope.call_id = call.getId();
  };

  $scope.onCallInitiateFail  = function(){
      console.error('call initiate failed');
  };

  $scope.onCall  = function(call){
      console.info('call started: ' + call.getId());
      $scope.call_id = call.getId();
      $audioRingOut[0].pause();
  };

  $scope.onCallTerminate  = function(){
      console.info('call terminated');
      $audioRingOut[0].pause();      
  };

  $scope.onCallIncoming = function(call){
      console.info('call incoming: ' + call.getId());

      $scope.call_id = call.getId();        

      $state.go('app.receive_call');
  };  

  $scope.onCallAnswered = function(){
      console.log('call answered');
      $audioRingIn[0].pause();      
      $audioRingOut[0].pause();         
  };

  $scope.onGetDirectory = function(data){
    // console.log(data);

    // data.forEach(function(contact){      
    //   if(contact.full_user_id != $scope.user.username)          
    //   {
    //       var index = $scope.contacts.length + 1;
    //       contact.id = index;
    //       $scope.contacts.push(contact);
    //   }
    // });

    // KandyManager.watchPresence(data);

    // $scope.contacts_loader = false;
    // $scope.$apply();   

    // // $state.go('app.call');        
    $scope.contacts = [];

    data.forEach(function(contact){ 
      if(contact.full_user_id != $scope.user.username)          
      {
          // contact.presence = 'text-muted';
          $scope.contacts.push(contact);
      }
    });

    console.log($scope.contacts);
    $scope.contacts_loader = false;
    $scope.$apply();   

    KandyManager.watchPresence(data);     
  };

  $scope.onPresenceNotification = function(username, state, description, activity){
    console.info(username);
    console.info(state);
    console.info(description);    
    console.info(activity);    
  }
})
.controller('HomeController', function($scope, $state, SecurityAuthFactory, KandyManager) {

    SecurityAuthFactory.getUserAuth().then(function(data){

        $scope.user = {username: data.kandy.user_id + KandyManager.domain, full_name: data.first_name + " " + data.last_name};
        KandyManager.setup(null, $('#incoming-video')[0], $scope.onLoginSuccess, $scope.onLoginFailed, $scope.onCallInitiate, $scope.onCallInitiateFail, $scope.onCall, $scope.onCallTerminate, $scope.onCallIncoming, $scope.onCallAnswered, $scope.onPresenceNotification);
    
        KandyManager.login(data.kandy.user_id, data.kandy.password);
    });
  })
.controller('IncomingCallController', function($scope, $state, SecurityAuthFactory, KandyManager) {

    $audioRingIn[0].play();

    $scope.answer_call = function(){
      KandyManager.answerCall($scope.call_id);
    };
})
.controller('CallController', function($scope, $state, SecurityAuthFactory, KandyManager) {

    $scope.init_call = function(){
      $audioRingOut[0].play();
      KandyManager.makeCall('simplelogin40@development.nexogy.com', true);
    };

    $scope.end_call = function(){
      KandyManager.endCall($scope.call_id);
    }; 
});
