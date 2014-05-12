#Glob-proxy.js

在工作中，经常遇见一个问题，服务端的开发总是比前端开发要慢很多，于是我们需要在本地模拟数据，但是现实往往让我们出人意料，我的数据模拟可能在另一个环境中，而我的开发环境，需要请求数据时，就发生了跨域的问题。而且，来来回回在改地址，我会非常的纠结，于是写下了这个，基于nodejs的web代理，来对请求进行处理。下午抽了些时间，对代码进行了整理，现在仅支持对GET POST的代理。

## Download
源代码可以在[Github](https://github.com/lcepy/glob-proxy)上进行下载，也可以使用npm包管理器进行安装

	npm install glob-proxy

##了解Glob-proxy有什么用，能解决什么问题

默认第一次启动服务器时，会读取一个cache.json配置文件，并根据具体的请求映射查找配置文件中是否存在已久缓存过的物理文件路径。如果存在，将瞬间响应这个请求。第二次，若无发生参数，URL地址的变化，将响应内存中缓存的元数据。若无此文件，将正常发起一次远程请求。

默认情况下请求是开启远程代理的，这意味着一个真实的请求将根据请求映射提交到远程。内部只会维护对远程请求的缓存，包括内存缓存，物理缓存，并对URL地址与提交的参数，进行生成shakey来进行维护。当URL地址，请求参数发生变化时，工具会将请求提交到远程，并将对内存进行更新，生成一个时间戳的物理文件。

内存释放机制，内部会维护一个打分列表，记录请求使用的次数。两小时启动一次内存释放定时器，当满足，缓存条数超过20时，会基于打分的分数进行排序，并把分数较低的一半，释放。

对远程响应错误时的处理，这在测试环境中是经常出现的。第一次真实请求发生时，会在内部维护几个地方，已保证在测试环境响应错误时，或者接口直接爆掉的情况下，能不影响前端的开发进度。如果cache.json配置文件存在，则第一次启动服务器时，优先读取最后一次缓存的物理文件。如果第一次真实请求发送成功，在第二次发送请求时出现了错误状态，则优先从内存中读取相应的数据，如果内存中不存在，则读取最后一次存储的物理文件，如果文件也不存在，则返回错误状态。在这中间，内部都会维护相应的调度，URL地址，提交参数是否有变化，如果有变化将重新请求远程。


## Use
新建index.js文件    

    touch index.js   

(windows 用户参考如下)	
    
    var glob = require('./src/glob-proxy');

	glob.use('PORT','8084');
	glob.use('TYPE','HTTP');
	glob.use('ROOT','E:\\localenv');
	glob.use('REQUEST',{
		"GET":{
			"/github":"/mock.json",
			"/under":"http://underscorejs.org/"
		},
		"POST":{
			"/django":"http://xxxxxx"
		}
	})
	glob.initialize();

(Mac OSX 用户参考如下)

	var glob = require('./src/glob-proxy');


	glob.use('PORT','8084');
	glob.use('TYPE','HTTP');
	glob.use('ROOT','/User/xxx');
	glob.use('REQUEST',{
		"GET":{
			"/github":"/mock.json",
			"/under":"http://underscorejs.org/"
		},
		"POST":{
			"/django":"http://xxxxxx"
		}
	})
	glob.initialize();

运行node index.js, 在浏览器中访问 <http://127.0.0.1/github?local=1&mock=1&enforce=1>

glob.use()  添加参数

glob.initialize()  启动

## Client

客户端必要的条件
	
1. 是一款现代的浏览器，支持H5请求跨域头。

'Access-Control-Allow-Headers':'Content-Type, Accept',

'Access-Control-Allow-Methods':'GET, POST, PUT, DELETE',

'Access-Control-Allow-Origin':'*',

在发起ajax请求时，需要配置上述三项，相应的请求跨域头。如果不是使用客户端，代理不受影响。

## Start Config

>
>PORT start server port 启动服务器端口号
>
>TYPE 处理请求时，按什么类型来处理	
>
>ROOT 配置读取本地文件的跟目录
>
>REQUEST 配置请求映射
>
>GET POST 请求
>
>URL 上local，mock，enforce参数是有意义的
>
>local 传入任意参数描述开启读取本地文件
>
>mock 传入任意参数描述开启使用mock构建元数据
>
>enforce 传入任意参数描述开启强制刷新请求，每一次的请求都会提交远程并内存缓存与物理缓存
>


未来改进：

	
1. 支持restful风格的其他method，如PUT DELETE
2. 支持从后台提交SOAP
3. 指定静态资源






