#Glob-proxy.js

在工作中，经常遇见一个问题，服务端的开发总是比前端开发要慢很多，于是我们需要在本地模拟数据，但是现实往往让我们出人意料，我的数据模拟可能在另一个环境中，而我的开发环境，需要请求数据时，就发生了跨域的问题。而且，来来回回在改地址，我会非常的纠结，于是写下了这个，基于nodejs的web代理，来对请求进行处理。下午抽了些时间，对代码进行了整理，现在仅支持对GET POST的代理。

## Download
源代码可以在[Github]()上进行下载，也可以使用npm包管理器进行安装

	npm install glob-proxy
## Use

	var glob = require('glob-proxy');
	glob.Config({
	'PORT':'8084',
	'REQUEST':{
		'GET':{
			'/github':'/index.json'
		},
		'POST':{
			'/github':'/index.json',
			'/django':'http://restapi.cruises/CruiseService.svc/GetBookingInfo'
		}
	}
	'MOCK':false,
	'TYPE':'HTTP',
	'ROOT':'D:\\Github'
	});

## Config

>
>PORT start server port 启动服务器端口号
>
>MOCK 设置为true时读取的本地文件将用mock.js来构建数据 false则不使用mock.js来构建
>
>TYPE 处理请求时，按什么类型来处理	
>
>ROOT 配置读取本地文件的跟目录
>
>REQUEST 配置请求映射
>
>GET POST 请求
>

默认开启请求代理，一个真实的请求将根据请求映射，请求出去。如果需要读取本地文件，在URL中加上?local=xx，把local参数开启为true即可。


未来改进：

	
1. 支持restful风格的其他method，如PUT DELETE
2. 支持从后台提交SOAP
3. 指定静态资源
4. 对请求进行缓存的机制






