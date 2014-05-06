var glob = require('./src/glob-proxy');

glob.Config({
	'PORT':'8084',
	'REQUEST':{
		'GET':{
			'/github':'/index.json'
		},
		'POST':{
			'/github':'/index.json',
			'/django':'http://restapi.cruises/CruiseService.svc/GetBookingInfo'
		},
		'SOAP':{
			
		}
	},
	'MOCK':false,
	'TYPE':'HTTP',
	'ROOT':'D:\\Github'
});