package pl.maliboo.ajax
{
	import flash.external.ExternalInterface;
	import flash.net.Responder;
	
	public class AJAXResponder extends Responder
	{
		private var uid:String;
		private var gateway:AMFGateway;
		
		public function AJAXResponder(uid:String, gateway:AMFGateway)
		{
			this.uid = uid;
			this.gateway = gateway;
			super(result, fault);
		}
		
		private function fault(status:Object):void
		{
			gateway.fault(uid, status);
		}
		
		private function result(result:*):void
		{
			gateway.result(uid, result);
		}
	}
}