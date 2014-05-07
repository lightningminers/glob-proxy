var http = require('http');
var fs = require('fs');
var url = require('url');
var Mock = require("mockjs");
var path = require('path');
var net = require('net');
var buffer = require('buffer');
var crypto = require('crypto');

var Guider = function(config){
    var self = this;
    self.config = config;
    self.REQUEST = config.REQUEST;
    self.ROOT = config.ROOT || null;
    self.WORKROOT = process.cwd();
    self.READCACHE = false;
    /**
    *   TYPE 类型用于支持HTTP SOAP TCP 代理 未来支持SOAP TCP协议
    *   PORT 初始化请求端口
    *   ROOT ROOT目录 用于读取本地文件时的根目录
    *   REQUEST 请求映射
    *   常规HTTP请求配置：GET POST PUT DELETE | SOAP请求也配置在REQUEST中
    *   STATIC_DIR 配置静态资源服务器目标目录
    *   STATIC_DIR_CONFIG 配置静态服务器端口
    *   MOCK 是否开启mock.js
    */
    self.CACHEADDRESS = self.WORKROOT + path.sep + 'cache.json';
    try{
        var cachefs = fs.statSync(self.CACHEADDRESS);
        self.READCACHE = (cachefs&&cachefs.isFile()) ? true : false;
    }catch(e){
        console.log('无法读取配置文件，在错误来临时，自动转换模式无非开启');
    }

}
Guider.prototype.start = function(){
    var self = this;
    console.log('start server 127.0.0.1',this.config.PORT);
    var server = http.createServer(function(request,response){
            self.request = request;
            self.response = response;
            var result = self.handler();
            if(result){
                result.local ? self.staticFileService(result) : self.proxy(result);
                console.log(result);
            }
    }).listen(this.config.PORT);
}
Guider.prototype.handler = function(){
    var self = this,result;
    var parse = url.parse(this.request.url,true);
    var name = parse.pathname;
    if(name !== '/favicon.ico'){
        result = {'type':'HTTP','name':name,'mock':false};
        //识别请求类型，并对请求进行分析与序列化
        this.requeParse(result,parse);
    }
    return result;
}
Guider.prototype.proxy = function(result){
    switch(result.type){
        case 'HTTP':
            this.HTTP(result);
            break
        case 'SOAP':
            this.SOAP(result);
            break
    }
}
Guider.prototype.HTTP = function(result){
    var method = result.method;
    var self = this,isrequest;
    switch(method){
        case 'GET':
            result.cache = Memory(result);
            if(result.cache){
                isrequest = ReadCacheContent.call(self,false,result,true);
            }
            if(isrequest){server.get.call(self,result)}
            server.get.call(self,result);
            break
        case 'POST':
            //根据请求方法 对提交的值进行重新装载
            var data = '';
            this.request.addListener('data',function(box){
                data += box;
            });
            this.request.addListener('end',function(){
                result.body = data;
                result.cache = Memory(result);
                if(result.cache){
                    isrequest = ReadCacheContent.call(self,false,result,true);
                }
                if(isrequest){server.post.call(self,result)}
            });
            break
    }
}
Guider.prototype.SOAP = function(result){
    console.log(result);
}
Guider.prototype.requeParse = function(result,parse){
    var query,local = false,search = parse.search;
    if(search.length){
        query = parse.query;
        local = parseInt(query.local,10);
        //是否开启mock
        result.mock = query.mock ? true : false;
        //请求序列化参数
        result.query = query;
    }
    //通过local属性识别，发送代理请求，还是读取本地文件 false为代理请求，true为读取本地文件
    result.local = local ? true : false;
    //根据头信息进行代理提交
    result.headers = this.request.headers;
    //分析真实请求method
    result.method = result.headers['access-control-request-method'] || this.request.method;
    //生成真实本地文件目录地址或远程代理地址
    if(this.config.TYPE === 'HTTP'){
        try{
            result.URL = result.local ? path.join(this.ROOT,this.REQUEST[result.method][result.name]) : this.REQUEST[result.method][result.name];
        }catch(e){
            this.error();
            return false;
        } 
    }
    if(this.config.TYPE === 'SOAP'){
        result.URL = this.REQUEST.SOAP[result.name];
        result.type = 'SOAP';
    }
    //请求&参数
    result.search = search;
    //请求不代理读本地文件时返回的状态码 true为文件准备就绪 false为文件不存在或没有权限读取此文件
    result.status = false;
    if(local){
        try{
            var stat = fs.statSync(result.URL);
            result.status = (stat && stat.isFile()) ? true : false;
            result.cache = Memory(result);
        }catch(e){
            console.log('文件无法读取，error:可能文件不存在，或没有权限读取此文件');
        }
    }
}
Guider.prototype.error = function(){
    var response = this.response;
    this.responseHeader();
    this.responseBody("<h1>this request is 404 or handler is bad</h1>");
}
Guider.prototype.responseHeader = function(){
    this.response.writeHead('200',{
        'Access-Control-Allow-Headers':'Content-Type, Accept',
        'Access-Control-Allow-Methods':'GET, POST, PUT, DELETE',
        'Access-Control-Allow-Origin':'*',
        'Access-Control-Max-Age':30 * 24 * 3600
    });
}
Guider.prototype.responseBody = function(body,result){
    var data;
    if(result){
        var _name = result.name.replace('/','');
        if(result.cache){
            data = memory[_name]['data'];
        }else{
            data = memory[_name]['data'] = body;
            //生成文件
            util.createFile.call(this,data,result);
        }
    }
    this.response.end(data||body);
}
Guider.prototype.staticFileService = function(result){
    var self = this;
    if(!result.status){
        this.error();
        return false;
    }
    fs.readFile(result.URL,'utf-8', function(err, template) {
        var json = {};
        try{
            json = result.mock ? Mock.mock(JSON.parse(template)) : JSON.parse(template);
        }catch(e){
            self.error();
        }
        self.responseHeader();
        self.responseBody(JSON.stringify(json, null, 4),result);
    });
}

