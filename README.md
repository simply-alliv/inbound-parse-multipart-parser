# inbound-parse-multipart-parser

A javascript/nodejs multipart/form-data parser which operates on data from SendGrid's Inbound Parse Webhook.

For example, a SendGrid Inbound Parse webhook pointing to an Azure Function

# author

[Cristian Salazar] was the author of the original parser. I, Allistair Vilakazi, just adapted the code to be able to parse the specific multipart/form-data format of SendGrid's Inbound Parse Webhook.

# Background

Sometimes you only have access to the raw multipart payload and it needs to be parsed in order to extract the data contained on it. As an example: an Azure Function, which will operate as a facade between the http client (SendGrid Inbound Parse Webhook) and your response (sending a dynamic email using the SendGrid bindings and it's dynamic template). 

The raw payload formatted as multipart/form-data will looks like this one:

```
...
--xYzZy
Content-Disposition: form-data; name="html"

<div dir=\"ltr\">This is the message body sent from an email.</div>
--xYzZY
Content-Disposition: form-data; name="from"

Allistair Vilakazi <allistair.vilakazi@gmail.com>
--xYzZY
Content-Disposition: form-data; name="text"

This is the message body sent from an email.
--xYzZY--
```

The lines above represents a raw multipart/form-data payload sent by the SendGrid Inbound Parse Webhook via email. We need to extract the all data contained inside it.

# Usage

In the next lines you can see a implementation. In this case two key values
needs to be present:

* body, which can be:

```
--xYzZY
Content-Disposition: form-data; name="text"

This is the message body sent from an email.
--xYzZY--
```

* boundary, the string which serve as a 'separator' between parts, it normally
comes to you via headers. In this case, the boundary is:

```
	xYzZY
```

Now, having this two key values then you can implement it:

```
	var multipart = require('multipart.js');

	var body = Buffer.from(req.rawBody),'utf-8');
	
	var boundary = multipart.getBoundary(req.headers['content-type']);
	var parts = multipart.Parse(body,boundary);
	
	for(var i=0;i<parts.length;i++){
		var part = parts[i];
		// will be:
		// { name: 'text', data: 'This is the message body sent from an email.' }
	}
```

The returned data is an array of parts, each one described by a name and a data, this latter being a String.

