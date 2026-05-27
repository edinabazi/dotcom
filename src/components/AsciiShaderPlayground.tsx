import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ShaderSettings = {
	renderer: "ascii" | "shader";
	cellSize: number;
	speed: number;
	contrast: number;
	brightness: number;
	shape: ShapeKind;
	blend: BlendMode;
	scale: number;
	aspect: number;
	rotation: number;
	offsetX: number;
	offsetY: number;
	repeat: number;
	edge: number;
	secondaryShape: ShapeKind;
	secondaryAmount: number;
	warp: number;
	ripple: number;
	noise: number;
	imageWave: number;
	imageWaveFrequency: number;
	hue: number;
	saturation: number;
	trail: number;
	glyphs: string;
};

type SavedPreset = {
	name: string;
	settings: ShaderSettings;
	createdAt: string;
};

const STORAGE_KEY = "edin-ascii-shader-presets";

type ShapeKind = "circle" | "box" | "diamond" | "cross" | "stripes" | "spiral" | "waves" | "grid";
type BlendMode = "add" | "multiply" | "difference" | "max" | "min";

const defaultSettings: ShaderSettings = {
	renderer: "ascii",
	cellSize: 12,
	speed: 0.7,
	contrast: 1.35,
	brightness: 0.05,
	shape: "box",
	blend: "add",
	scale: 1,
	aspect: 1,
	rotation: 0,
	offsetX: 0,
	offsetY: 0,
	repeat: 3,
	edge: 0.55,
	secondaryShape: "waves",
	secondaryAmount: 0.35,
	warp: 1.1,
	ripple: 1.35,
	noise: 0.16,
	imageWave: 0,
	imageWaveFrequency: 2.2,
	hue: 145,
	saturation: 88,
	trail: 0.22,
	glyphs: " .:-=+*#%@",
};

const glyphOptions = [
	{ label: "Classic", value: " .:-=+*#%@" },
	{ label: "Dense", value: " .'`^\",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$" },
	{ label: "Binary", value: " 01" },
	{ label: "Blocks", value: " ░▒▓█" },
	{ label: "Signal", value: " .·:•●◆" },
];

const shapeOptions: Array<{ label: string; value: ShapeKind }> = [
	{ label: "Circle", value: "circle" },
	{ label: "Box", value: "box" },
	{ label: "Diamond", value: "diamond" },
	{ label: "Cross", value: "cross" },
	{ label: "Stripes", value: "stripes" },
	{ label: "Spiral", value: "spiral" },
	{ label: "Waves", value: "waves" },
	{ label: "Grid", value: "grid" },
];

const blendOptions: Array<{ label: string; value: BlendMode }> = [
	{ label: "Add", value: "add" },
	{ label: "Multiply", value: "multiply" },
	{ label: "Difference", value: "difference" },
	{ label: "Maximum", value: "max" },
	{ label: "Minimum", value: "min" },
];

const vertexShader = `
	varying vec2 vUv;

	void main() {
		vUv = uv;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
`;

