package pl.maliboo.ajax
{
	import com.serialization.json.JSON;
	
	import flash.external.ExternalInterface;
	import flash.net.NetConnection;
	import flash.utils.Dictionary;

	public class AMFGateway
	{
		
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
		
		public static function callAMF(uri:String, id:String, method:String, ...rest):void
		{
			getInstanceForUri(uri).call(id, method, rest);
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
			this.connection = new NetConnection();
			this.connection.connect(uri);
		}
		
		public function call(id:String, method:String, args:Array):void
		{
			/*var connection:NetConnection = new NetConnection();
			connection.connect(uri);*/
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
				ExternalInterface.call.apply(null, [Callbacks.PARTIAL, id, i, numParts, msg, partialMode]);
			}
		}
		
		private function log(text:String):void
		{
			ExternalInterface.call("console.log", text);
		}
	}
}