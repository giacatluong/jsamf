pl = {maliboo:{ajax:{}}};

var jasmf = pl.maliboo.ajax;

/**
 * @param (String) gateway Service URI
 * @param (Boolean) compress If true, Flash use ByteArray compression default false
 */
//TODO: Poprawic respondera do pushy...
//TODO: Po stronie flassha obsluzyc synchronicznosc
pl.maliboo.ajax.JSAMF = function (gateway, compress)
{
	this.gateway = gateway;
	this.compress = compress == true;
/*	var me = this;
	var pushResult = function (result)
	{
		me.pushResult(result);
		pl.maliboo.ajax.JSAMF.calls[pl.maliboo.ajax.JSAMF.SERVER_PUSH] = new pl.maliboo.ajax.CallInstance(responder);
	}
	var responder = new Responder(pushResult);
	pl.maliboo.ajax.JSAMF.calls[pl.maliboo.ajax.JSAMF.SERVER_PUSH] = new pl.maliboo.ajax.CallInstance(responder);*/

}

pl.maliboo.ajax.JSAMF.SERVER_PUSH = "_jsamf_server_push_";
/**
 * @private
 */
pl.maliboo.ajax.JSAMF.initialized = false;
/**
 * @private
 */
pl.maliboo.ajax.JSAMF.DIV_NAME = null;
/**
 * @private
 */
pl.maliboo.ajax.JSAMF.calls = {};

/**
 * @private
 */

pl.maliboo.ajax.JSAMF.initialize = function ()
{
	//Something usefull here
}

/**
 * @private
 * @param (String) id 
 * @return (pl.maliboo.ajax.Responder) Returns responder for given id
 */

pl.maliboo.ajax.JSAMF.getCallById = function (id)
{
	return pl.maliboo.ajax.JSAMF.calls[id];
}

/**
 * @private
 * @param (String) id Releases responder from internal hash map
 */

pl.maliboo.ajax.JSAMF.releaseCallById = function (id)
{
	pl.maliboo.ajax.JSAMF.calls[id] = null;
	delete pl.maliboo.ajax.JSAMF.calls[id];
}

/**
 * @private
 * @param (String) id Responder id
 * @param (Number) index Part index
 * @param (Number) total Total parts number
 * @param (String) message Part message
 * @param (Number) partialMode Partial mode for response (result or fault)
 * @see pl.maliboo.ajax.CallInstance.PARTIAL_RESULT
 * @see pl.maliboo.ajax.CallInstance.PARTIAL_FAULT
 */

pl.maliboo.ajax.JSAMF.partialMessageHandler = function (id, index, total, message, partialMode)
{
	var callInstance = pl.maliboo.ajax.JSAMF.getCallById(id);
	callInstance.partialMode = partialMode;
	callInstance.addPart(index, total, message);
}

/**
 * @private
 * @param (String) id Responder id
 * @param (Object) result Result object
 */

pl.maliboo.ajax.JSAMF.resultHandler = function (id, result)
{
	console.log(result);
	var callInstance = pl.maliboo.ajax.JSAMF.getCallById(id);
	pl.maliboo.ajax.JSAMF.releaseCallById(id);
	callInstance.responder.result(result);
}

/**
 * @private
 * @param (String) id CallInstance id
 * @param (Object) status Status object (pl.maliboo.ajax.NetStatusObject for eg.)
 * @see pl.maliboo.ajax.NetStatusObject
 */

pl.maliboo.ajax.JSAMF.faultHandler = function (id, status)
{
	console.log(status);
	var callInstance = pl.maliboo.ajax.JSAMF.getCallById(id);
	pl.maliboo.ajax.JSAMF.releaseCallById(id);
	callInstance.responder.fault(status);
}

/**
* @param (String) divName DIV name to embed flash control
* @param (String) socketServer Socket server address for push calls
* @throws (Error) Throws error, when JSAMF allready embedded
*/
//TODO: allowScriptAccess=always!!!!
//TODO: wmode=transparent?
//TODO: width,height=1,1
pl.maliboo.ajax.JSAMF.embedSWF = function (divName, socketServer, width, height)
{
	if (pl.maliboo.ajax.JSAMF.DIV_NAME != null)
		throw new Error("Allready embedded!");

	pl.maliboo.ajax.JSAMF.DIV_NAME = divName;
	var args = pl.maliboo.ajax.argumentsToArray(arguments);

	args = ["../bin-release/JSAMF.swf"].concat(args);
	
	//Cos mi tu nie dziala z display:none

	if (args[7] == undefined)
		args[7] = {};
	if (args[7].style == undefined)
		args[7].style = "display:none;";

	swfobject.embedSWF.apply(null, args);

	//jak ustawic styl!?
	//pl.maliboo.ajax.JSAMF.getMovieElementInternal(divName).style = "display:none;";
}


/**
 * @private
 * @return (Object) Returns Flash object
 */

pl.maliboo.ajax.JSAMF.getMovieElementInternal = function ()
{
	return document.getElementById(pl.maliboo.ajax.JSAMF.DIV_NAME);
}

/**
* @private
* @param (String) uri Gateway URI
* @param (String) method Remote method name
* @param (pl.maliboo.ajax.CallInstance) callInstance CallInstance object 
* @param (Array) args Remote method arguments (0...n)
*/

pl.maliboo.ajax.JSAMF.internalCall = function (uri, method, compress, callInstance, args)
{
	pl.maliboo.ajax.JSAMF.calls[callInstance.id] = callInstance;
	var flashObject = pl.maliboo.ajax.JSAMF.getMovieElementInternal();
	flashObject.callAMF.apply(flashObject, [uri, callInstance.id, method, compress].concat(args));
}



