angular
  .module('Kandy', [])
  .constant('KANDY_ACCOUNT_KEY', 'AAKb4f93438e782426b9f959609145f9af1')
  .constant('KANDY_ACCOUNT_SECRET', 'AAS45c30166ae594200a94c8e86da3eee3b')  
  .constant('KANDY_DOMAIN_KEY', 'DAK7cc41019d8324a4a92db881f0987cc7b')    
  .constant('KANDY_DOMAIN_SECRET', 'DAScfff637efcd5445aa6cd9580da2072d7')      
  .constant('KANDY_API_URL', 'https://api.kandy.io/v1.2/')    
  .constant('KANDY_API_DOMAIN', '@development.nexogy.com')      
  .factory("KandyManager", function ($rootScope, $http, KANDY_ACCOUNT_KEY, KANDY_ACCOUNT_SECRET, KANDY_API_URL, KANDY_DOMAIN_KEY, KANDY_DOMAIN_SECRET, KANDY_API_DOMAIN) {
    
    var kandyServices = {};

    kandyServices.domain = KANDY_API_DOMAIN;

	kandyServices.kandyUserToken = function(user_id){

	  		// return $http.get(KANDY_API_URL + 'domains/users/accesstokens?key=' + KANDY_DOMAIN_KEY + '&user_id=angel&user_password=A1234567')	  		
	  		return $http.get(KANDY_API_URL + 'domains/users/accesstokens?key=' + KANDY_DOMAIN_KEY + '&domain_api_secret=' + KANDY_DOMAIN_SECRET + '&user_id=' + user_id)	  			  		
					.then(function (res) {

						// if(res.data.status == 0)
						// {
							// console.log(res);
							// $rootScope.kandy_access_token = res.data.result.account_access_token;
							// return true;
							// return res.data.result.account_access_token;
						// }

						// return false;
						return res.data.result.user_access_token;
					});
		};

	kandyServices.kandyDomainToken = function(){
  		return $http.get(KANDY_API_URL + 'domains/accesstokens?key=' + KANDY_DOMAIN_KEY + '&domain_api_secret=' + KANDY_DOMAIN_SECRET)	  		
			.then(function (res) {
				return res.data.result.domain_access_token;
			});
		};		

	kandyServices.kandyCreateUser = function(user_id, user_country_code, user_first_name, user_last_name, user_email, user_password){
			params = { 
						user_id: user_id,
						user_country_code: user_country_code,
						user_first_name: user_first_name,
						user_last_name: user_last_name,
						//user_email: user_email,
						// user_password: user_password,
					};

			return	kandyServices.kandyDomainToken().then(function(res){

				  		return $http.post(KANDY_API_URL + 'domains/users/user_id?key=' + res, params)	  		
								.then(function (res) {
									return res.data.result;
								});				
					});


		};

	kandyServices.kandyAddContact = function(contact){

			return	kandyServices.kandyUserToken().then(function(res){
						params = { 
									contact: contact
								};

				  		return $http.post(KANDY_API_URL + 'users/addressbooks/personal?key=' + res, params)	  		
								.then(function (res) {
									return res.data.result.contact_id;
								});				
					});


		};


	// KandyAPI.Phone.setup({
	//   listeners: {
	//     loginsuccess: kandyServices.login,
	//     loginfailed: myLoginFailedFunction
	//   }
	// });

	kandyServices.setup = function(outgoingVideo, incomingVideo, loginSuccessCallback, loginFailedCallback, onCallInitiate, onCallInitiateFail, onCall, onCallTerminate, onCallIncoming, onCallAnswer, onPresenceNotification){
							KandyAPI.Phone.setup({
					          remoteVideoContainer: incomingVideo,
					          localVideoContainer: outgoingVideo,
							  listeners: {
							    loginsuccess: loginSuccessCallback,
							    loginfailed: loginFailedCallback,

					            callinitiated: onCallInitiate,
					            callinitiatefailed: onCallInitiateFail,
					            oncall: onCall,
					            callended: onCallTerminate,	
            					callincoming: onCallIncoming,
            					callanswered: onCallAnswer,
            					presencenotification: onPresenceNotification,            					
							  }
							});
						}

	kandyServices.login = function(user_id, password){ KandyAPI.Phone.login( KANDY_DOMAIN_KEY, user_id, password); };

	kandyServices.logout = function(){ KandyAPI.Phone.logout(); }

	kandyServices.makeCall = function(user_id, cameraOn){ KandyAPI.Phone.makeCall(user_id, cameraOn); }

	kandyServices.endCall = function(callId){ KandyAPI.Phone.endCall(callId); }

	kandyServices.answerCall = function(callId){ KandyAPI.Phone.answerCall(callId, true); }

	kandyServices.getAddressBook = function(successCallback){ KandyAPI.Phone.retrievePersonalAddressBook(successCallback); }

	// kandyServices.createContact = function(successCallback){ KandyAPI.Phone.addToPersonalAddressBook(contactsObject, successCallback); }	
	kandyServices.getDirectory = function(successCallback) { KandyAPI.Phone.searchDirectoryByUserName('', successCallback); }

	kandyServices.watchPresence = function(contacts) { 
		
		users = [];
	    contacts.forEach(function(contact){
	      users.push({full_user_id: contact.full_user_id});
	    });

		KandyAPI.Phone.watchPresence(users, function(){ console.info('Watching presence.');}, function(){ console.error('Fail watching presence.');}); 
	}

	kandyServices.sendIM = function(sendTo, content, type, successCallback, failedCallback){

		successCallback = successCallback || null;
		failedCallback = failedCallback || null;

		switch(type)
		{
			case 'text': KandyAPI.Phone.sendIm(sendTo, content, successCallback, failedCallback);
						 break;

		}			
	}

	kandyServices.getIM = function(successCallback, failedCallback){

		successCallback = successCallback || null;
		failedCallback = failedCallback || null;

		KandyAPI.Phone.getIm(successCallback, failedCallback);
	}

	return kandyServices;
  });
  