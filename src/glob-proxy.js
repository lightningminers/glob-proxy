var http = require('http');
var fs = require('fs');
var url = require('url');
var Mock = require("mockjs");
var path = require('path');
var net = require('net');
var buffer = require('buffer');
var crypto = require('crypto');

//内部变量 KEY
var __NAME__;
//队列管理
var queue = {};
//内存存储
var memory = {};
//内存管理
var memoryManagement = {};

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
        self.READCACHE = !!(cachefs&&cachefs.isFile());
    }catch(e){
        console.log('无法读取配置文件，在错误来临时，自动转换模式无非开启');
    }
    /**
    * 问题描述：如何在接口爆的状态下，自动识别读取本地文件。第一次启动时。
    */
    if(self.READCACHE){
        var fileData = fs.readFileSync(self.CACHEADDRESS,'utf8');
        try{
            self.FIRSTREADCONTENT = JSON.parse(fileData);
        }catch(e){
            console.log('配置文件读取不正确，无法开启自动转换模式');
        }
    }
}
Guider.prototype.start = function(){
    var self = this;
    console.log('start server 127.0.0.1',this.config.PORT);
    var server = http.createServer(function(request,response){
            self.request = request;
            self.response = response;
            console.log('-----------^^^^^^^^^^-------- REQUEST');
            var result = self.handler();
            console.log('URL : ',result.URL)
            if(result){
                result.local ? self.staticFileService(result) : self.proxy(result);
            }
    }).listen(this.config.PORT);
}
Guider.prototype.handler = function(){
    var self = this,result;
    var parse = url.parse(this.request.url,true);
    var name = parse.pathname;
    if(name !== '/favicon.ico'){
        __NAME__ = name.replace('/','');
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
    var self = this;
    var handlerMemoryandfirstrequest = function(){
        //识别是否是第一次请求
        if(self.FIRSTREADCONTENT && !result.enforce && !(memoryManagement[__NAME__].index > 0)){
            console.log('is FIRSTREADCONTENT : true');
            console.log(self.FIRSTREADCONTENT[__NAME__].cachePhysical)
            try{
                var cachefs = fs.readFileSync(self.FIRSTREADCONTENT[__NAME__].cachePhysical,'utf8');
            }catch(e){
                console.log('物理文件不存在，继续发起请求');
            }
            if(cachefs){
                self.responseHeader();
                self.responseBody(cachefs,false,true);
                return true;
            }
        }
        return false;
    }
    //处理强制刷新
    var handlerenforcerequest = function(option){
        var isenforce = !!result.enforce;
        if(result.cache && !isenforce){
            ReadCacheContent.call(self,false,true);
            return;
        }
        if(isenforce){
            result.cache = false;
            server[option].call(self,result);
            return;
        }
        server[option].call(self,result);
    }
    switch(method){
        case 'GET':
            //对内存装载
            result.cache = Memory(result);
            console.log('GET Param : ',result.search);
            console.log('is cache : ',result.cache);
            var isStop = handlerMemoryandfirstrequest()
            if(isStop){
                return;
            }
            handlerenforcerequest('get');
            break
        case 'POST':
            //根据请求方法 对提交的值进行重新装载
            var data = '';
            this.request.addListener('data',function(box){
                data += box;
            });
            this.request.addListener('end',function(){
                result.body = data;
                //对内存装载
                result.cache = Memory(result);
                console.log('POST Param : ',result.body);
                console.log('is cache : ',result.cache);
                var isStop = handlerMemoryandfirstrequest()
                if(isStop){
                    return;
                }
                handlerenforcerequest('post');
            });
            break
    }
}
Guider.prototype.SOAP = function(result){
    //console.log(result);
}
Guider.prototype.requeParse = function(result,parse){
    var query,local = false,search = parse.search;
    if(search.length){
        query = parse.query;
        local = parseInt(query.local,10);
        //是否开启mock
        result.mock = !!query.mock;
        //是否强制请求
        result.enforce = !!query.enforce;
        //请求序列化参数
        result.query = query;
    }
    //通过local属性识别，发送代理请求，还是读取本地文件 false为代理请求，true为读取本地文件
    result.local = !!local;
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
            result.status = !!(stat && stat.isFile());
            result.cache = Memory(result);
        }catch(e){
            console.log('文件无法读取，error:可能文件不存在，或没有权限读取此文件');
        }
    }
}
Guider.prototype.error = function(){
    var response = this.response;
    this.responseHeader();
    this.responseBody('<h1>this request proxy to server is bad !! you need cache.json or your memory\'s data not empty !!!</h1>');
}
Guider.prototype.responseHeader = function(){
    this.response.writeHead('200',{
        'Access-Control-Allow-Headers':'Content-Type, Accept',
        'Access-Control-Allow-Methods':'GET, POST, PUT, DELETE',
        'Access-Control-Allow-Origin':'*',
        'Access-Control-Max-Age':30 * 24 * 3600
    });
}
Guider.prototype.responseBody = function(body,result,firstRequestCode){
    var data;
    if(!firstRequestCode){
        if(result){
            if(result.cache){
                data = memory[__NAME__]['data'];
            }else{
                data = memory[__NAME__]['data'] = body;
                if(!result.local){
                    //生成 物理缓存文件
                    util.createFile.call(this,data,result);
                }
            }
        }
    }else{
        memory[__NAME__]['data'] = body;
    }
    this.responseHeader();
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
        var name = __NAME__;
        http.get(URL, function(response) {
            var data = '';
            response.on('data',function(d) {
                data += d;
            });
            response.on('end',function(){
                var CS = options.enforce ? false : ReadCacheContent.call(self,response);
                if(!CS){
                    var buf = new buffer.Buffer(data);
                    var str = buf.toString('utf8');
                    self.responseBody(str,options);
                }
            });
        }).on('error', function(e){
            ReadCacheContent.call(self,false);
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
                var CS = options.enforce ? false : ReadCacheContent.call(self,response);
                if(!CS){
                    var buf = new buffer.Buffer(body);
                    var str = buf.toString('utf8');
                    self.responseBody(str,options);
                }
            });
        });
        reque.on('error',function(e){
            ReadCacheContent.call(self,false);
            console.log('problem with request :' + e.message);
        });
        reque.write(options.body);
        reque.end();
    }
}

