/** Contents of configuration file for the wrapper
 * All relative paths are resolved starting at config file directory */
export interface Config {

	/** Where font config should be stored
	 * Font config is, by Fontello definition, a JSON file that contains all the information needed to build the font. */
	fontConfig: string;

	/** Paths where the fonts should be put.
	 * Fonts are matched by extension. So if you end the path with .woff extension, .woff font from the output will be put at that path. */
	font?: string | string[];

	/** Path where icon enumeration CSS file should go.
	 * Note that the file will be minified, as I personally does not see any reason to keep such files beautified.*/
	enumerationCss?: string | string[];

	/** A definiton of Typescript source file that will contain all the icon names.
	 * It could look like this:
	 * 		export type AllMyIcons = "envelope" | "clock" | "refresh";
	 * This can help you typecheck icon names at compile-time instead of just looking at missing icon at runtime. */
	enumerationTypefile?: EnumerationTypefileDefinition | EnumerationTypefileDefinition[];

}

export interface EnumerationTypefileDefinition {
	path: string;
	/** Name of type that will be exported */
	name: string;
}