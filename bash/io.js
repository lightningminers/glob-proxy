var fs = require('fs');
var path = require('path');
var buffer = require('buffer');
var crypto = require('crypto');


var io = module.exports = {}

io.fiddler_need_xml = function(_path,keyword){
    if(!_path) return false;
    try{
        var file = fs.readFileSync(_path,"utf-8");
    }catch(e){
        console.log('读取文件出错');
        return false;
    }
    var line = file.split(/\n|\r/);
    var addre = /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/mi;
    var recruise = new RegExp(keyword||'cruise','gi');
    var mapping = {};
    var set_url = [];
    file.forEach(function(line,i){
        if(line.length > 10 && addre.test(line) && recruise.test(line)){
            var matchurls = line.match(addre);
            var shakey = crypto.createHash('sha');
            shakey.update((Math.random(0)*100)+i+matchurls);
            mapping['/'+shakey.digest('hex')] = matchurls[0];
            set_url.push(matchurls[0]);
        }
    });
    // io.createsync()
}

io.proxy_need_json = function(){

}

io.readsync = function(_path){
    var data = false;
    try{
        var file = fs.readFileSync(_path,"utf-8");
        data = JSON.parse(file);
    }catch(e){
        process.stdout.write('无法读取文件或转换JSON错误，请仔细检查配置文件');
    }
    return data;
}

io.createsync = function(_path,body){
    try{
        fs.writeFileSync(_path,body,'utf-8');
    }catch(e){
        console.log('无法生成',_path,'文件');
    }
}