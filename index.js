require('dotenv').config({silent : true});
var http = require('http');
var request = require('request');

var urlRegex = /^https?/;
var sizeLimit = process.env.SIZE_LIMIT || 512 * 1024;
var requestsLimit = process.env.REQ_LIMIT || 15000;
var copyHeaders = ['user-agent', 'content-type'];
var reqIPs = [];


function createRequesHeaders(headers) {
  var res = {};

  Object.keys(headers).forEach(function(header) {
    if (copyHeaders.indexOf(header) !== -1) {
      res[header] = headers[header];
    }
  });

  return res;
}

var getClientAddress = function (req) {
        return (req.headers['x-forwarded-for'] || '').split(',')[0]
        || req.connection.remoteAddress;
}

function wrongURI(res) {
  res.setHeader('Content-type', 'text/html');
  res.writeHead(404);
  res.end('<h1>Wrong request.</h1><p>For more info check out the spec:' +
  ' <a href="http://google.com">http://google.com</a></p>');
}

function banner(res) {
  res.setHeader('Content-type', 'text/html');
  res.writeHead(200);
  res.end('<h1>zZz</h1><p><a href="https://google.com/">' +
    'https://google.com</a></p>');
}



  if (reqIPs.filter(function(r) { return r.ip === ip; }).length >= requestsLimit) {
    return true;
  }

  reqIPs.push({ ip : ip , time : time});

  return false;
}

http.createServer(function (req, res) {
  var url = req.url.slice(1);

  if (!urlRegex.test(url)) {
    if (url.length < 1) {
      banner(res);
    } else {
      wrongURI(res);
    }
    return;
  }

  var size = 0;
  var time = new Date();


 
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-type');
  res.setHeader('Access-Control-Allow-Credentials', false);

  var options = {
     url :  url,
    encoding: null,
    headers : createRequesHeaders(req.headers)
  }

  var client = request(options, function(error, response, body) {
    if (!error) {
      res.setHeader('Content-type', response.headers['content-type'] || 'text/plain');
      res.setHeader('Date', response.headers['date'] || time.toString());
      res.writeHead(Number(response.statusCode));
      res.write(body);
      res.end();
    } else {
      res.writeHead(500);
      res.end('err');
    }
  });

  client.on('data', function(chunk) {
    size += chunk.length;
     if (size >= sizeLimit) {
       limitExceed(res);
       client.abort();
     }
  });

}).listen(process.env.PORT)
