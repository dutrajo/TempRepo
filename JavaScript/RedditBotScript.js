
var alreadyReplied = [];

var username = "null";
var password = "null";
var clientId = "null";
var clientSecret = "null";
var token = "null";
var tokenType = "null";
var lastTimeSentSeconds = 0;
var timeBetweenSends = 60*15;
var wordsToSearchForArr = [];
var badWords = [];
var responseString = "null";
var currentlySendingResponse = 0;
var itemsInOutputDiv = 0;

var makeRequestIntervalId = 0;
var getTokenRequestIntervalId = 0;

function createResponseString()
{
	debugger;
	var response = document.getElementById("searchKeyWordsResponseTextBox").value;
	
	return response;
}

function disableAllWhileRunning()
{
	document.getElementById("searchKeyWordsTimeDelayTextBox").disabled = true;
	document.getElementById("searchKeyWordsToFindTextBox").disabled = true;
	document.getElementById("searchKeyWordsToAvoidTextBox").disabled = true;
	document.getElementById("searchKeyWordsResponseTextBox").disabled = true;
	document.getElementById("userNameTextBox").disabled = true;
	document.getElementById("userPasswordTextBox").disabled = true;
	document.getElementById("appIdTextBox").disabled = true;
	document.getElementById("appSecretTextBox").disabled = true;
	document.getElementById("startTheBotButton").disabled = true;
	document.getElementById("authTestButton").disabled = true;
	document.getElementById("stopTheBotButton").disabled = false;
	
	
}

function reEnableAll()
{
	document.getElementById("searchKeyWordsTimeDelayTextBox").disabled = false;
	document.getElementById("searchKeyWordsToFindTextBox").disabled = false;
	document.getElementById("searchKeyWordsToAvoidTextBox").disabled = false;
	document.getElementById("searchKeyWordsResponseTextBox").disabled = false;
	document.getElementById("userNameTextBox").disabled = false;
	document.getElementById("userPasswordTextBox").disabled = false;
	document.getElementById("appIdTextBox").disabled = false;
	document.getElementById("appSecretTextBox").disabled = false;
	document.getElementById("startTheBotButton").disabled = false;
	document.getElementById("authTestButton").disabled = false;
	document.getElementById("stopTheBotButton").disabled = true;
}

function outputToWindow(stringToOutput)
{
	var outputDiv = document.getElementById("outputDivConsole");
	
	var newLabel = document.createElement("label");
	newLabel.id = "newLabel_" + itemsInOutputDiv.toString();
	itemsInOutputDiv++;
	newLabel.textContent = stringToOutput;
	
	outputDiv.appendChild(newLabel);
	outputDiv.appendChild(document.createElement("br"));
}

function outputTokenStatus(stringToOutput)
{
	var outputLabel = document.getElementById("tokenStatusLabel");
	outputLabel.textContent = stringToOutput;
}


function getToken()
{
	token = "null";
	tokenType = "null";
	
	if(username != "null" && password != "null" && clientId != "null" && clientSecret != "null")
	{
		var address = "https://www.reddit.com/api/v1/access_token";
		var payload = "grant_type=password" + 
			"&username=" + username.toString() + 
			"&password=" + password.toString();
		var req = new XMLHttpRequest();
		req.open("POST",address,true);
		req.addEventListener("load",getTokenCallBack);
		req.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
		req.setRequestHeader("Authorization","Basic " + btoa(clientId.toString() + ":" + clientSecret.toString()));
		req.onreadystatechange=function(){
			if(req.readyState == 4){
				if(req.status == 200)
				{
					//success
				}
				else
				{
					outputTokenStatus("ERROR: Bad Credentials!");
				}
			}
		}
		req.send(payload);
		outputTokenStatus("Requesting a token...");
	}
	else
	{
		outputTokenStatus("Error: username password is not filled in");
	}
}



