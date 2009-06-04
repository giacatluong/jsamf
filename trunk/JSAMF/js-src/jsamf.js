pl = {maliboo:{ajax:{}}};


pl.maliboo.ajax.JSAMF = function (gateway /*String*/)
{
	this.gateway = gateway;
}

pl.maliboo.ajax.JSAMF.initialized = false;
pl.maliboo.ajax.JSAMF.DIV_NAME = null;
pl.maliboo.ajax.JSAMF.responders = {};

/**
*
*	STATIC
*
*/

pl.maliboo.ajax.JSAMF.initialize = function (objectId /*String*/)
{
	//Something usefull here
}

pl.maliboo.ajax.JSAMF.getResponderById = function (id /*String*/) /*JSAMF.Responder*/
{
	return pl.maliboo.ajax.JSAMF.responders[id];
}

pl.maliboo.ajax.JSAMF.releaseResponderById = function (id /*String*/) /*JSAMF.Responder*/
{
	pl.maliboo.ajax.JSAMF.responders[id] = null;
	delete pl.maliboo.ajax.JSAMF.responders[id];
}

pl.maliboo.ajax.JSAMF.partialMessageHandler = function (id /*String*/, index /*Number*/, total /*Number*/, message /*String*/, partialMode /*Number*/)
{
	var responder = pl.maliboo.ajax.JSAMF.getResponderById(id);
	responder.partialMode = partialMode;
	responder.addPart(index, total, message);
	
}

pl.maliboo.ajax.JSAMF.resultHandler = function (id /*String*/, result /*Object*/)
{
	console.log(result);
	JSAMF.getResponderById(id).result(result);
	pl.maliboo.ajax.JSAMF.releaseResponderById(id);
}

pl.maliboo.ajax.JSAMF.faultHandler = function (id /*String*/, status /*Object*/)
{
	console.log(status);
	pl.maliboo.ajax.JSAMF.getResponderById(id).fault(status);
	pl.maliboo.ajax.JSAMF.releaseResponderById(id);
}

pl.maliboo.ajax.JSAMF.pushHandler = function (result /*Object*/)
{
	console.log(status);
	//What to do?
}

pl.maliboo.ajax.JSAMF.embedSWF = function (divName /*String*/, width /*String*/, height /*String*/)
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
* 
* Private
*
*/

pl.maliboo.ajax.JSAMF.getMovieElementInternal = function ()
{
	return document.getElementById(pl.maliboo.ajax.JSAMF.DIV_NAME);
}

pl.maliboo.ajax.JSAMF.internalCall = function (uri /*String*/, method /*String*/, responder /*JSAMF.Responder*/, args /*Array*/)
{
	if (responder.uid.length == 0)
		throw new Error("Responder doesn't have uid!");
	responder.clear(); //Moze lepiej dawac result/fault handlery?
	pl.maliboo.ajax.JSAMF.responders[responder.uid] = responder;
	var flashObject = pl.maliboo.ajax.JSAMF.getMovieElementInternal();
	flashObject.callAMF.apply(flashObject, [uri, responder.uid, method].concat(args));
}




//TODO: responder powinien byc unique, wiec trzeba dawac callbacki?!?
pl.maliboo.ajax.JSAMF.prototype.call = function (method /*String*/, responder /*JSAMF.Responder, ...rest*/)
{
	//Tutaj trzeba przepisac argumenty do tablicy
	var args = pl.maliboo.ajax.argumentsToArray(arguments);
	args.shift();
	args.shift();
	pl.maliboo.ajax.JSAMF.internalCall.apply(this, [this.gateway, method, responder].concat(args));
}



pl.maliboo.ajax.JSAMF.prototype.getMovieElement = function () /*Flash object*/
{
	return pl.maliboo.ajax.JSAMF.getMovieElementInternal();
}


pl.maliboo.ajax.JSAMF.prototype.getMarshallExceptions = function () /*Boolean*/
{
	return this.getMovieElement().getMarshallExceptions();
}

pl.maliboo.ajax.JSAMF.prototype.setMarshallExceptions = function (marshall /*Boolean*/)
{
	this.getMovieElement().setMarshallExceptions(marshall);
}




pl.maliboo.ajax.argumentsToArray = function (args /*Object*/) /*Array*/
{
	var i = args.length;
	var arr = [];
	while (i--)
		arr[i] = args[i];
	return arr;
}


/**
* Mozna by pomyslec nad jakims kolejkowaniem wywolan, zanim engine sie nie zainicjalizuje?
*
*/





/**
*
*	UTILS
*
*/

pl.maliboo.ajax.Responder = function (result /*Function*/, fault /*Function*/)
{
	if (result == null)
		throw new Error("No result function in Responder!");
	this.clear();
	this.uid = pl.maliboo.ajax.Responder.getUid();
	this.result = result;
	if (fault != null)
		this.fault = fault;
}

pl.maliboo.ajax.Responder.uid = 0;
pl.maliboo.ajax.Responder.PARTIAL_RESULT = 0;
pl.maliboo.ajax.Responder.PARTIAL_FAULT = 1;

pl.maliboo.ajax.Responder.getUid = function () /*String*/
{
	return "uid_" + pl.maliboo.ajax.Responder.uid++
}

pl.maliboo.ajax.Responder.prototype.addPart = function (index /*Number*/, total /*Number*/, message /*String*/)
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

pl.maliboo.ajax.Responder.prototype.clear = function()
{
		this.rcvBuffer = [];
		this.rcvParts = 0;
		this.rcvTotal = -1;
		this.partialMode = pl.maliboo.ajax.Responder.PARTIAL_RESULT
}

pl.maliboo.ajax.Responder.prototype.finalize = function()
{
	var message = null;
	//console.log("String length: "+this.rcvBuffer.length);
	try
	{
		eval("message = "+this.rcvBuffer.join(""));
		this.result(message);
	}
	catch (e)
	{
		//console.log("Dammit, something's fucked!");
		this.fault("Dupa!");
		console.log(this.rcvBuffer);
	}
	this.clear();
}

pl.maliboo.ajax.Responder.prototype.uid = null;
pl.maliboo.ajax.Responder.prototype.result = function (){};
pl.maliboo.ajax.Responder.prototype.fault = function (){};


/*
TODO:

- kanal zwrotny
- pakietowanie asynchroniczne
*/