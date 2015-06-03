angular.module('Controllers', ['Security', 'Kandy'])

.controller('AuthController', function($scope, $state, SecurityAuthFactory, KandyManager) {
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
  $scope.showLoginForm = true;

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

        $state.go('app');

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

.controller('BaseController', function($scope, $state, SecurityAuthFactory, KandyManager) {

	$scope.hola = 'logged';
  $scope.login = null;
  $scope.call_id = null;

  SecurityAuthFactory.getUserAuth().then(function(data){

      KandyManager.setup(null, $('#incoming-video')[0], onLoginSuccess, onLoginFailed, onCallInitiate, onCallInitiateFail, onCall, onCallTerminate, onCallIncoming, onCallAnswered);

      // KandyManager.logout();
  
      KandyManager.login(data.kandy.user_id, data.kandy.password);
  });

  var onLoginSuccess = function(){
      console.log('logged');
      $scope.login = 'logged';

      // $state.go('app.video');
      // KandyAPI.Phone.updatePresence(0); 
      // loadAddressBook();

      // setInterval(function(){
      //     KandyManager.getIM(getIMSuccessCallback, getIMFailedCallback);
      // }, 1000); 
  };

  var onLoginFailed = function(){
      console.log('log failed');
  };

  var onCallInitiate = function(call){
      console.log('call initiate');
      console.log(call.getId());

      $scope.call_id = call.getId();
  };

  var onCallInitiateFail  = function(){
      console.log('call initiate failed');
  };

  var onCall  = function(call){
      console.log('call started');
      console.log(call.getId()); 
      $scope.call_id = call.getId();
      $audioRingOut[0].pause();
  };

  var onCallTerminate  = function(){
      console.log('call terminated');
      $audioRingOut[0].pause();      
  };

  var onCallIncoming = function(call){
      console.log('call incoming');
      console.log(call.getId()); 
      $scope.call_id = call.getId();        

      $state.go('app.receive_call');
  };  

  var onCallAnswered = function(){
      console.log('call answered');
      $audioRingIn[0].pause();      
      $audioRingOut[0].pause();         
  };

  $state.go('app.call'); 

})
.controller('IncomingCallController', function($scope, $state, SecurityAuthFactory, KandyManager) {

    $audioRingIn[0].play();

    $scope.answer_call = function(){
      KandyManager.answerCall($scope.call_id);
    };
})
.controller('CallController', function($scope, $state, SecurityAuthFactory, KandyManager) {

    $audioRingOut[0].play();

    $scope.init_call = function(){
      KandyManager.makeCall('simplelogin40@development.nexogy.com', true);
    };

    $scope.end_call = function(){
      KandyManager.endCall($scope.call_id);
    }; 
});
;
