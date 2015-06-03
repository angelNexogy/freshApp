angular.module('Controllers', ['Security', 'Kandy'])

.controller('BaseController', function($scope, $state, $ionicModal, $ionicPopup, SecurityAuthFactory, KandyManager) {

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

        $state.go('app.home');

    }).catch(function(error) {
      $ionicPopup.alert({
        title: 'Authentication failed',
        template: 'Unknown username or wrong password'
      });
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
        $ionicPopup.alert({
          title: 'Registration failed',
          template: 'Invalid arguments'
        });
    });
    
  }

  $scope.logout = function(){
    KandyManager.logout();
    SecurityAuthFactory.authObj().$unauth();
  }

})

.controller('ProfileController', function($scope, $stateParams) {
    
})

.controller('MessageController', function($scope, $stateParams) {

})
    
.controller('HomeController', function($scope, $stateParams, $state, $ionicHistory, $ionicModal, KandyManager, SecurityAuthFactory) {
    
    SecurityAuthFactory.getUserAuth().then(function(data){

        KandyManager.setup($('#outgoing-video')[0], $('#incoming-video')[0], onLoginSuccess, onLoginFailed, onCallInitiate, onCallInitiateFail, onCall, onCallTerminate, onCallIncoming, onCallAnswered);

        KandyManager.logout();
    
        KandyManager.login(data.kandy.user_id, data.kandy.password);
    });

    $scope.call_id = '';

    var onLoginSuccess = function(){
        console.log('logged');
        KandyAPI.Phone.updatePresence(0); 
        loadAddressBook();

        // setInterval(function(){
        //     KandyManager.getIM(getIMSuccessCallback, getIMFailedCallback);
        // }, 1000); 
        KandyManager.getDirectory(function(data){
          console.log(data);
        });
    };

    var onLoginFailed = function(){
        console.log('log failed');
    };

    var onCallInitiate = function(call){
        console.log('call initiate');
        console.log(call.getId());
        $scope.call_id = call.getId();
        $audioRingOut[0].play();
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
        $audioRingIn[0].play();      
    };  

    var onCallAnswered = function(){
        console.log('call answered');
        $audioRingIn[0].pause();      
        $audioRingOut[0].pause();         
    };     

    var loadAddressBook = function(){
        KandyManager.getAddressBook(addressBookCallback);  
    }

    var addressBookCallback = function(data){
        $scope.addressBook = data;
    };

    $scope.showContactModal = function(){

      $scope.newContactData = {};

      $ionicModal.fromTemplateUrl('templates/Contact/add_contact_modal.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.modal = modal;
        $scope.modal.show();
      });

      $scope.closeContactModal = function() {
        $scope.modal.hide();
      };

      //Cleanup the modal when we're done with it!
      $scope.$on('$destroy', function() {
        $scope.modal.remove();
      });

      // Execute action on hide modal
      $scope.$on('modal.hidden', function() {
        // Execute action
      });
      // Execute action on remove modal
      $scope.$on('modal.removed', function() {
        // Execute action
      });
    };

    $scope.saveContact  = function(){

      console.log($scope.newContactData);

            /** addToPersonalAddressBook(entry, success, failure)
          Adds an entry to the user's personal address book
          @params <object> entry, <function> success/failure
      */
      KandyAPI.Phone.addToPersonalAddressBook(contactsObject, loadContacts, function() {
        alert('Contact couldn\'t be added'); // failure callback
      });
    }

    $scope.init_call = function(){
      KandyManager.makeCall('simplelogin40@development.nexogy.com', true);
    };

    $scope.end_call = function(){
      KandyManager.endCall($scope.call_id);
    };    

    $scope.answer_call = function(){
      KandyManager.answerCall($scope.call_id);
    };

    $scope.messages = [];

    var sendIMSuccessCallback = function(data){

        $scope.messages.push({ sender: 'Me', text: data.message.text, ack: 0, uuid: data.UUID });
        $scope.$apply();
        console.log('message sent');
    };

    var sendIMFailedCallback = function(){
        console.log('message failed');
    };    

    var getIMSuccessCallback = function(data){

        if(data.messages.length > 0)
        {
          data.messages.forEach(function(msg){
            
            if(msg.messageType == 'chatRemoteAck')
            {                        
              var BreakException= {};

              try {
                  $scope.messages.forEach(function(elem) {
                      if(elem.ack == 0) 
                      {
                        elem.ack = 1;
                        throw BreakException;
                      }
                  });
              } catch(e) {
                  if (e!==BreakException) throw e;
              }  
                      
              $scope.$apply();

              console.log('message reception confirmed');
            }
            else
            {
              $scope.messages.push({ sender: msg.sender.user_id, text: msg.message.text, ack: 0 });
              $scope.$apply();                
              console.log('message received'); 
            }          
          });        
        }
    };

    var getIMFailedCallback = function(){
        console.log('message load failed');
    };    

    $scope.message = '';

    $scope.send_im = function(content, type){ 

      $scope.message = '';      
      switch(type)
      {  
        case 'text': KandyManager.sendIM('simplelogin40@development.nexogy.com', content, 'text', sendIMSuccessCallback, sendIMFailedCallback); 
                     break;
      }
    };

    $scope.uploadImage = function(event){
      console.log(event);
    }
})

.controller('PlaylistsCtrl', function($scope, SecurityAuthFactory, $firebaseArray) {
  $scope.messages = $firebaseArray(SecurityAuthFactory.managerFB().$ref().child('messages'));

  $scope.messages.$loaded()
    .then(function(data) {
      $scope.messages = data; // true
  })
  .catch(function(error) {
    console.log("Error:", error);
  });

  messagesRef.$watch(function() {
      console.log("data changed!");
  });

})