function getTokenCallBack(event)
{
	var tempRes = JSON.parse(this.responseText);
	
	
	if(tempRes.hasOwnProperty("access_token"))
	{
		outputTokenStatus("Recieved an authentication token..");
		var d = new Date();
		document.getElementById("tokenRecievedTimeLabel").textContent = d.toLocaleTimeString() + " " + d.toLocaleDateString();
		document.getElementById("tokenValidSecondsLabel").textContent = tempRes.expires_in.toString();
		token = tempRes.access_token;
		tokenType = tempRes.token_type;
		testToken();
	}
	else
	{
		console.log("ERROR: Didn't get an authentication token!!!!");
		console.log("Cannot continue without authentication token....");
		alert("ERROR NO AUTHENTICATION TOKEN!!!!");
		outputTokenStatus("ERROR: Check Console");
		document.getElementById("tokenRecievedTimeLabel").textContent = "NULL";
		document.getElementById("tokenValidSecondsLabel").textContent = "NULL";
		document.getElementById("tokenValidLabel").textContent = "NOT VALID"
	}
	
	
	
}

function testTokenCallBack(event)
{
	var res = JSON.parse(this.responseText);
	outputTokenStatus("Testing token....");
	
	if(res.hasOwnProperty("name"))
	{
			
		if(res.name.toString() != username)
		{
		
			token = "null";
			tokenType = "null";
			outputTokenStatus("ERROR: Check Console");
			document.getElementById("tokenRecievedTimeLabel").textContent = "NULL";
			document.getElementById("tokenValidSecondsLabel").textContent = "NULL";
			document.getElementById("tokenValidLabel").textContent = "NOT VALID"
		}
		else
		{
			//everthing is good to go
			outputTokenStatus("Success: Token is good.");
			document.getElementById("tokenValidLabel").textContent = "valid";
			
		
		}
	}
	else
	{
		token = "null";
		tokenType = "null";
		console.log("ERROR: testing authentication token failed!!!");
		outputTokenStatus("ERROR: Check Console");
		document.getElementById("tokenRecievedTimeLabel").textContent = "NULL";
		document.getElementById("tokenValidSecondsLabel").textContent = "NULL";
		document.getElementById("tokenValidLabel").textContent = "NOT VALID"
	}
	
}

function testToken()
{

	if(token != "null")
	{
		outputTokenStatus("Testing authentication token...");
		var address = "https://oauth.reddit.com/api/v1/me";
		var req = new XMLHttpRequest();
		req.open("GET",address,true);
		req.addEventListener("load",testTokenCallBack);
		req.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
		req.setRequestHeader("Authorization", tokenType.toString() + " " + token.toString());
		req.onreadystatechange=function(){
			if(req.readyState == 4){
				if(req.status == 200)
				{
					//success
				}
				else
				{
					outputToWindow("ERROR: Something bad happend while testing token!");
				}
			}
		}
		req.send(null);
	}
	

	

}


function sendResponseComment(fullname, parentCommentLinkAddress)
{
	if(token != "null")
	{
		if(currentlySendingResponse != 1)
		{
			currentlySendingResponse = 1;
			var dateTimeNow = new Date();
			outputToWindow("Attempting to respond to: " + parentCommentLinkAddress);
			
			var address = "https://oauth.reddit.com/api/comment";
			var parent = fullname;
			var textToSend = createResponseString();
			var payload = "parent=" + parent.toString() + "&text=" + textToSend.toString();
			var req = new XMLHttpRequest();
			req.open("POST",address,true);
			req.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
			req.setRequestHeader("Authorization", tokenType.toString() + " " + token.toString());
			req.addEventListener("load",sendResponseCallBack);
			req.onreadystatechange=function(){
				if(req.readyState == 4){
					if(req.status == 200)
					{
						//success
					}
					else
					{
						outputToWindow("ERROR: Something bad happend to request!");
					}
				}
			}
			req.send(payload);
			
		}
		
		
		

	}
}

function checkForWords(stringToLookThrough)
{
	for(var i=0; i < wordsToSearchForArr.length; i++)
	{
		if(stringToLookThrough.includes(wordsToSearchForArr[i].toString()))
		{
			return true;
		}
	}
	
	return false;
}

function checkForInappropriate(stringToLookThrough)
{
	
	for(var i = 0; i < badWords.length; i++)
	{
		if(stringToLookThrough.includes(badWords[i].toString()))
		{
			return true;
		}
	}
	
	return false;
}

