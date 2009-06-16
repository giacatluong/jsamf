package pl.maliboo.ajax
{
	import com.serialization.json.JSON;
	
	import flash.external.ExternalInterface;
	import flash.net.NetConnection;
	import flash.utils.ByteArray;
	import flash.utils.Dictionary;

	public class AMFGateway
	{
		private static const CALL_INSTANCE:String = "jsamf.JSAMF.partialMessageHandler";
		private static const JSON_LENGTH:uint = 30000;
		
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
				connection.call.apply(connection, [method, new AJAXResponder(id, this), ba]);
			}
			else
				connection.call.apply(connection, [method, new AJAXResponder(id, this)].concat(args));
			//log("Flash >>> Id:"+id+", uri:" + uri+", method:"+method+", args:"+args);
		}
		
		
		public function result(id:String, result:*):void
		{
			sendResponse(ResponseType.RESULT, id, result);
		}
		
		public function fault(id:String, status:Object):void
		{
			sendResponse(ResponseType.FAULT, id, status);
		}
		
		private function sendResponse(partialMode:int, id:String, message:*):void
		{
			var jsonString:String = JSON.serialize(message);		
			var numParts:uint = Math.ceil(jsonString.length/JSON_LENGTH);
			for (var i:int = 0; i < numParts; i++)
			{
				var msg:String = jsonString.substr(i*JSON_LENGTH, JSON_LENGTH);
				msg = msg.replace(/\\/gm, "\\\\");
				ExternalInterface.call.apply(null, [CALL_INSTANCE, id, i, numParts, msg, partialMode]);
			}
		}
		
		private function log(text:String):void
		{
			ExternalInterface.call("console.log", text);
		}
	}
}