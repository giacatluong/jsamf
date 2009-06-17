package pl.maliboo.ajax
{
	import flash.net.Responder;
	
	public class AJAXResponder extends Responder
	{
		private var id:String;
		private var gateway:AMFGateway;
		private var compressed:Boolean;
		
		public function AJAXResponder(id:String, gateway:AMFGateway, compressed:Boolean=false)
		{
			this.id = id;
			this.gateway = gateway;
			this.compressed = compressed;
			super(result, fault);
		}
		
		private function fault(status:Object):void
		{
			gateway.fault(id, status, compressed);
		}
		
		private function result(result:*):void
		{
			gateway.result(id, result, compressed);
		}
	}
}