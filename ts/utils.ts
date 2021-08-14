import * as Stream from "stream";
import * as Http from "http";

export function readAllStream(stream: Stream.Readable): Promise<Buffer>{
	return new Promise((ok, bad) => {
		let chunks = [] as Buffer[];
		stream.on("error", bad);
		stream.on("data", chunk => chunks.push(chunk));
		stream.on("end", () => ok(Buffer.concat(chunks)));
	});
}

export function httpReq(opts: {url: string, method?: string, body?: string | Buffer, headers?: Http.OutgoingHttpHeaders}): Promise<{body: Buffer}> {
	return new Promise((ok, bad) => {
		let url = new URL(opts.url);

		let req = Http.request({
			method: opts.method,
			host: url.hostname,
			port: url.port,
			path: url.pathname,
			search: url.search,
			headers: opts.headers
		}, res => {
			if(res.statusCode !== 200){
				readAllStream(res).then(body => {
					bad(new Error("Bad HTTP code for " + opts.url + ": " + res.statusCode + "; response body is " + body.toString("utf-8")));
				}, bad)
				//bad(new Error("Bad HTTP code for " + opts.url + ": " + res.statusCode));
				return;
			}

			readAllStream(res).then(resp => ok({body: resp}), bad);
		});

		if(opts.body){
			req.end(opts.body)
		} else {
			req.end();
		}
	})

	
}

export interface MultipartBodySource {
	[paramName: string]: {
		value: string | Buffer;
		contentType?: string;
		filename?: string;
	}
}

function quoteValue(x: string): string {
	return "\"" + x.replace(/\\/g, "\\\\").replace(/"/, "\\\"") + "\""
}

export function formMultipartBody(parts: MultipartBodySource): {body: Buffer, headers: Http.OutgoingHttpHeaders } {
	let boundary = "------------------------"
		+ Math.round(Math.random() * 0xffffffff).toString(16)
		+ Math.round(Math.random() * 0xffffffff).toString(16);

	let body = "";
	for(let partName in parts){
		let part = parts[partName];
		body += "--" + boundary + "\r\n";

		body += "Content-Disposition: form-data; name=" + quoteValue(partName);
		if(part.filename){
			body += "; filename=" + quoteValue(part.filename)
		}
		body += "\r\n"
		
		if(part.contentType){
			body += "Content-Type: " + part.contentType + "\r\n"
		}
		body += "\r\n";

		body += typeof(part.value) === "string"? part.value: part.value.toString("utf-8")
		body += "\r\n"
	}

	body += "--" + boundary + "--\r\n"

	return {
		body: Buffer.from(body, "utf-8"),
		headers: {
			"Content-Type": "multipart/form-data; boundary=" + boundary
		}
	}
}

export function bufferToReadableStream(data: Buffer): Stream.Readable {
	let readable = new Stream.Readable()
	readable._read = () => {
		// _read is required but you can noop it
	}
	readable.push(data)
	readable.push(null)
	return readable
}

export function maybeArrayToArray<T>(x: T | T[] | undefined): T[]{
	if(x === undefined){
		return [];
	} else if(Array.isArray(x)) {
		return x;
	} else {
		return [x];
	}
}