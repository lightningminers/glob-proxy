var net = require('net');
var buf = require('buffer');
var url = require('url');
var child = require('child_process').fork('./src/ws_handler');
/**
	web sockte 服务器与其他服务器或client交互

	开启，此服务，将启动一个子进程，运行这个sockte服务器在后台
*/
//日志类
var GuiderLog = function(){
    this.log = [];
}
GuiderLog.prototype.append = function(key,message){
	var _key = {}
	_key[key] = message;
	this.log.push(_key);
	// console.log('log : ',this.log)
	console.log(key,' : ',message);
}
GuiderLog.prototype.send = function(_url){
	var urlParse = url.parse(_url);
	var sendData = urlParse;
	sendData.sendData = this.log;
	/**
		把数据传递给子进程去处理
	*/
	child.send(sendData);
	//发送成功之后，日志内存清空
	this.clear();
}
GuiderLog.prototype.clear = function(){
	this.log.length = 0;
}
module.exports = new GuiderLog();