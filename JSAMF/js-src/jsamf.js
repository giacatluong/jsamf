jsamf = {};

/**
 * @param (String) gateway Service URI
 * @param (Boolean) compress If true, Flash use ByteArray compression default false
 */
//TODO: Poprawic respondera do pushy...
//TODO: Po stronie flasha obsluzyc synchronicznosc
jsamf.JSAMF = function (gateway, compress)
{
	this.gateway = gateway;
	this.compress = compress == true;
	this.id = jsamf.generateId();
}

/**
 * @private
 */
jsamf.JSAMF.initialized = false;
/**
 * @private
 */
jsamf.JSAMF.DIV_NAME = null;
/**
 * @private
 */
jsamf.JSAMF.calls = {};

/**
 * @private
 */

jsamf.JSAMF.initialize = function ()
{
	//Something usefull here
}

/**
 * @private
 * @param (String) id 
 * @return (jsamf.CallInstance) Returns responder for given id
 */

jsamf.JSAMF.getCallById = function (id)
{
	return jsamf.JSAMF.calls[id];
}

/**
 * @private
 * @param (String) id Releases responder from internal hash map
 * @return (jsamf.CallInstance)
 */

jsamf.JSAMF.releaseCallById = function (id)
{
	var callInstance = jsamf.JSAMF.calls[id];
	jsamf.JSAMF.calls[id] = null;
	delete jsamf.JSAMF.calls[id];
	return callInstance;
}

/**
 * @private
 * @param (String) id Responder id
 * @param (Number) index Part index
 * @param (Number) total Total parts number
 * @param (String) message Part message
 * @param (Number) partialMode Partial mode for response (result or fault)
 * @see jsamf.CallInstance.PARTIAL_RESULT
 * @see jsamf.CallInstance.PARTIAL_FAULT
 */

jsamf.JSAMF.partialMessageHandler = function (id, index, total, message, partialMode)
{
	var callInstance = jsamf.JSAMF.getCallById(id);
	callInstance.partialMode = partialMode;
	callInstance.addPart(index, total, message);
}

/**
* @param (String) divName DIV name to embed flash control
* @param (String) socketServer Socket server address for push calls
* @throws (Error) Throws error, when JSAMF allready embedded
*/
//TODO: allowScriptAccess=always!!!!
//TODO: wmode=transparent?
//TODO: width,height=1,1
jsamf.JSAMF.embedSWF = function (divName, socketServer, width, height)
{
	if (jsamf.JSAMF.DIV_NAME != null)
		throw new Error("Allready embedded!");

	jsamf.JSAMF.DIV_NAME = divName;
	var args = jsamf.argumentsToArray(arguments);

	args = ["../bin-release/JSAMF.swf"].concat(args);
	
	//Cos mi tu nie dziala z display:none

	if (args[7] == undefined)
		args[7] = {};
	if (args[7].style == undefined)
		args[7].style = "display:none;";

	swfobject.embedSWF.apply(swfobject, args);
	//swfobject.embedSWF("../bin-release/JSAMF.swf", divName);
	//jak ustawic styl!?
	//jsamf.JSAMF.getMovieElementInternal(divName).style = "display:none;";
}


/**
 * @private
 * @return (Object) Returns Flash object
 */

jsamf.JSAMF.getMovieElementInternal = function ()
{
	return document.getElementById(jsamf.JSAMF.DIV_NAME);
}


/**
 * @param (String) method Remote method name
 * @param (jsamf.Responder) responder Responder object
 * @param ...rest Additional method parameters
 * @throws (Error) Throws error, when result callback is undefined
 */
jsamf.JSAMF.prototype.call = function (method, responder)
{
	var flashObject = jsamf.JSAMF.getMovieElementInternal();
	var callInstance = new jsamf.CallInstance(this, responder);
	jsamf.JSAMF.calls[callInstance.id] = callInstance;
	var args = jsamf.argumentsToArray(arguments, 2);
	flashObject.callAMF.apply(flashObject, [this.gateway, callInstance.id, method, this.compress].concat(args));
}

/**
 * @private
 * @param (String) id Responder id
 * @param (Object) result Result object
 */

jsamf.JSAMF.prototype.resultHandler = function (id, result)
{
	console.log(result);
	jsamf.JSAMF.releaseCallById(id).responder.result(result);
}

/**
 * @private
 * @param (String) id CallInstance id
 * @param (Object) status Status object (jsamf.NetStatusObject for eg.)
 * @see jsamf.NetStatusObject
 */

jsamf.JSAMF.prototype.faultHandler = function (id, status)
{
	console.log(status);
	jsamf.JSAMF.releaseCallById(id).responder.fault(status);
}


/**
 * @return (Boolean) Returns true if exception marshalling is on, otherwise false.
 */
jsamf.JSAMF.getMarshallExceptions = function ()
{
	return jsamf.JSAMF.getMovieElementInternal().getMarshallExceptions();
}
/**
 * @param (Boolean) useMarshall Sets marshalling exception to and from Flash
 * @see Flash help for ExternalInterface.marshallExceptions
 */
jsamf.JSAMF.setMarshallExceptions = function (useMarshalling)
{
	jsamf.JSAMF.getMovieElementInternal().setMarshallExceptions(useMarshalling);
}


