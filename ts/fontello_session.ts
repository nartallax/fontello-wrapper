import {FontelloInstance} from "fontello_instance";
import {httpReq, readAllStream} from "utils";
import * as Open from "open";
import * as Unzipper from "unzipper";
import {bufferToReadableStream} from "utils";

export interface FontelloFontAssembly {
	config: Buffer;
	woff2: Buffer;
	woff: Buffer;
	ttf: Buffer;
	eot: Buffer;
	codesCss: Buffer;
}

function checkNotNull<T>(name: string, value: T | null): T {
	if(value === null){
		throw new Error("Absent " + name);
	}
	return value
}

function extractFontAssembly(zipContent: Buffer): Promise<FontelloFontAssembly>{
	return new Promise((ok, bad) => {
		let zipStream = bufferToReadableStream(zipContent).pipe(Unzipper.Parse());

		let promises: Promise<void>[] = [];

		let woff2: Buffer | null = null;
		let woff: Buffer | null = null;
		let eot: Buffer | null = null;
		let ttf: Buffer | null = null;
		let config: Buffer | null = null;
		let codesCss: Buffer | null = null;

		zipStream.on("error", bad);

		zipStream.on("entry", (entry: Unzipper.Entry) => {
			let filePath = entry.path;
			let type = entry.type as "Directory" | "File";
			if(type !== "File"){
				entry.autodrain();
				return;
			}

			const filenameMatch = filePath.match(/[\\/]([^\\/]+)$/)
			if(!filenameMatch){
				entry.autodrain();
				return;
			}

			promises.push((async () => {
				let body = await readAllStream(entry);
				switch(filenameMatch[1]){
					case "fontello.woff2": woff2 = body; return;
					case "fontello.woff": woff = body; return;
					case "fontello.eot": eot = body; return;
					case "fontello.ttf": ttf = body; return;
					case "config.json": config = body; return;
					case "fontello-codes.css": codesCss = body; return;
				}
			})());
		});

		let complete = async () => {
			await Promise.all(promises);
			ok({
				woff: checkNotNull("woff", woff),
				woff2: checkNotNull("woff2", woff2),
				eot: checkNotNull("eot", eot),
				ttf: checkNotNull("ttf", ttf),
				codesCss: checkNotNull("codes css", codesCss),
				config: checkNotNull("config", config)
			})
		}

		zipStream.on("close", complete);
		zipStream.on("end", complete);
	})
}

export class FontelloSession {
	constructor(private readonly fontello: FontelloInstance, readonly id: string){}

	get url(): string {
		return `http://localhost:${this.fontello.getPort()}/${this.id}`
	}

	openWebGui(): void {
		Open(this.url);
	}

	async build(): Promise<FontelloFontAssembly>{
		let httpResp = await httpReq({ url: this.url + "/get" });
		return await extractFontAssembly(httpResp.body);
	}
}