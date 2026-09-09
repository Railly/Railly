struct Scene {
    resolution: vec2f,
    pointer: vec2f,
    time: f32,
    dark: f32,
    padding: vec2f,
    base: vec4f,
}
@group(0) @binding(0) var<uniform> scene: Scene;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
    let aspect = scene.resolution.x / scene.resolution.y;
    let center = vec2f(0.98, -0.12) + (scene.pointer - 0.5) * vec2f(0.028, 0.02);
    let p = (uv - center) * vec2f(aspect, 1.0);
    let angle = atan2(p.y, p.x);
    let wave = sin(angle * 3.0 + scene.time * 0.06) * 0.012;
    let radius = length(p * vec2f(0.92, 1.06)) + wave;
    let contour = radius * 66.0;
    let ridge = pow(0.5 + 0.5 * cos(contour * 6.283185), 14.0);
    let shadow = pow(0.5 + 0.5 * cos(contour * 6.283185 + 0.6), 6.0);
    let margin = mix(0.12, 0.85, smoothstep(0.55, 0.95, uv.x));
    let falloff = (1.0 - smoothstep(0.3, 1.32, radius)) * smoothstep(0.08, 0.55, uv.x) * margin;
    let illumination = pow(max(0.0, dot(normalize(p + 0.0001), normalize(vec2f(-0.55, 0.8)))), 3.0);
    let grain = fract(sin(dot(floor(uv * scene.resolution), vec2f(12.9898, 78.233))) * 43758.5453) - 0.5;
    let relief = (ridge * 0.07 - shadow * 0.015 + illumination * 0.022) * falloff;
    let polarity = mix(-0.65, 1.0, scene.dark);
    let color = scene.base.rgb + vec3f(relief * polarity) + vec3f(grain * 0.004 * falloff);
    return vec4f(clamp(color, vec3f(0.0), vec3f(1.0)), 1.0);
}
