package pl.maliboo.ajax
{
	import flash.net.Responder;
	
	public class AJAXResponder extends Responder
	{
		private var uid:String;
		private var gateway:AMFGateway;
		private var compress:Boolean;
		
		public function AJAXResponder(uid:String, gateway:AMFGateway, compress:Boolean=false)
		{
			this.uid = uid;
			this.gateway = gateway;
			this.compress = compress;
			super(result, fault);
		}
		
		private function fault(status:Object):void
		{
			gateway.fault(uid, status, compress);
		}
		
		private function result(result:*):void
		{
			gateway.result(uid, result, compress);
		}
	}
}