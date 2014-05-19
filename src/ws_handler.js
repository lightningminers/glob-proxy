var net = require('net');
/**
	admin.py 待实现
*/
process.on('message',function(m,n){
	if(m){
		try{
			var data = m.sendData;
			var optionsParam = {
				port:m.port || 80,
				host:m.host,
				path:m.pathname,
				headers:{}
			}
		}catch(e){
			process.stdout.write('参数错误');
			return;
		}
		
	}
});