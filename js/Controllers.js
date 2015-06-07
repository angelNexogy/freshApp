angular.module('Controllers', ['Security', 'Kandy', 'ui.bootstrap','dialogs.main'])

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
        // $rootScope.logged = true;
        // $rootScope.$apply();        
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

.controller('HomeController', function($scope, $state, dialogs, SecurityAuthFactory, KandyManager) {

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
  
  SecurityAuthFactory.getUserAuth().then(function(data){

      $scope.user = {username: data.kandy.user_id + KandyManager.domain, full_name: data.first_name + " " + data.last_name};
      KandyManager.setup(null, $('#incoming-video')[0], onLoginSuccess, onLoginFailed, onCallInitiate, onCallInitiateFail, onCall, onCallTerminate, onCallIncoming, onCallAnswered, onPresenceNotification);
  
      KandyManager.login(data.kandy.user_id, data.kandy.password);
  });

  var onLoginSuccess = function(){
      console.info('logged');
      $scope.login = 'logged';

      KandyAPI.Phone.updatePresence(0);
      KandyManager.getDirectory(onGetDirectory);
      // $state.go('app.video');
      // KandyAPI.Phone.updatePresence(0); 
      // loadAddressBook();

      // setInterval(function(){
      //     KandyManager.getIM(getIMSuccessCallback, getIMFailedCallback);
      // }, 1000); 
  };

  var onLoginFailed = function(){
      console.error('log failed');
  };

  var onCallInitiate = function(call){
      console.info('call initiate: ' + call.getId());

      $scope.call_id = call.getId();
  };

  var onCallInitiateFail = function(){
      console.error('call initiate failed');
        $audioRingOut[0].pause();      
  };

  var onCall  = function(call){
      console.info('call started: ' + call.getId());
      $scope.call_id = call.getId();
      $audioRingOut[0].pause();
  };

  var onCallTerminate  = function(){
      console.info('call terminated');
      $audioRingOut[0].pause();      
      $audioRingIn[0].pause();      
  };

  var onCallIncoming = function(call){
      console.info('call incoming: ' + call.getId());

      $scope.call_id = call.getId();

      var dlg = dialogs.create('templates/dialogs/call.html','CallController',{call: call, direction: 'in', user: user_id, video: false}, {size:'md',keyboard: false, backdrop: 'static'});
      
      dlg.result.then(function(name){
     
        },function(){
        
      });

      // $state.go('app.receive_call');
  };  

  var onCallAnswered = function(){
      console.log('call answered');
      $audioRingIn[0].pause();      
      // $audioRingOut[0].pause();         
  };

  var onGetDirectory = function(data){
    console.log(data);
    // $scope.contacts = [];

    data.forEach(function(contact){      
      if(contact.full_user_id != $scope.user.username)          
      {
          $scope.contacts.push(contact);
      }
    });

    KandyManager.watchPresence(data);

    $scope.contacts_loader = false;
    $scope.$apply();   

    // $state.go('app.call');     
  };

  var onPresenceNotification = function(username, state, description, activity){
    console.info(username);
    console.info(state);
    console.info(description);    
    console.info(activity);

    $scope.contacts.forEach(function(contact){      
      if(contact.full_user_id == username)          
      {
          contact.state = state;
      }
    });

    $scope.$apply();
  };  

  $scope.call = function(user){

      var dlg = dialogs.create('templates/dialogs/call.html','CallController',{direction: 'out', user: user, video: false}, {size:'md',keyboard: false, backdrop: 'static'});
      dlg.result.then(function(name){
     
        },function(){
        
      });
  }

})
.controller('IncomingCallController', function($scope, $state, SecurityAuthFactory, KandyManager) {

    $audioRingIn[0].play();

    $scope.answer_call = function(){
      KandyManager.answerCall($scope.call_id);
    };
})
.controller('CallController', function($scope, $state, $modalInstance, data, SecurityAuthFactory, KandyManager) {

    $scope.user = data.user;
    $scope.direction = data.direction == 'in';
    $scope.call = data.call || null;    

    $scope.init_call = function(){
      $audioRingOut[0].play();
      KandyManager.makeCall( data.user.full_user_id, data.video );//'simplelogin40@development.nexogy.com', false);
    };

    $scope.end_call = function(){
      KandyManager.endCall($scope.call_id);
    };

    if(data.direction == 'in')
    {
        $audioRingIn[0].play();
    }

    $scope.answer_call = function(){
      console.log()
      KandyManager.answerCall($scope.call_id);
    };

    $scope.reject_call = function(){
      KandyManager.rejectCall($scope.call_id);
    };

  // $scope.cancel = function(){
  //   $modalInstance.dismiss('canceled');  
  // }; // end cancel
  
  // $scope.save = function(){
  //   $modalInstance.close($scope.user.name);
  // }; // end save
  
  // $scope.hitEnter = function(evt){
  //   if(angular.equals(evt.keyCode,13) && !(angular.equals($scope.name,null) || angular.equals($scope.name,'')))
  //       $scope.save();
  // }; // end hitEnter




});