const fragmentShader = `
	uniform float uTime;
	uniform vec2 uResolution;
	uniform float uShape;
	uniform float uBlend;
	uniform float uScale;
	uniform float uAspect;
	uniform float uRotation;
	uniform vec2 uOffset;
	uniform float uRepeat;
	uniform float uEdge;
	uniform float uSecondaryShape;
	uniform float uSecondaryAmount;
	uniform float uWarp;
	uniform float uRipple;
	uniform float uNoise;
	uniform float uContrast;
	uniform float uBrightness;
	uniform float uHue;
	uniform float uSaturation;
	varying vec2 vUv;

	float random(vec2 st) {
		return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453);
	}

	float valueNoise(vec2 st) {
		vec2 i = floor(st);
		vec2 f = fract(st);
		float a = random(i);
		float b = random(i + vec2(1.0, 0.0));
		float c = random(i + vec2(0.0, 1.0));
		float d = random(i + vec2(1.0, 1.0));
		vec2 u = f * f * (3.0 - 2.0 * f);
		return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
	}

	vec2 rotate2d(vec2 p, float angle) {
		float s = sin(angle);
		float c = cos(angle);
		return mat2(c, -s, s, c) * p;
	}

	vec3 hsl2rgb(vec3 c) {
		vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
		return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
	}

	float shapeField(float shape, vec2 p, float time, float repeat, float edge) {
		float d = length(p);
		float angle = atan(p.y, p.x);

		if (shape < 0.5) {
			return 1.0 - smoothstep(0.18, 0.18 + edge, d);
		}
		if (shape < 1.5) {
			float boxDistance = max(abs(p.x), abs(p.y));
			return 1.0 - smoothstep(0.16, 0.16 + edge, boxDistance);
		}
		if (shape < 2.5) {
			float diamondDistance = abs(p.x) + abs(p.y);
			return 1.0 - smoothstep(0.22, 0.22 + edge * 1.4, diamondDistance);
		}
		if (shape < 3.5) {
			float arm = max(
				1.0 - smoothstep(0.07, 0.07 + edge * 0.28, abs(p.x)),
				1.0 - smoothstep(0.07, 0.07 + edge * 0.28, abs(p.y))
			);
			float fade = 1.0 - smoothstep(0.2, 0.9 + edge, d);
			return arm * fade;
		}
		if (shape < 4.5) {
			return 0.5 + 0.5 * sin((p.x * repeat * 7.0 + time * 1.6) * 3.14159);
		}
		if (shape < 5.5) {
			return 0.5 + 0.5 * sin(angle * repeat + d * 18.0 - time * 2.0);
		}
		if (shape < 6.5) {
			return 0.5
				+ 0.25 * sin((p.x * repeat * 5.0 + time * 1.7) * 3.14159)
				+ 0.25 * cos((p.y * repeat * 5.0 - time * 1.2) * 3.14159);
		}

		float gridX = 1.0 - smoothstep(0.025, 0.025 + edge * 0.14, abs(fract(p.x * repeat + 0.5) - 0.5));
		float gridY = 1.0 - smoothstep(0.025, 0.025 + edge * 0.14, abs(fract(p.y * repeat + 0.5) - 0.5));
		return max(gridX, gridY);
	}

	float blendFields(float base, float secondary, float mode) {
		if (mode < 0.5) return clamp(base + secondary, 0.0, 1.0);
		if (mode < 1.5) return base * secondary;
		if (mode < 2.5) return abs(base - secondary);
		if (mode < 3.5) return max(base, secondary);
		return min(base, secondary);
	}

	void main() {
		vec2 uv = vUv;
		vec2 p = uv - 0.5;
		p.x *= uResolution.x / max(uResolution.y, 1.0);
		p -= uOffset;
		p = rotate2d(p, radians(uRotation) + uTime * 0.08);
		p = vec2(p.x / max(0.1, uScale), p.y * uAspect / max(0.1, uScale));

		float primary = shapeField(uShape, p, uTime, uRepeat, uEdge);
		float secondary = shapeField(
			uSecondaryShape,
			p * 1.35 + vec2(sin(uTime), cos(uTime * 0.8)) * 0.08,
			uTime,
			uRepeat + 1.0,
			uEdge
		) * uSecondaryAmount;
		float field = blendFields(primary, secondary, uBlend);
		float n = valueNoise(p * 18.0 + uTime * 0.4);
		float wave = field * 2.3
			+ sin((p.x * 7.0 + uTime * 1.8) * uWarp) * 0.35
			+ cos((p.y * 9.0 - uTime * 1.2) * uRipple) * 0.35
			+ (n - 0.5) * uNoise;
		float value = clamp(wave * 0.42 * uContrast + uBrightness, 0.0, 1.0);
		vec3 color = hsl2rgb(vec3(mod(uHue + value * 48.0 + length(p) * 80.0, 360.0) / 360.0, uSaturation / 100.0, 0.18 + value * 0.64));
		vec3 base = vec3(0.102);

		gl_FragColor = vec4(mix(base, color, 0.25 + value * 0.75), 1.0);
	}
`;

function clamp(value: number, min = 0, max = 1) {
	return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0: number, edge1: number, value: number) {
	const t = clamp((value - edge0) / (edge1 - edge0));
	return t * t * (3 - 2 * t);
}

function fract(value: number) {
	return value - Math.floor(value);
}

function hash(x: number, y: number, seed: number) {
	return fract(Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123);
}

function normalizePreset(settings: Partial<ShaderSettings>): ShaderSettings {
	return { ...defaultSettings, ...settings };
}

function rotatePoint(x: number, y: number, rotation: number) {
	const angle = (rotation * Math.PI) / 180;
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);

	return {
		x: x * cos - y * sin,
		y: x * sin + y * cos,
	};
}

