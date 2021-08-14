import {Config, EnumerationTypefileDefinition} from "config";
import {FontelloConfig} from "fontello_config";
import {FontelloSession} from "fontello_session";
import {promises as Fs} from "fs";
import {maybeArrayToArray} from "utils";

function minifyCodes(codesCssBinary: Buffer): Buffer {
	let css = codesCssBinary.toString("utf-8");
	css = css
		.replace(/\/\*.*?\*\//g, "")
		.replace(/;/g, "")
		.replace(/[\s\n\r\t]/g, "")
		.replace(/\}/g, "}\n")
	
	return Buffer.from(css, "utf-8");
}

function makeTypefile(definition: EnumerationTypefileDefinition, configBinary: Buffer, codesCssBinary: Buffer): Buffer {
	let config: FontelloConfig = JSON.parse(configBinary.toString("utf-8"));
	let css = codesCssBinary.toString("utf-8");
	let names = (css.match(/\.[^:]+:/g) || []).map(name => {
		name = name.replace(/^\./, "").replace(/:$/, "")
		if(config.css_prefix_text){
			name = name.substring(config.css_prefix_text.length);
		}
		return name;
	});

	let typefile = `export type ${definition.name} = ${names.map(x => `"${x}"`).join(" |\n")}`
	return Buffer.from(typefile, "utf-8");
}

export async function doOnSave(config: Config, session: FontelloSession): Promise<void> {
	let parts = await session.build();

	await Promise.all([
		...maybeArrayToArray(config.fontConfig).map(path => Fs.writeFile(path, parts.config)),
		...maybeArrayToArray(config.enumerationCss).map(path => Fs.writeFile(path, minifyCodes(parts.codesCss))),
		...maybeArrayToArray(config.enumerationTypefile).map(def => {
			let content = makeTypefile(def, parts.config, parts.codesCss);
			return Fs.writeFile(def.path, content)
		}),
		...maybeArrayToArray(config.font).map(path => {
			let ext: string = ((path.match(/\.([^.]+)$/) || [])[1] || "").toLowerCase();
			let body: Buffer;
			switch(ext){
				case "woff2": body = parts.woff2; break;
				case "woff": body = parts.woff; break;
				case "eot": body = parts.eot; break;
				case "ttf": body = parts.ttf; break;
				default: throw new Error("Don't know how to save font file " + path + " : no font with this extension (" + ext + ") is provided by Fontello.");
			}
			return Fs.writeFile(path, body);
		})
	]);

}