var buffer = require('buffer');
var crypto = require('crypto');
var repl = require('repl');


var shell = module.exports = {}

shell.exit = function(){
    var stage = true;
    process.on('SIGINT', function() {
        if(stage){
            stage = false;
            process.stdout.write('need exit this service ? Y/N : ');
            process.stdin.resume();
            process.stdin.setEncoding('utf8');
            process.stdin.on('data',function(chunk){
                var chunk = chunk.toString().replace(/\n/,'');
                process.stdin.pause();
                /**
                    问题描述 chunk 数据流？buffer转换不了，长度2；

                    在debug中如果输入y，chunk 为"y"  typeof 为string chunk=='y' 为false 


                    搞不明白！！
                */
                process.exit();
            });
            process.stdin.on('end',function(){
                process.stdout.write('end');
            });
        }
    });
}