function shapeField(shape: ShapeKind, x: number, y: number, time: number, repeat: number, edge: number) {
	const distance = Math.hypot(x, y);
	const angle = Math.atan2(y, x);

	if (shape === "circle") {
		return 1 - smoothstep(0.18, 0.18 + edge, distance);
	}

	if (shape === "box") {
		const boxDistance = Math.max(Math.abs(x), Math.abs(y));
		return 1 - smoothstep(0.16, 0.16 + edge, boxDistance);
	}

	if (shape === "diamond") {
		const diamondDistance = Math.abs(x) + Math.abs(y);
		return 1 - smoothstep(0.22, 0.22 + edge * 1.4, diamondDistance);
	}

	if (shape === "cross") {
		const arm = Math.max(
			1 - smoothstep(0.07, 0.07 + edge * 0.28, Math.abs(x)),
			1 - smoothstep(0.07, 0.07 + edge * 0.28, Math.abs(y)),
		);
		const fade = 1 - smoothstep(0.2, 0.9 + edge, distance);
		return arm * fade;
	}

	if (shape === "stripes") {
		return 0.5 + 0.5 * Math.sin((x * repeat * 7 + time * 1.6) * Math.PI);
	}

	if (shape === "spiral") {
		return 0.5 + 0.5 * Math.sin(angle * repeat + distance * 18 - time * 2);
	}

	if (shape === "waves") {
		return (
			0.5 +
			0.25 * Math.sin((x * repeat * 5 + time * 1.7) * Math.PI) +
			0.25 * Math.cos((y * repeat * 5 - time * 1.2) * Math.PI)
		);
	}

	const gridX = 1 - smoothstep(0.025, 0.025 + edge * 0.14, Math.abs(fract(x * repeat + 0.5) - 0.5));
	const gridY = 1 - smoothstep(0.025, 0.025 + edge * 0.14, Math.abs(fract(y * repeat + 0.5) - 0.5));
	return Math.max(gridX, gridY);
}

function blendFields(base: number, secondary: number, mode: BlendMode) {
	if (mode === "multiply") return base * secondary;
	if (mode === "difference") return Math.abs(base - secondary);
	if (mode === "max") return Math.max(base, secondary);
	if (mode === "min") return Math.min(base, secondary);
	return clamp(base + secondary);
}

function shapeIndex(shape: ShapeKind) {
	return shapeOptions.findIndex((option) => option.value === shape);
}

function blendIndex(blend: BlendMode) {
	return blendOptions.findIndex((option) => option.value === blend);
}

function ShaderPreview({
	settings,
	className,
}: {
	settings: ShaderSettings;
	className?: string;
}) {
	const mountRef = useRef<HTMLDivElement | null>(null);
	const settingsRef = useRef(settings);
	const frameRef = useRef<number | null>(null);

	settingsRef.current = settings;

	useEffect(() => {
		const mount = mountRef.current;
		if (!mount) return;

		let disposed = false;
		let cleanup = () => {};

		import("three").then((THREE) => {
			if (disposed || !mountRef.current) return;

			const scene = new THREE.Scene();
			const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
			const geometry = new THREE.PlaneGeometry(2, 2);
			const material = new THREE.ShaderMaterial({
			uniforms: {
				uTime: { value: 0 },
				uResolution: { value: new THREE.Vector2(1, 1) },
				uShape: { value: 0 },
				uBlend: { value: 0 },
				uScale: { value: 1 },
				uAspect: { value: 1 },
				uRotation: { value: 0 },
				uOffset: { value: new THREE.Vector2(0, 0) },
				uRepeat: { value: 3 },
				uEdge: { value: 0.55 },
				uSecondaryShape: { value: 6 },
				uSecondaryAmount: { value: 0.35 },
				uWarp: { value: 1.1 },
				uRipple: { value: 1.35 },
				uNoise: { value: 0.16 },
				uContrast: { value: 1.35 },
				uBrightness: { value: 0.05 },
				uHue: { value: 145 },
				uSaturation: { value: 88 },
			},
			vertexShader,
			fragmentShader,
		});
			const mesh = new THREE.Mesh(geometry, material);
			const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });

			renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
			renderer.setClearColor(0x1a1a1a, 1);
			scene.add(mesh);
			mount.appendChild(renderer.domElement);

			const resize = () => {
				const rect = mount.getBoundingClientRect();
				renderer.setSize(rect.width, rect.height, false);
				material.uniforms.uResolution.value.set(rect.width, rect.height);
			};

			const render = (time: number) => {
				const current = settingsRef.current;
				material.uniforms.uTime.value = time * 0.001 * current.speed;
				material.uniforms.uShape.value = shapeIndex(current.shape);
				material.uniforms.uBlend.value = blendIndex(current.blend);
				material.uniforms.uScale.value = current.scale;
				material.uniforms.uAspect.value = current.aspect;
				material.uniforms.uRotation.value = current.rotation;
				material.uniforms.uOffset.value.set(current.offsetX, current.offsetY);
				material.uniforms.uRepeat.value = current.repeat;
				material.uniforms.uEdge.value = current.edge;
				material.uniforms.uSecondaryShape.value = shapeIndex(current.secondaryShape);
				material.uniforms.uSecondaryAmount.value = current.secondaryAmount;
				material.uniforms.uWarp.value = current.warp;
				material.uniforms.uRipple.value = current.ripple;
				material.uniforms.uNoise.value = current.noise;
				material.uniforms.uContrast.value = current.contrast;
				material.uniforms.uBrightness.value = current.brightness;
				material.uniforms.uHue.value = current.hue;
				material.uniforms.uSaturation.value = current.saturation;
				renderer.render(scene, camera);
				frameRef.current = window.requestAnimationFrame(render);
			};

			resize();
			const observer = new ResizeObserver(resize);
			observer.observe(mount);
			frameRef.current = window.requestAnimationFrame(render);

			cleanup = () => {
				observer.disconnect();
				if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
				geometry.dispose();
				material.dispose();
				renderer.dispose();
				renderer.domElement.remove();
			};
		});

		return () => {
			disposed = true;
			cleanup();
		};
	}, []);

	return <div ref={mountRef} className={className} />;
}

