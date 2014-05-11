var http = require('http');
//日志类
var GuiderLog = function(){
    this.log = [];
}
GuiderLog.prototype.append = function(key,message){
	this.log.push({key:message});
	console.log(key,' : ',message ,'\n');
}
GuiderLog.prototype.send = function(){
	//发送成功之后，日志内存清空
	this.log.length = 0;
}
module.exports = new GuiderLog();