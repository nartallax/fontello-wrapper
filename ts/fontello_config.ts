export interface FontelloConfig {
	name: string;
	css_prefix_text: string;
	css_use_suffix: false;
	hinting: boolean;
	units_per_em: number;
	ascent: number;
	glyphs: {
		uid: string;
		css: string;
		code: number;
		src: string;
	}[]
}