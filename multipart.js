/**
    SendGrid Inbound Parse Multipart Parser (Finite State Machine)
    NOTE: It's only be tested for SendGrid's Inbound Parse multipart/form-data.
	usage:
	var multipart = require('multipart.js');
	// var body = multipart.DemoData(); 						   // raw body
	var body = Buffer.from(req.rawBody),'utf-8'); // Azure SendGrid Inbound Parsed data case
	
	var boundary = multipart.getBoundary(req.headers['content-type']);
	var parts = multipart.Parse(body,boundary);
	
	// each part is:
    // { name: 'text', data: 'AAAABBBB' }
    
    This parser was modified from Cristian's parse-multipart.
	original author:  Cristian Salazar (christiansalazarh@gmail.com) www.chileshift.cl
             Twitter: @AmazonAwsChile
 */
exports.Parse = function(multipartBodyBuffer,boundary){
	var process = function(part){
		// will transform this object:
		// { 
        //   header: 'Content-Disposition: form-data; name="text"',
        //	 buffer: <Buffer 41 41 41 41 42 42 42 42>
        // }
        //
		// into this one:
		// { 
        //   name: 'text',
        //   data: 'AAAABBBB'
        // }
		var obj = function(str){
			var k = str.split('=');
			var a = k[0].trim();
			var b = JSON.parse(k[1].trim());
			var o = {};
			Object.defineProperty( o , a , 
			{ value: b, writable: true, enumerable: true, configurable: true })
			return o;
		}
		var header = part.header.split(';');		
		var name = obj(header[1]);		
		Object.defineProperty( name , 'data' , 
			{ value: Buffer.from(part.buffer).toString(), writable: true, enumerable: true, configurable: true })
		return name;
	}
	var lastline='';
    var header = '';
    var state=0;
	var allParts = [];

	for(i=0;i<multipartBodyBuffer.length;i++){
		var oneByte = multipartBodyBuffer[i];
		var prevByte = i > 0 ? multipartBodyBuffer[i-1] : null;
		var newLineDetected = ((oneByte == 0x0a) && (prevByte == 0x0d)) ? true : false;
		var newLineChar = ((oneByte == 0x0a) || (oneByte == 0x0d)) ? true : false;

		if(!newLineChar)
			lastline += String.fromCharCode(oneByte);

		if((0 == state) && newLineDetected){
			if(("--"+boundary) == lastline){
				state=1;
            }
			lastline='';
		}else
		if((1 == state) && newLineDetected){
            header = lastline;
			state=2;
			lastline='';
		}else
		if((2 == state) && newLineDetected){
            buffer=[];
			state=3;
			lastline='';
		}else
		if(3 == state){
            if(lastline.length > (boundary.length+4)) lastline=''; // mem save
			if(((("--"+boundary) == lastline))){
				var j = buffer.length - lastline.length;
				var data = buffer.slice(0,j-1);
				var p = { header : header, buffer: Buffer.from(data)  };
				allParts.push(process(p));
				buffer = []; lastline=''; state=4; header=''; info='';
			}else{
				buffer.push(oneByte);
			}
			if(newLineDetected) lastline='';
		}else
		if(4==state){
			if(newLineDetected)
				state=1;
		}
	}
	return allParts;
};

//  read the boundary from the content-type header sent by the http client
//  this value may be similar to:
//  'multipart/form-data; boundary=xYzZY',
exports.getBoundary = function(header){
	var items = header.split(';');
	if(items)
		for(i=0;i<items.length;i++){
			var item = (new String(items[i])).trim();
			if(item.indexOf('boundary') >= 0){
				var k = item.split('=');
				return (new String(k[1])).trim();
			}
		}
	return "";
}

exports.DemoData = function(){
    body = "--xYzZY\r\n"
    body += "Content-Disposition: form-data; name=\"html\"\r\n\r\n"
    body += "<div dir=\"ltr\">This is the message body sent from an email.</div>\r\n"
    body += "--xYzZY\r\n"
    body += "Content-Disposition: form-data; name=\"from\"\r\n\r\n"
    body += "Allistair Vilakazi <allistair.vilakazi@gmail.com>\r\n"
    body += "--xYzZY\r\n"
    body += "Content-Disposition: form-data; name=\"text\"\r\n\r\n"
    body += "This is the message body sent from an email.\r\n"
    body += "--xYzZY--"
    return (Buffer.from(body,'utf-8')); 
	// returns a Buffered payload, so the it will be treated as a binary content.
};

exports.DemoContentType = 'multipart/form-data; boundary=xYzZY';