// 工具函数
var util = {
    createFile:function(body){
        var fileConfig = "utf-8";
        var date = new Date();
        var man = date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+'-'+date.getHours()+'-'+date.getMinutes();
        var filePath = path.join(this.ROOT,man+'.txt');
        var name = __NAME__;
        memory[__NAME__]['cachePhysical'] = filePath;
        queue[__NAME__] = {
            "cachePhysical":filePath,
            "time":man
        }
        fs.writeFileSync(this.CACHEADDRESS,JSON.stringify(queue),fileConfig);
        fs.writeFileSync(filePath, body, fileConfig);
    },
    extend:function(obj,of){
        for(var k in obj){
            of[k] = obj[k];
        }
        return of;
    }
}


//cache 请求缓存机制，true为缓存不发起请求，false为不缓存，发起请求。
var Memory = function(result){
    //存储机制
    var _key = __NAME__;
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
        var _memory_status = (_shakey == _memory_key.shakey) ? true : false;
        if(!_memory_status){
            _memory_key.shakey = _shakey;
        }
        return _memory_status;
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

var ReadCacheContent = function(pon,cache){
    var self = this;
    var key,ism,cache = cache,pon = pon;
    var isMemory = function(){
        key = memory[__NAME__];
        if(!key){
            return false;
        }
        console.log('is read memory cache : true');
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
                console.log('is read rhysical file cache : true');
                fs.readFile(cacheconfig.cachePhysical,function(err,data){
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
        return _memory_readfile_(cache||false);
    }
    var code = pon.statusCode;
    if(code > 400 && code < 550){
        return _memory_readfile_(true);
    }
    return false;
}

//定时任务器
setInterval(function(){
    console.log('-------------------^^^^^^ memoryManagement');
    // 释放内存临界点多余二十条存储时
    var criticalPoint = 20 ,copy = [],i=0,to = memoryManagement[__NAME__].index;
    for(var k in memoryManagement){
        i++
        if(i > criticalPoint){
            criticalPoint = false;
            console.log('start memoryManagement delete');
            break;
        }
    }
    if(!criticalPoint){
        for(var v in memoryManagement){
            if(memoryManagement[v].index > to){
                copy.push(memoryManagement[v]);
            } 
            if(memoryManagement[v].index < to){
                copy.unshift(memoryManagement[v]);
            }
        }
    }
    for(var r = 0,len = copy.length;r<len;r++){
        if(r === (len/2)){
            break;
        }
        var manage = copy[r];
        for(var key in manage){
            delete memory[key];
            delete memoryManagement[key];
            console.log('delete memory : ',key);
            console.log('delete memoryManagement : ',key);
            if(query[key]){
                delete query[key];
                console.log('delete query : ',key);
            }
        }
    }
    copy.length = 0;

},1000*60*60*2);

var glob = module.exports = {};
glob.Config = function(config){
    var app = new Guider(config);
    app.start();
}