/**
 * @param (String) method Remote method name
 * @param (pl.maliboo.ajax.Responder) responder Responder object
 * @param ...rest Additional method parameters
 * @throws (Error) Throws error, when result callback is undefined
 */
pl.maliboo.ajax.JSAMF.prototype.call = function (method, responder)
{
	//Tutaj trzeba przepisac argumenty do tablicy
	var args = pl.maliboo.ajax.argumentsToArray(arguments);
	args.shift(); //method
	args.shift(); //responder
	var callInstance = new pl.maliboo.ajax.CallInstance(responder);
	pl.maliboo.ajax.JSAMF.internalCall.apply(this, [this.gateway, method, this.compress, callInstance].concat(args));
}

/**
 * (Object) Remote method call client object
 */
pl.maliboo.ajax.JSAMF.prototype.client = null;


/**
 * @private
 * @param (Object) pushObject Server push object {method: "methodName", body: object}
 * @throws Throws error, when JSAMF.client, or JSAMF.client[methodName] is not defined

pl.maliboo.ajax.JSAMF.prototype.pushResult = function (pushObject)
{
	if (this.client == null || !(this.client[pushObject.methodName] instanceof Function))
		throw new Error("Method "+pushObject.methodName+" not defined!");
	this.client[pushObject.methodName](pushObject.body);
}
 */
 
/**
 * @return (Boolean) Returns true if exception marshalling is on, otherwise false.
 */
pl.maliboo.ajax.JSAMF.getMarshallExceptions = function ()
{
	return pl.maliboo.ajax.JSAMF.getMovieElementInternal().getMarshallExceptions();
}
/**
 * @param (Boolean) useMarshall Sets marshalling exception to and from Flash
 * @see Flash help for ExternalInterface.marshallExceptions
 */
pl.maliboo.ajax.JSAMF.setMarshallExceptions = function (useMarshall)
{
	pl.maliboo.ajax.JSAMF.getMovieElementInternal().setMarshallExceptions(marshall);
}



/**
 * @private
 * @param (Object) args
 * @return (Array)
 */
//TODO: dodac argument Number - trimujacy z lewej lub z prawej (+/-)
pl.maliboo.ajax.argumentsToArray = function (args/*, trim*/)
{
	var i = args.length;
	var arr = [];
	while (i--)
		arr[i] = args[i];
	return arr;
}


/**
 * @param (Function) result 
 * @param (Function) fault
 * @throws (Error) Throws error, when result callback is undefined
 */
pl.maliboo.ajax.Responder = function (result, fault)
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
pl.maliboo.ajax.Responder.prototype.result = function (result){};

/**
 * @param (pl.maliboo.ajax.NetStatusObject) status
 */
pl.maliboo.ajax.Responder.prototype.fault = function (status){};



/**
 * @private
 * @param (pl.maliboo.ajax.Responder) responder
 */
pl.maliboo.ajax.CallInstance = function (responder)
{
	this.id = "id_" + pl.maliboo.ajax.CallInstance.id++;
	this.responder = responder;
	this.rcvBuffer = [];
	this.rcvParts = 0;
	this.rcvTotal = -1;
}

pl.maliboo.ajax.CallInstance.id = 0;
pl.maliboo.ajax.CallInstance.PARTIAL_RESULT = 0;
pl.maliboo.ajax.CallInstance.PARTIAL_FAULT = 1;

/**
 * @private
 * @param (Number) index
 * @param (Number) total
 * @param (String) message
 * @throws (Error) Throws error, when total parts not equal previous length
 */
pl.maliboo.ajax.CallInstance.prototype.addPart = function (index, total, message)
{
	//console.log("Part "+index+"/"+total+" = "+message);
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
pl.maliboo.ajax.CallInstance.prototype.finalize = function()
{
	var message = null;
	//console.log("String length: "+this.rcvBuffer.length);
	try
	{
		eval("message = "+this.rcvBuffer.join(""));
		pl.maliboo.ajax.JSAMF.resultHandler(this.id, message);
	}
	catch (e)
	{
		//console.log("Dammit, something's fucked!");
		var status = new NetStatusObject(pl.maliboo.ajax.StatusLevel.ERROR, 
			pl.maliboo.ajax.StatusCode.RESPONDER_FRAGMENTATION);
		status.content = this;
		pl.maliboo.ajax.JSAMF.faultHandler(this.id, message);
		//console.log(this.rcvBuffer);
	}
}





/**
 * @param (String) level
 * @param (String) code 
 */
pl.maliboo.ajax.NetStatusObject = function (level, code)
{
	this.level = level;
	this.code = code;
}

pl.maliboo.ajax.NetStatusObject.prototype.level;
pl.maliboo.ajax.NetStatusObject.prototype.code;

pl.maliboo.ajax.StatusLevel = 
{
	STATUS: "status",
	ERROR: "error",
	WARNING: "warning"
}

pl.maliboo.ajax.StatusCode = 
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
/*pl.maliboo.ajax.InitObject = function (divName, initCallbackName)
{
	if (divName == undefined || divName.length == 0)
		throw new Error("Parameter divName omitted!");
	this.initCallbackName = initCallbackName == undefined? 
		"pl.maliboo.ajax.JSAMF.initialize" : initCallbackName;
}
*/


/*
* TODO:
*
* - kanal zwrotny /server push/
* - pakietowanie asynchroniczne i nie w kolejnosci
* + pakowanie argumentow (problem tablic?):
* 	problem odpowiedzi: nie istnieje, zawsze dostajemy jeden obiekt
* 	problem zapytan: serwis musi dekorowac konkretna f-cje i wtedy dostaje tablice argumentow
* - pl.maliboo.ajax > jsamf (jako var?)
* - FMS client?
*/