/**
 * @param (Function) result 
 * @param (Function) fault
 * @throws (Error) Throws error, when result callback is undefined
 */
jsamf.Responder = function (result, fault)
{
	if (result == null && this.result == null)
		throw new Error("No result function in Responder!");
	this.result = result;
	if (fault != null)
		this.fault = fault;
}

/**
 * @param (Object) result
 */
jsamf.Responder.prototype.result = function (result){};

/**
 * @param (jsamf.NetStatusObject) status
 */
jsamf.Responder.prototype.fault = function (status){};


/**
 * @private
 * @param (Object) args
 * @param (Number) trim
 * @return (Array)
 */
//TODO: dodac argument Number - trimujacy z lewej lub z prawej (+/-)
jsamf.argumentsToArray = function (args, trim)
{
	var i = args.length;
	var arr = [];
	while (i--)
		arr[i] = args[i];
	if (trim < 0)
		return arr.slice(0, trim);
	else
		return arr.slice(trim);
	//return arr.slice(0, isNaN(trim)? arr.length : trim);
}

/**
 * @private
 * @return (String) Returns unique id
 */
jsamf.generateId = function ()
{
	return "jsamf_"+jsamf.instance_id++;
}
jsamf.instance_id = 0;


/**
 * @private
 * @param (jsamf.JSAMF) owner
 * @param (jsamf.Responder) responder
 */
jsamf.CallInstance = function (owner, responder)
{
	this.id = jsamf.generateId();
	this.owner = owner;
	this.responder = responder;
	this.rcvBuffer = [];
	this.rcvParts = 0;
	this.rcvTotal = -1;
}

jsamf.CallInstance.PARTIAL_RESULT = 0;
jsamf.CallInstance.PARTIAL_FAULT = 1;

/**
 * @private
 * @param (Number) index
 * @param (Number) total
 * @param (String) message
 * @throws (Error) Throws error, when total parts not equal previous length
 */
jsamf.CallInstance.prototype.addPart = function (index, total, message)
{
	//console.log(this.id+"@part "+index+"/"+total);
	this.rcvBuffer[index] = message;
	this.rcvParts++;
	if (this.rcvTotal != -1 && this.rcvTotal != total)
		throw new Error("Something's fcuked up in partial message total (was "+this.rcvTotal+", is "+total+")");
	this.rcvTotal = total;
	if (index == total - 1)
		this.finalize();
}

/**
 * @private
 */
jsamf.CallInstance.prototype.finalize = function()
{
	var message = null;
	//console.log("String length: "+this.rcvBuffer.length);
	try
	{
		//Surprinsinlgy this method is 2x faster than:
		//eval("message = "+this.rcvBuffer.join(""));
		var joinedBuff = this.rcvBuffer.join("");
		eval("message = "+joinedBuff);
		//this.rcvBuffer = null; //Hmmm should I clean it "just in case"?
		this.owner.resultHandler(this.id, message);
	}
	catch (e)
	{
		//console.log("Dammit, something's fucked!");
		var status = new NetStatusObject(jsamf.StatusLevel.ERROR, jsamf.StatusCode.RESPONDER_FRAGMENTATION);
		status.content = this;
		this.owner.faultHandler(this.id, message);
		//console.log(this.rcvBuffer);
	}
}





/**
 * @param (String) level
 * @param (String) code 
 */
jsamf.NetStatusObject = function (level, code)
{
	this.level = level;
	this.code = code;
}

jsamf.StatusLevel = 
{
	STATUS: "status",
	ERROR: "error",
	WARNING: "warning"
}

jsamf.StatusCode = 
{
	BAD_VERSION: "NetConnection.Call.BadVersion", //error
	CALL_FAILED: "NetConnection.Call.Failed", //error
	CALL_PROHIBITED: "NetConnection.Call.Prohibited", //error
	CONNECT_CLOSED: "NetConnection.Connect.Closed", //status
	CONNECT_FAILED: "NetConnection.Connect.Failed", //error
	CONNECT_SUCCESS: "NetConnection.Connect.Success", //status
	//CONNECT_REJECTED: "NetConnection.Connect.Rejected", //error?
	//APP_SHUTDOWN: "NetConnection.Connect.AppShutdown", //error
	//INVALID_APP: "NetConnection.Connect.InvalidApp" //error
	
	//JSAMF Related:
	RESPONDER_FRAGMENTATION: "JSAMF.Responder.FragmentationError" //error
}

/**
 * Moze powinienem to zostawic jako zwykle parametry osadzania?
 * @param (String) divName 
 * @param (String) initCallbackName 
 */
/*jsamf.InitObject = function (divName, initCallbackName)
{
	if (divName == undefined || divName.length == 0)
		throw new Error("Parameter divName omitted!");
	this.initCallbackName = initCallbackName == undefined? 
		"jsamf.JSAMF.initialize" : initCallbackName;
}
*/


/*
* TODO:
* - CallInstance id per JSAMF instancja (dla socketow!!!)
* - obsluga bledow
* - kanal zwrotny /server push/
* + pakietowanie asynchroniczne ...
* - ...i nie w kolejnosci (per instancja)
* - FMS client?
*/