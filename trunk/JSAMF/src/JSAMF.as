package 
{
	import flash.display.Sprite;
	import flash.utils.setInterval;
	
	import pl.maliboo.ajax.AMFGateway;
	
	public class JSAMF extends Sprite
	{
		public function JSAMF()
		{
			super();
			graphics.beginFill(0xFF0000);
			graphics.drawRect(-10, -10, 50, 50);
			graphics.endFill();
			
			AMFGateway.initialize();
			
			setInterval(function ():void {rotation+=3}, 30);
		}
	}
}