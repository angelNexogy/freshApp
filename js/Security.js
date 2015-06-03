angular
  .module('Security', ['firebase'])
  .constant('SECURITY_FIREBASE_PATH', 'https://scorching-inferno-9201.firebaseio.com/nexogy')
  .factory('SecurityAuthFactory', ['$rootScope', '$firebaseAuth', '$firebaseObject','SECURITY_FIREBASE_PATH', 
  	function securityAuthFactory($rootScope, $firebaseAuth, $firebaseObject, SECURITY_FIREBASE_PATH) {

	  var ref = new Firebase(SECURITY_FIREBASE_PATH);
	  var auth = $firebaseAuth(ref);

	  return {
      authObj: function(){
        return auth;
      },
      managerFB: function(){
        return ref;
      },
      getUserAuth: function(){
          if(auth.$getAuth()){

            var refUserAuth = ref.child('/users/').child(auth.$getAuth().uid);

            var objUserAuth = $firebaseObject(refUserAuth);

            return objUserAuth.$loaded(function(data){
                return data;
            },
            function(error) {
              return null;
            });
          }
          else
          {
            return null;
          }
      }
	  }
}]);