import {fontelloPathFile} from "consts";
import {promises as Fs} from "fs";
import * as Path from "path";
import {Config} from "config";
import {FontelloInstance} from "fontello_instance";
import {WrapperHttpServer} from "http_server";
import {maybeArrayToArray} from "utils";

function errorAndExit(err: string): never {
	console.log(err);
	process.exit(1);
}

async function readFontelloPath(): Promise<string> {
	let fullPathFile = Path.resolve(Path.dirname(Path.resolve(process.argv[1])), fontelloPathFile);

	let fileContent: string;
	try {
		fileContent = await Fs.readFile(fullPathFile, "utf-8");
	} catch(e){
		if(e.code === "ENOENT"){
			errorAndExit("There is no Fontello path file.\nYou should put path to server.js of Fontello into following file:\n" + fullPathFile);
		}
		throw e;
	}

	let fontelloPath = fileContent.trim();
	try {
		await Fs.stat(fontelloPath);
	} catch(e){
		if(e.code === "ENOENT"){
			errorAndExit("Supplied Fontello path is incorrect: " + fontelloPath + "\nYou should put path to server.js of Fontello into following file:\n" + fullPathFile);
		}
		throw e;
	}

	return fontelloPath;
}

async function readConfig(): Promise<Config> {

	function resolve(path: string): string {
		return Path.resolve(configFilePath, path);
	}

	let configFilePath = process.argv[2];
	if(typeof(configFilePath) !== "string"){
		errorAndExit("Wrapper expected path to the wrapper config file to be passed as first command-line argument, but it was not.");
	}

	configFilePath = Path.resolve(configFilePath);
	let fileContent = await Fs.readFile(configFilePath, "utf-8");
	let config: Config = JSON.parse(fileContent);

	config.fontConfig = resolve(config.fontConfig);
	config.font = maybeArrayToArray(config.font).map(resolve);
	config.enumerationCss = maybeArrayToArray(config.enumerationCss).map(resolve);
	config.enumerationTypefile = maybeArrayToArray(config.enumerationTypefile).map(x => {
		x.path = resolve(x.path)
		return x;
	})
	
	return config;

}

let fontello: FontelloInstance | null = null;
let wrapperServer: WrapperHttpServer | null = null;

async function serverMainInternal(){
	let fontelloPath = await readFontelloPath();
	let config = await readConfig();

	fontello = new FontelloInstance(fontelloPath);
	await fontello.start();

	let fontConfig: Buffer | null = null;
	try {
		fontConfig = await Fs.readFile(config.fontConfig);
	} catch(e){
		if(e.code !== "ENOENT"){
			throw e;
		}
	}

	let session = await fontello.createSession(fontConfig);

	wrapperServer = new WrapperHttpServer(config, session);
	await wrapperServer.start();

	session.openWebGui();
}

export async function serverMain(): Promise<void> {
	try {
		await serverMainInternal();
	} catch(e){
		if(fontello){
			await Promise.resolve(fontello.stop());
		}
		if(wrapperServer){
			await wrapperServer.stop();
		}
		errorAndExit(e.stack || e.message || e);
	}
}