//server 端代理
var server = {
    get:function(options){
        var self = this;
        var URL = options.URL + (options.search ||'');
        var name = options.name.replace('/','');
        http.get(URL, function(response) {
            var data = '';
            response.on('data',function(d) {
                data += d;
            });
            response.on('end',function(){
                self.responseHeader();
                var CS = ReadCacheContent.call(self,response,options);
                if(!CS){
                    var buf = new buffer.Buffer(data);
                    self.responseBody(buf.toString('utf8'),options);
                }
            });
        }).on('error', function(e){
            ReadCacheContent.call(self,false,options);
            console.log("Got error: " + e.message);
        });
    },
    post:function(options){
        var self = this;
        var urlParse = url.parse(options.URL);
        var headers = util.extend({
            "Content-Length":options.body.length,
            "host":urlParse.host
        },options.headers);
        var optionsParam = {
            method:options.method,
            port:urlParse.port || 80,
            host:urlParse.host,
            path:urlParse.pathname,
            headers:headers
        }
        var reque = http.request(optionsParam,function(response){
            var body = "";
            response.setEncoding('utf8');
            response.on("data",function(chunk){
                body += chunk;
            });
            response.on("end",function(){
                self.responseHeader();
                var CS = ReadCacheContent.call(self,response,options);
                if(!CS){
                    var buf = new buffer.Buffer(body);
                    self.responseBody(buf.toString('utf8'),options);
                }
            });
        });
        reque.on('error',function(e){
            ReadCacheContent.call(self,false,options);
            console.log('problem with request :' + e.message);
        });
        reque.write(options.body);
        reque.end();
    }
}
// 工具函数
var util = {
    createFile:function(body,options){
        var fileConfig = "utf-8";
        var date = new Date();
        var man = date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+'-'+date.getHours()+'-'+date.getMinutes()+'.txt';
        var filePath = path.join(this.ROOT,man);
        var name = options.name.replace('/','');
        memory[name]['physicaladd'] = filePath;
        Queue[name] = {
            "physicaladd":filePath,
            "time":man
        }
        fs.writeFileSync(this.CACHEADDRESS,JSON.stringify(Queue),fileConfig);
        fs.writeFileSync(filePath, body, fileConfig);
    },
    extend:function(obj,of){
        for(var k in obj){
            of[k] = obj[k];
        }
        return of;
    }
}
//队列管理
var Queue = {};
//内存存储
var memory = {};
//内存管理
var memoryManagement = {};

