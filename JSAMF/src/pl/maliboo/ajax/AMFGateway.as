package pl.maliboo.ajax
{
	import flash.external.ExternalInterface;
	import flash.net.NetConnection;
	import flash.utils.ByteArray;
	import flash.utils.Dictionary;

	public class AMFGateway
	{
		public static const CALL_INSTANCE:String = "jsamf.JSAMF.partialMessageHandler";
		public static const JSON_LENGTH:uint = 30000;
		
		private static const gateways:Dictionary = new Dictionary();
		
		private var uri:String;
		private var connection:NetConnection;
		
		
		public static function initialize():void
		{
			ExternalInterface.addCallback("callAMF", callAMF);
			ExternalInterface.addCallback("getMarshallExceptions", getMarshallExceptions);
			ExternalInterface.addCallback("setMarshallExceptions", setMarshallExceptions);
		
			ExternalInterface.call("JSAMF.initialize");	
		}
		
		public static function getInstanceForUri(uri:String):AMFGateway
		{
			if (gateways[uri] == null)
				gateways[uri] = new AMFGateway(uri);
			return gateways[uri];
		}
		
		public static function callAMF(uri:String, id:String, method:String, compress:Boolean, ...rest):void
		{
			getInstanceForUri(uri).call(id, method, compress, rest);
		}
		
		public static function setMarshallExceptions(marshall:Boolean):void
		{
			ExternalInterface.marshallExceptions = marshall;
		}
		
		public static function getMarshallExceptions():Boolean
		{
			return ExternalInterface.marshallExceptions;
		}
		
		
		public function AMFGateway(uri:String)
		{
			this.uri = uri;
			//TODO: should it be 1 object? Or one per call?
			this.connection = new NetConnection();
			this.connection.connect(uri);
		}
		
		public function call(id:String, method:String, compress:Boolean, args:Array):void
		{
			/*var connection:NetConnection = new NetConnection();
			connection.connect(uri);*/
			if (compress)
			{
				var ba:ByteArray = new ByteArray();
				ba.writeObject(args);
				ba.compress();
				connection.call.apply(connection, [method, new AJAXResponder(id, this, true), ba]);
			}
			else
				connection.call.apply(connection, [method, new AJAXResponder(id, this, false)].concat(args));
			//log("Flash >>> Id:"+id+", uri:" + uri+", method:"+method+", args:"+args+", compress: "+compress+(compress? ", size: "+ba.length : ""));
		}
		
		
		public function result(id:String, result:*, compress:Boolean):void
		{
			sendResponse(id, ResponseType.RESULT, tryDecompress(result, compress));
			//log("Flash >>> Result - Id:"+id+", result:"+tryDecompress(result, compress)+", compress: "+compress);
		}
		
		public function fault(id:String, status:Object, compress:Boolean):void
		{
			sendResponse(id, ResponseType.FAULT, tryDecompress(result, compress));
		}
		
		private function tryDecompress(response:*, compress:Boolean):*
		{
			if (compress == false || !(response is ByteArray))
				return response;
			var ba:ByteArray = response as ByteArray;
			var object:* = null;
			
			try
			{
				ba.uncompress();
			}
			catch (e:Error){}
			
			try
			{
				ba.position = 0;
				object = ba.readObject();
				//try to read next object, throw warning if position != length-1?!
			}
			catch (e:Error)
			{
				//throw Error to JS!?
				log("Flash >>> Cannot decompress ByteArray("+ba.length+")");
			}
			return object;
		}
		
		private function sendResponse(id:String, partialMode:int, message:*):void
		{
			/*var jsonString:String = JSON.serialize(message);	
			var numParts:uint = Math.ceil(jsonString.length/JSON_LENGTH);
			for (var i:int = 0; i < numParts; i++)
			{
				var msg:String = jsonString.substr(i*JSON_LENGTH, JSON_LENGTH);
				msg = msg.replace(/\\/gm, "\\\\");
				ExternalInterface.call.apply(null, [CALL_INSTANCE, id, i, numParts, msg, partialMode]);
			}*/
			AsyncCaller.addCaller(new AsyncCaller(id, partialMode, message, JSON_LENGTH));
		}
		
		private function log(text:String):void
		{
			ExternalInterface.call("console.log", text);
		}
	}
}