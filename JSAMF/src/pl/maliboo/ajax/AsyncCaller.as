package pl.maliboo.ajax
{
	import com.serialization.json.JSON;
	
	import flash.external.ExternalInterface;
	import flash.utils.setTimeout;

	public class AsyncCaller
	{
		private static const TIMEOUT_INTERVAL:uint = 10;
		
		private var id:String;
		private var mode:int;
		private var message:*;
		private var json:String;
		private var numParts:uint;
		private var messageLength:uint;
		private var pointer:uint;
		
		private var timeout:uint;
		
		public function AsyncCaller(id:String, mode:int, message:*, messageLength:uint=30000)
		{
			this.id = id;
			this.mode = mode;
			this.message = message;
			this.messageLength = messageLength;
		}
		
		private function start():void
		{
			json = JSON.serialize(message);
			numParts = Math.ceil(json.length/messageLength);
			message = null;
			pointer = 0;
			timeout = setTimeout(process, TIMEOUT_INTERVAL);
		}
		
		private function process():void
		{
			var msg:String = json.substr(pointer*messageLength, messageLength);
			msg = msg.replace(/\\/gm, "\\\\");
			ExternalInterface.call.apply(null, [AMFGateway.CALL_INSTANCE, id, pointer, numParts, msg, mode]);
			if (++pointer < numParts)
				timeout = setTimeout(process, TIMEOUT_INTERVAL);
		}
		
		public static function addCaller(caller:AsyncCaller):void
		{
			caller.start();
		}
	}
}