//cache 请求缓存机制，true为缓存不发起请求，false为不缓存，发起请求。
var Memory = function(result){
    //存储机制
    var _key = result.name.replace('/','');
    var _memory_key = memory[_key];
    var calibration = function(){
        var key;
        switch(result.method){
            case'GET':
                key = result.URL + result.search;
                break
            case'POST':
                key = result.URL + result.body;
                break
        }
        return key;
    }
    if(_memory_key){
        var _memory_key_ = calibration();
        var _sha = crypto.createHash('sha1');
        _sha.update(_memory_key_);
        var _shakey = _sha.digest('hex');
        _memory_key.status = true;
        memoryManagement[_key].index += 1;
        return _shakey == _memory_key.shakey ? true : false;
    }
    var sha = crypto.createHash('sha1');
    var _sha_key_ = calibration();
    sha.update(_sha_key_);
    memory[_key] = {
        "url":result.URL,
        "body":result.body,
        "query":result.query,
        "search":result.search,
        "shakey":sha.digest('hex'),   //sha 检校前后比对URL地址，GET POST提交参数是否发生改变
        "status":false  //是否是第一次发进来的请求
    }
    memoryManagement[_key] = {
        "index":0
    }
    return false;
}

//读取缓存 识别是否 第一次请求，如果是第一次请求识别状态码，如果状态错误。
//识别队列中当前请求是否存在，如果不存在则重新读取本地配置文件，如果配置文件中队列的请求也不存在。
//返回远程服务，如果前两种有任意一种存在则响应最新一次的缓存内容。

var ReadCacheContent = function(response,options,cache){
    var self = this;
    var name,key,ism,handlerStatus,cache = cache,pon = response;
    var isMemory = function(){
        name = options.name.replace('/','');
        key = memory[name];
        if(!key){
            return false;
        }
        self.responseBody(key['data']);
        return true;
    }
    var isReadFile = function(){
        fs.readFile(self.CACHEADDRESS,function(err,data){
            if(err) throw err;
            var buf = new buffer.Buffer(data);
            var configJOSN = JSON.parse(buf.toString('utf8'));
            callback(cacheconfig);
        });
    }
    var _memory_readfile_ = function(lock){
        ism = isMemory();
        if(ism){
            return true;
        }
        if(!self.READCACHE){
            isReadFile(function(cacheconfig){
                console.log('the last cache file time is ',cacheconfig.time);
                fs.readFile(cacheconfig.physicaladd,function(err,data){
                    if(err) throw err;
                    var buf = new buffer.Buffer(data);
                    self.responseBody(buf.toString('utf8'));
                });
            });
            return true;
        }
        if(!lock){
            self.responseBody('<h1>this request proxy to server is bad !! you need cache.json or your memory\'s data not empty !!!</h1>');
        }
        return false;
    }
    if(!pon){
        handlerStatus = _memory_readfile_(cache||false);
        return handlerStatus;
    }
    var code = response.statusCode;
    if(code > 400 && code < 550){
        handlerStatus = _memory_readfile_(true);
        return handlerStatus;
    }
}

//定时任务器
setInterval(function(){
    /**
    *  处理队列，内存管理，根据memoryManagement打分机制，释放使用率最低的内存缓存，两小时启动一次。
    */

},1000*60*2);

var glob = module.exports = {};
glob.Config = function(config){
    var app = new Guider(config);
    app.start();
}