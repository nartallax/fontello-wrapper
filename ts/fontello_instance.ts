import * as ChildProcess from "child_process";
import * as Readline from "readline";
import * as Path from "path";
import {formMultipartBody, httpReq} from "utils";
import {saveEndpointName, wrapperHttpPort, wrapperUrlsPrefix} from "consts";
import {FontelloSession} from "fontello_session";

// fontello it requires SOME config to start with. empty config is not an option.
// so, here it is. default config, as empty as it can get
// contains only one check icon
const defaultAlmostEmptyConfigContent = `{"name":"","css_prefix_text":"icon-","css_use_suffix":false,"hinting":true,"units_per_em":1000,"ascent":850,"glyphs":[{"uid": "in76hg99crrkpcbz2rjnmgbiw74s72y0","css": "ok","code": 59392,"src": "modernpics"}]}`;

export class FontelloInstance {

	private port: number | null = null;
	private process: ChildProcess.ChildProcess | null = null;
	constructor(private readonly executablePath: string){}

	start(): Promise<void> {
		return new Promise((ok, bad) => {
			let onErr = (err: Error) => {
				proc.off("error", onErr);
				bad(err);
			}

			const proc = this.process = ChildProcess.spawn(process.argv[0], [this.executablePath], {
				cwd: Path.dirname(this.executablePath),
				stdio: ["ignore", "pipe", "inherit"]
			});
			proc.on("error", onErr);
			let rl = Readline.createInterface(proc.stdout);
			rl.on("line", line => {
				console.error(line);
				let match = line.match(/^.*? Listening on \S+?:(\d+)/)
				if(match){
					this.port = parseInt(match[1]);
					ok();
				}
			});

			proc.on("exit", (code, signal) => {
				this.port = null;
				if(this.process){
					console.error("Fontello process unexpectedly exited " + (signal? "with signal " + signal: "with code " + code));
					this.process = null;
					bad(new Error("Unexpected Fontello process exit"));
				}
			});
		});

	}

	stop(): void {
		let proc = this.process;
		this.process = null;
		if(proc){
			proc.kill("SIGKILL");
		}
	}

	getPort(): number {
		if(!this.port){
			throw new Error("Cannot get Fontello web interface port: not started.");
		}

		return this.port;
	}

	async createSession(configContent: Buffer | null): Promise<FontelloSession>{
		let body = formMultipartBody({
			config: {
				value: configContent || defaultAlmostEmptyConfigContent,
				contentType: "application/json",
				filename: "config.json"
			},
			url: {
				value: `http://localhost:${wrapperHttpPort}/${wrapperUrlsPrefix}/${saveEndpointName}`
			}
		})
		let result = await httpReq({
			url: `http://localhost:${this.getPort()}/`, 
			method: "POST", 
			body: body.body, 
			headers: body.headers
		});
		let id = result.body.toString("utf-8");
		return new FontelloSession(this, id);
	}

}