function readPresets(): SavedPreset[] {
	if (typeof window === "undefined") return [];

	try {
		const value = window.localStorage.getItem(STORAGE_KEY);
		const presets = value ? JSON.parse(value) : [];
		return presets.map((preset: SavedPreset) => ({
			...preset,
			settings: normalizePreset(preset.settings),
		}));
	} catch {
		return [];
	}
}

function writePresets(presets: SavedPreset[]) {
	window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

function Slider({
	label,
	value,
	min,
	max,
	step,
	onChange,
}: {
	label: string;
	value: number;
	min: number;
	max: number;
	step: number;
	onChange: (value: number) => void;
}) {
	return (
		<label className="grid gap-2">
			<span className="flex items-center justify-between gap-4 text-sm tracking-[-0.04em] text-muted">
				{label}
				<span className="tabular-nums text-white">{value.toFixed(step < 1 ? 2 : 0)}</span>
			</span>
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(event) => onChange(Number(event.target.value))}
				className="h-2 w-full accent-white"
			/>
		</label>
	);
}

export default function AsciiShaderPlayground() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const shellRef = useRef<HTMLDivElement | null>(null);
	const frameRef = useRef<number | null>(null);
	const imageCanvasRef = useRef<HTMLCanvasElement | null>(null);
	const imageRef = useRef<HTMLImageElement | null>(null);
	const glyphImageRef = useRef<HTMLImageElement | null>(null);
	const settingsRef = useRef(defaultSettings);
	const [settings, setSettings] = useState(defaultSettings);
	const [presetName, setPresetName] = useState("Untitled signal");
	const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([]);
	const [copied, setCopied] = useState(false);
	const [imageName, setImageName] = useState("");
	const [glyphImageName, setGlyphImageName] = useState("");

	settingsRef.current = settings;

	useEffect(() => {
		setSavedPresets(readPresets());
	}, []);

	useEffect(() => {
		const canvas = canvasRef.current;
		const shell = shellRef.current;
		if (!canvas || !shell) return;

		const context = canvas.getContext("2d");
		if (!context) return;

		const resize = () => {
			const rect = shell.getBoundingClientRect();
			const ratio = window.devicePixelRatio || 1;
			canvas.width = Math.floor(rect.width * ratio);
			canvas.height = Math.floor(rect.height * ratio);
			canvas.style.width = `${rect.width}px`;
			canvas.style.height = `${rect.height}px`;
			context.setTransform(ratio, 0, 0, ratio, 0, 0);
		};

		const draw = (time: number) => {
			const rect = shell.getBoundingClientRect();
			const current = settingsRef.current;
			const cell = current.cellSize;
			const columns = Math.ceil(rect.width / cell);
			const rows = Math.ceil(rect.height / cell);
			const seconds = time * 0.001 * current.speed;
			const sourceImage = imageRef.current;
			const glyphImage = glyphImageRef.current;
			const imageCanvas = imageCanvasRef.current;
			const imageContext = imageCanvas?.getContext("2d", { willReadFrequently: true });
			let imagePixels: ImageData | null = null;

			if (sourceImage && imageCanvas && imageContext && columns > 0 && rows > 0) {
				const imageAspect = sourceImage.naturalWidth / Math.max(sourceImage.naturalHeight, 1);
				const canvasAspect = columns / Math.max(rows, 1);
				let drawWidth = columns;
				let drawHeight = rows;
				let drawX = 0;
				let drawY = 0;

				if (imageAspect > canvasAspect) {
					drawWidth = rows * imageAspect;
					drawX = (columns - drawWidth) / 2;
				} else {
					drawHeight = columns / imageAspect;
					drawY = (rows - drawHeight) / 2;
				}

				imageCanvas.width = columns;
				imageCanvas.height = rows;
				imageContext.clearRect(0, 0, columns, rows);
				imageContext.drawImage(sourceImage, drawX, drawY, drawWidth, drawHeight);
				imagePixels = imageContext.getImageData(0, 0, columns, rows);
			}

			context.fillStyle = `rgb(26 26 26 / ${1 - current.trail})`;
			context.fillRect(0, 0, rect.width, rect.height);
			context.font = `${cell * 1.15}px "Marund", ui-monospace, monospace`;
			context.textAlign = "center";
			context.textBaseline = "middle";

			for (let y = 0; y < rows; y += 1) {
				for (let x = 0; x < columns; x += 1) {
					const nx = x / columns - 0.5;
					const ny = y / rows - 0.5;
					const shiftedX = nx - current.offsetX;
					const shiftedY = ny - current.offsetY;
					const rotated = rotatePoint(shiftedX, shiftedY, current.rotation + seconds * 8);
					const px = rotated.x / Math.max(0.1, current.scale);
					const py = (rotated.y / Math.max(0.1, current.scale)) * current.aspect;
					const distance = Math.hypot(px, py);
					let normalized = 0;

					if (imagePixels) {
						const wave = current.imageWave;
						const frequency = current.imageWaveFrequency;
						const sampleX = clamp(
							Math.round(
								x +
									Math.sin(y * 0.22 * frequency + seconds * 3.2) * wave +
									Math.sin((x + y) * 0.08 * frequency - seconds * 2.1) * wave * 0.45,
							),
							0,
							columns - 1,
						);
						const sampleY = clamp(
							Math.round(y + Math.cos(x * 0.18 * frequency + seconds * 2.6) * wave * 0.55),
							0,
							rows - 1,
						);
						const index = (sampleY * columns + sampleX) * 4;
						const red = imagePixels.data[index] ?? 0;
						const green = imagePixels.data[index + 1] ?? 0;
						const blue = imagePixels.data[index + 2] ?? 0;
						const alpha = (imagePixels.data[index + 3] ?? 255) / 255;
						const luminance = (red * 0.2126 + green * 0.7152 + blue * 0.0722) / 255;
						normalized = clamp((luminance * alpha - 0.5) * current.contrast + 0.5 + current.brightness);
					} else {
						const primary = shapeField(current.shape, px, py, seconds, current.repeat, current.edge);
						const secondary =
							shapeField(
								current.secondaryShape,
								px * 1.35 + Math.sin(seconds) * 0.08,
								py * 1.35 + Math.cos(seconds * 0.8) * 0.08,
								seconds,
								current.repeat + 1,
								current.edge,
							) * current.secondaryAmount;
						const field = blendFields(primary, secondary, current.blend);
						const wave =
							field * 2.3 +
							Math.sin((px * 7 + seconds * 1.8) * current.warp) * 0.35 +
							Math.cos((py * 9 - seconds * 1.2) * current.ripple) * 0.35 +
							(hash(x, y, Math.floor(seconds * 24)) - 0.5) * current.noise;
						normalized = clamp(wave * 0.42 * current.contrast + current.brightness);
					}
					const glyphIndex = Math.floor(normalized * (current.glyphs.length - 1));
					const alpha = 0.28 + normalized * 0.72;
					const lightness = 48 + normalized * 42;
					const hue = (current.hue + normalized * 48 + distance * 80) % 360;

					context.fillStyle = `hsl(${hue} ${current.saturation}% ${lightness}% / ${alpha})`;
					if (glyphImage) {
						const size = cell * (0.34 + normalized * 0.92);
						const centerX = x * cell + cell / 2;
						const centerY = y * cell + cell / 2;

						context.globalAlpha = alpha;
						context.drawImage(glyphImage, centerX - size / 2, centerY - size / 2, size, size);
						context.globalAlpha = 1;
					} else {
						context.fillText(current.glyphs[glyphIndex], x * cell + cell / 2, y * cell + cell / 2);
					}
				}
			}

			frameRef.current = window.requestAnimationFrame(draw);
		};

		resize();
		const observer = new ResizeObserver(resize);
		observer.observe(shell);
		frameRef.current = window.requestAnimationFrame(draw);

		return () => {
			observer.disconnect();
			if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
		};
	}, []);

	const updateSetting = useCallback(
		<Key extends keyof ShaderSettings>(key: Key, value: ShaderSettings[Key]) => {
			setSettings((current) => ({ ...current, [key]: value }));
		},
		[],
	);

	const uploadImage = (file: File | undefined) => {
		if (!file || !file.type.startsWith("image/")) return;

		const url = URL.createObjectURL(file);
		const image = new Image();

		image.onload = () => {
			imageRef.current = image;
			setImageName(file.name);
			updateSetting("renderer", "ascii");
			URL.revokeObjectURL(url);
		};
		image.onerror = () => URL.revokeObjectURL(url);
		image.src = url;
	};

	const clearImage = () => {
		imageRef.current = null;
		setImageName("");
	};

	const uploadGlyphImage = (file: File | undefined) => {
		if (!file || !file.type.startsWith("image/")) return;

		const url = URL.createObjectURL(file);
		const image = new Image();

		image.onload = () => {
			glyphImageRef.current = image;
			setGlyphImageName(file.name);
			updateSetting("renderer", "ascii");
			URL.revokeObjectURL(url);
		};
		image.onerror = () => URL.revokeObjectURL(url);
		image.src = url;
	};

	const clearGlyphImage = () => {
		glyphImageRef.current = null;
		setGlyphImageName("");
	};

	const exportValue = useMemo(
		() => JSON.stringify({ name: presetName, settings }, null, 2),
		[presetName, settings],
	);

	const savePreset = () => {
		const nextPreset: SavedPreset = {
			name: presetName.trim() || "Untitled signal",
			settings,
			createdAt: new Date().toISOString(),
		};
		const nextPresets = [nextPreset, ...savedPresets.filter((preset) => preset.name !== nextPreset.name)];
		setSavedPresets(nextPresets);
		writePresets(nextPresets);
	};

	const copyPreset = async () => {
		await navigator.clipboard.writeText(exportValue);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1200);
	};

	const downloadPreset = () => {
		const blob = new Blob([exportValue], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `${presetName.trim() || "ascii-shader"}.json`;
		link.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div className="grid h-dvh max-h-dvh grid-rows-[minmax(0,1fr)] items-stretch overflow-hidden bg-black p-6 text-white lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8 lg:p-10">
			<section className="flex h-full min-h-0 flex-col gap-6">
				<div>
					<p className="text-base tracking-[-0.04em] text-muted">ASCII shader lab</p>
					<h1 className="mt-2 max-w-3xl text-5xl leading-none tracking-tighter text-white">
						Draw noise until it starts feeling useful.
					</h1>
				</div>

				<div
					ref={shellRef}
					className="squircle relative min-h-0 flex-1 overflow-hidden rounded-card border border-border bg-surface"
				>
					<canvas
						ref={canvasRef}
						className={`absolute inset-0 size-full ${settings.renderer === "ascii" ? "opacity-100" : "opacity-0"}`}
					/>
					<canvas ref={imageCanvasRef} className="hidden" />
					{settings.renderer === "shader" && (
						<ShaderPreview settings={settings} className="absolute inset-0 size-full" />
					)}
				</div>
			</section>

			<aside className="squircle mt-6 flex h-full min-h-0 flex-col gap-6 overflow-y-auto rounded-card border border-border bg-surface p-6 lg:mt-0">
				<div>
					<h2 className="text-2xl tracking-[-0.04em] text-white">Controls</h2>
					<p className="mt-2 text-base leading-snug tracking-[-0.04em] text-muted">
						Everything here is stored as a reusable preset.
					</p>
				</div>

				<div className="grid gap-5">
					<div className="grid grid-cols-2 gap-2">
						<button
							type="button"
							onClick={() => updateSetting("renderer", "ascii")}
							className={`squircle rounded-avatar border px-3 py-3 text-sm tracking-[-0.04em] ${
								settings.renderer === "ascii"
									? "border-white bg-white text-black"
									: "border-border text-white"
							}`}
						>
							ASCII
						</button>
						<button
							type="button"
							onClick={() => updateSetting("renderer", "shader")}
							className={`squircle rounded-avatar border px-3 py-3 text-sm tracking-[-0.04em] ${
								settings.renderer === "shader"
									? "border-white bg-white text-black"
									: "border-border text-white"
							}`}
						>
							GLSL
						</button>
					</div>
					<Slider label="Cell size" min={7} max={22} step={1} value={settings.cellSize} onChange={(value) => updateSetting("cellSize", value)} />
					<div className="grid gap-2">
						<span className="text-sm tracking-[-0.04em] text-muted">Image source</span>
						<label className="squircle cursor-pointer rounded-avatar border border-border bg-black px-3 py-3 text-center text-sm tracking-[-0.04em] text-white transition-colors hover:bg-white/5">
							<input
								type="file"
								accept="image/*"
								onChange={(event) => uploadImage(event.target.files?.[0])}
								className="sr-only"
							/>
							{imageName || "Upload image"}
						</label>
						{imageName && (
							<>
								<Slider
									label="Image wave"
									min={0}
									max={8}
									step={0.1}
									value={settings.imageWave}
									onChange={(value) => updateSetting("imageWave", value)}
								/>
								<Slider
									label="Wave frequency"
									min={0.5}
									max={5}
									step={0.1}
									value={settings.imageWaveFrequency}
									onChange={(value) => updateSetting("imageWaveFrequency", value)}
								/>
								<button
									type="button"
									onClick={clearImage}
									className="squircle rounded-avatar border border-border px-3 py-3 text-sm tracking-[-0.04em] text-white"
								>
									Use generated field
								</button>
							</>
						)}
					</div>
					<Slider label="Speed" min={0} max={2.4} step={0.05} value={settings.speed} onChange={(value) => updateSetting("speed", value)} />
					<Slider label="Contrast" min={0.5} max={2.8} step={0.05} value={settings.contrast} onChange={(value) => updateSetting("contrast", value)} />
					<Slider label="Brightness" min={-0.35} max={0.35} step={0.01} value={settings.brightness} onChange={(value) => updateSetting("brightness", value)} />
					<label className="grid gap-2">
						<span className="text-sm tracking-[-0.04em] text-muted">Primary shape</span>
						<select
							value={settings.shape}
							onChange={(event) => updateSetting("shape", event.target.value as ShapeKind)}
							className="squircle rounded-avatar border border-border bg-black px-3 py-3 text-base text-white"
						>
							{shapeOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</label>
					<label className="grid gap-2">
						<span className="text-sm tracking-[-0.04em] text-muted">Blend mode</span>
						<select
							value={settings.blend}
							onChange={(event) => updateSetting("blend", event.target.value as BlendMode)}
							className="squircle rounded-avatar border border-border bg-black px-3 py-3 text-base text-white"
						>
							{blendOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</label>
					<Slider label="Scale" min={0.35} max={2.4} step={0.05} value={settings.scale} onChange={(value) => updateSetting("scale", value)} />
					<Slider label="Aspect" min={0.35} max={2.5} step={0.05} value={settings.aspect} onChange={(value) => updateSetting("aspect", value)} />
					<Slider label="Rotation" min={-180} max={180} step={1} value={settings.rotation} onChange={(value) => updateSetting("rotation", value)} />
					<Slider label="X offset" min={-0.5} max={0.5} step={0.01} value={settings.offsetX} onChange={(value) => updateSetting("offsetX", value)} />
					<Slider label="Y offset" min={-0.5} max={0.5} step={0.01} value={settings.offsetY} onChange={(value) => updateSetting("offsetY", value)} />
					<Slider label="Repeat" min={1} max={12} step={1} value={settings.repeat} onChange={(value) => updateSetting("repeat", value)} />
					<Slider label="Edge softness" min={0.05} max={1.4} step={0.05} value={settings.edge} onChange={(value) => updateSetting("edge", value)} />
					<label className="grid gap-2">
						<span className="text-sm tracking-[-0.04em] text-muted">Secondary shape</span>
						<select
							value={settings.secondaryShape}
							onChange={(event) => updateSetting("secondaryShape", event.target.value as ShapeKind)}
							className="squircle rounded-avatar border border-border bg-black px-3 py-3 text-base text-white"
						>
							{shapeOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</label>
					<Slider label="Secondary amount" min={0} max={1} step={0.01} value={settings.secondaryAmount} onChange={(value) => updateSetting("secondaryAmount", value)} />
					<Slider label="Warp" min={0.2} max={3} step={0.05} value={settings.warp} onChange={(value) => updateSetting("warp", value)} />
					<Slider label="Ripple" min={0.2} max={3} step={0.05} value={settings.ripple} onChange={(value) => updateSetting("ripple", value)} />
					<Slider label="Noise" min={0} max={1.2} step={0.01} value={settings.noise} onChange={(value) => updateSetting("noise", value)} />
					<Slider label="Hue" min={0} max={360} step={1} value={settings.hue} onChange={(value) => updateSetting("hue", value)} />
					<Slider label="Saturation" min={0} max={100} step={1} value={settings.saturation} onChange={(value) => updateSetting("saturation", value)} />
					<Slider label="Trail" min={0} max={0.9} step={0.01} value={settings.trail} onChange={(value) => updateSetting("trail", value)} />
				</div>

				<label className="grid gap-2">
					<span className="text-sm tracking-[-0.04em] text-muted">Glyph set</span>
					<select
						value={settings.glyphs}
						onChange={(event) => updateSetting("glyphs", event.target.value)}
						className="squircle rounded-avatar border border-border bg-black px-3 py-3 text-base text-white"
					>
						{glyphOptions.map((option) => (
							<option key={option.label} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</label>

				<div className="grid gap-2">
					<span className="text-sm tracking-[-0.04em] text-muted">Custom glyph image</span>
					<label className="squircle cursor-pointer rounded-avatar border border-border bg-black px-3 py-3 text-center text-sm tracking-[-0.04em] text-white transition-colors hover:bg-white/5">
						<input
							type="file"
							accept="image/*"
							onChange={(event) => uploadGlyphImage(event.target.files?.[0])}
							className="sr-only"
						/>
						{glyphImageName || "Upload glyph"}
					</label>
					{glyphImageName && (
						<button
							type="button"
							onClick={clearGlyphImage}
							className="squircle rounded-avatar border border-border px-3 py-3 text-sm tracking-[-0.04em] text-white"
						>
							Use text glyphs
						</button>
					)}
				</div>

				<div className="grid gap-3 border-t border-border pt-6">
					<label className="grid gap-2">
						<span className="text-sm tracking-[-0.04em] text-muted">Preset name</span>
						<input
							value={presetName}
							onChange={(event) => setPresetName(event.target.value)}
							className="squircle rounded-avatar border border-border bg-black px-3 py-3 text-base text-white"
						/>
					</label>
					<div className="grid grid-cols-3 gap-2">
						<button type="button" onClick={savePreset} className="squircle rounded-avatar bg-white px-3 py-3 text-sm tracking-[-0.04em] text-black">
							Save
						</button>
						<button type="button" onClick={copyPreset} className="squircle rounded-avatar border border-border px-3 py-3 text-sm tracking-[-0.04em] text-white">
							{copied ? "Copied" : "Copy"}
						</button>
						<button type="button" onClick={downloadPreset} className="squircle rounded-avatar border border-border px-3 py-3 text-sm tracking-[-0.04em] text-white">
							JSON
						</button>
					</div>
				</div>

				{savedPresets.length > 0 && (
					<div className="grid gap-2 border-t border-border pt-6">
						<p className="text-sm tracking-[-0.04em] text-muted">Saved presets</p>
						<div className="grid gap-2">
							{savedPresets.map((preset) => (
								<button
									key={`${preset.name}-${preset.createdAt}`}
									type="button"
									onClick={() => {
										setPresetName(preset.name);
										setSettings(preset.settings);
									}}
									className="squircle rounded-avatar border border-border px-3 py-3 text-left text-sm tracking-[-0.04em] text-white transition-colors hover:bg-white/5"
								>
									{preset.name}
								</button>
							))}
						</div>
					</div>
				)}
			</aside>
		</div>
	);
}
