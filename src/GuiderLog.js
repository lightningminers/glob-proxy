var http = require('http');
var buf = require('buffer');
var url = require('url');
var child = require('child_process');
/**
	web sockte 服务器与其他服务器或client交互

	开启，此服务，将启动一个子进程，运行这个sockte服务器在后台
*/
//日志类
var GuiderLog = function(){
    this.log = [];
}
GuiderLog.prototype.append = function(key,message){
	this.log.push({key:message});
	console.log(key,' : ',message);
}
GuiderLog.prototype.send = function(_url){
	var urlParse = url.parse(_url);
	
	//发送成功之后，日志内存清空
	this.clear();
}
GuiderLog.prototype.clear = function(){
	this.log.length = 0;
}
module.exports = new GuiderLog();