function sendResponseCallBack(event)
{

	//debugger;
	var res = this.responseText;
	var resHeaderXlimitUsed = this.getResponseHeader("X-Ratelimit-Used");
	var resHeaderXlimitRemain = this.getResponseHeader("X-Ratelimit-Remaining");
	var resHeaderXlimitReset = this.getResponseHeader("X-Ratelimit-Reset");
	var allRespHeaders = this.getAllResponseHeaders().toLowerCase();
	
	if(res.includes("you are doing that too much") == false)
	{
		lastTimeSentSeconds = new Date().getTime()/1000;
		outputToWindow("Successfully responded!");
			
	}
	else
	{
		outputToWindow("Failed to respond due to karma rate limit.");
		
	}
	
	if(currentlySendingResponse == 1)
	{
		currentlySendingResponse = 0;
	}
	
}

function getResultCallBack(event)
{

	var results = JSON.parse(this.responseText);
	
	for(var i = 0; i < results.data.children.length; i++)
	{
		var bodyString = results.data.children[i].data.body.toString().toLowerCase();
		var linkString = results.data.children[i].data.link_permalink.toString().toLowerCase();
		var author = results.data.children[i].data.author.toString();
		var parentIdFullname = results.data.children[i].data.name.toString();
		var parentId = results.data.children[i].data.id.toString();
		
		if(checkForWords(bodyString))
		{
			if( !alreadyReplied.includes(parentIdFullname) &&  author != username.toString())
			{
				if(!(checkForInappropriate(bodyString)) && !(checkForInappropriate(linkString)))
				{
					
					var curTimeSeconds = new Date().getTime()/1000;
					var diffSeconds = curTimeSeconds - lastTimeSentSeconds;

					if(diffSeconds >= timeBetweenSends && currentlySendingResponse != 1)
					{
						alreadyReplied.push(parentIdFullname);
						sendResponseComment(parentIdFullname,(linkString + parentId));
					}
					
				}

			}
			
			
			
		}
	}
}

function makeRequest()
{
	if( token != "null")
	{
		var req = new XMLHttpRequest();
		var address = "https://www.reddit.com/r/all/comments/.json?limit=100";
		req.open("GET",address,true);
		req.addEventListener('load',getResultCallBack);
		req.onreadystatechange=function(){
			if(req.readyState == 4){
				if(req.status == 200)
				{
					//success
				}
				else
				{
					outputToWindow("ERROR: Something bad happend to request!");
				}
			}
		}
		req.send(null);
	}
	else
	{
		alert("Bad credential token! Stopping bot!");
		stopTheBot();
	}
}

function testCredentialsButtonClicked(event)
{
	username = document.getElementById("userNameTextBox").value;
	password = document.getElementById("userPasswordTextBox").value;
	clientId = document.getElementById("appIdTextBox").value;
	clientSecret = document.getElementById("appSecretTextBox").value;
	getToken();
	
	//refresh token every 50 minutes
	getTokenRequestIntervalId = setInterval(getToken,1000*60*50);
}

function startSearchingButtonClicked(event)
{
	
	//debugger;
	timeBetweenSends = 60 * document.getElementById("searchKeyWordsTimeDelayTextBox").value;
	wordsToSearchForArr = document.getElementById("searchKeyWordsToFindTextBox").value.split(":");
	badWords = document.getElementById("searchKeyWordsToAvoidTextBox").value.split(":");
	responseString = document.getElementById("searchKeyWordsResponseTextBox").value;
	
	if(wordsToSearchForArr.length <= 1 && wordsToSearchForArr[0] == "" || (responseString == "null" || responseString == ""))
	{
		alert("Not going to run because no words to search for or invalid response string or bad credentials");
	}
	else
	{
		if(username == "null" || password == "null" || clientId == "null" || clientSecret == "null")
		{
			testCredentialsButtonClicked("null");
		}
		
		//check requests every minute
		makeRequestIntervalId = setInterval(makeRequest,10000);
		disableAllWhileRunning();
		
	}
	
}

function stopTheBot()
{
	//debugger;
	alert("stopping the bot!");
	clearInterval(makeRequestIntervalId);
	clearInterval(getTokenRequestIntervalId);
	reEnableAll();
	outputToWindow("The Bot has been stopped...");
	
}

function bindButtons()
{
	document.getElementById("authTestButton").addEventListener('click',testCredentialsButtonClicked);
	document.getElementById("startTheBotButton").addEventListener('click',startSearchingButtonClicked);
	document.getElementById("stopTheBotButton").addEventListener('click',stopTheBot);
}

//add event listener to call bindButtons function after dom elements have loaded
document.addEventListener('DOMContentLoaded',bindButtons);

