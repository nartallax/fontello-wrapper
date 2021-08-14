import {saveEndpointName, wrapperHttpPort, wrapperUrlsPrefix} from "consts";
import * as Http from "http";
import {Config} from "config";
import {FontelloSession} from "fontello_session";
import {doOnSave} from "on_save";

export class WrapperHttpServer {
	private readonly server: Http.Server;
	private started = false;

	constructor(private readonly config: Config, private readonly session: FontelloSession){
		this.server = Http.createServer((req, res) => this.handleRequest(req, res))
	}

	private async handleRequest(req: Http.IncomingMessage, res: Http.ServerResponse): Promise<void>{
		try {
			let url = new URL(req.url || "", "http://localhost:" + wrapperHttpPort);
			let pathParts = url.pathname.split("/").filter(x => !!x);

			let isWrapperCall = pathParts[0] === wrapperUrlsPrefix;

			res.statusCode = 200;

			if((req.method || "GET").toUpperCase() === "GET"){

				if(isWrapperCall && pathParts[1] === saveEndpointName){
					await doOnSave(this.config, this.session);
					res.setHeader("Location", this.session.url);
					res.setHeader("Cache-Control", "no-cache");
					res.statusCode = 302;
					res.end("Done, go back to gui");
					void this.config;
					return
				}

			}

			res.statusCode = 400
			res.end("What?")
			return;

		} catch(e){
			console.error(e.stack || e.message || e);
			res.statusCode = 500;
			res.end(e.stack || e.message || e);
		}
	}

	start(): Promise<void>{
		this.started = true;
		return new Promise((ok, bad) => {
			let onErr = (err: Error) => {
				this.server.off("error", onErr);
				bad(err);
			}

			this.server.on("error", onErr);

			this.server.listen(wrapperHttpPort, () => {
				this.server.off("error", onErr);
				ok();
			});
		})
	}

	stop(): Promise<void> {
		if(!this.started){
			return Promise.resolve();
		}
		this.started = false
		return new Promise((ok, bad) => {
			this.server.close(err => err? bad(err): ok());
		})
	}

}