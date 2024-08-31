const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
    }
`;

const fragmentShader = `
    uniform float time;
    uniform vec2 resolution;
    
    // Main color #CC00AA
    const vec3 COLOR1 = vec3(0.3, 0.6, 0.6);
    // Slightly darker version of COLOR1 for contrast
    const vec3 COLOR2 = vec3(0.75, 0.3, 0.6);
    // Accent color (a brighter pink)
    const vec3 COLOR3 = vec3(0.95, 0.5, 0.8);
    
    float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
    }

    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
            f.y
        );
    }
    
    void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        uv.x *= resolution.x / resolution.y;
        
        float n = 0.0;
        
        // Create multiple layers of noise
        for (float i = 1.0; i < 4.0; i++) {
            float scale = pow(1.25, i);
            n += noise(vec2(uv.x * scale - time * 0.05 * i, uv.y * scale * 0.4)) / scale;
        }
        
        // Create horizontal wave effect
        float wave = sin(uv.x * 2.0 + time * 0.5 + n * 8.0);
        
        // Combine noise and wave
        float pattern = smoothstep(0.3, 0.7, n * 0.7 + wave * 0.3);
        
        // Use pattern to mix between colors
        vec3 col = mix(COLOR1, COLOR2, pattern);
        
        // Add highlights
        col = mix(col, COLOR3, pow(1.0 - pattern, 10.0));
        
        // Add a subtle pulsing effect
        // col *= 0.9 + 0.1 * sin(time * 2.0 + uv.x * 10.0);
        
        gl_FragColor = vec4(col, 1.0);
    }
`;

const canvas = document.getElementById('logoCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const geometry = new THREE.PlaneGeometry(2, 2);
const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2() }
    }
});

const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
    }
    return needResize;
}

function animate(time) {
    time *= 0.001;  // convert to seconds

    if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement;
        material.uniforms.resolution.value.set(canvas.width, canvas.height);
    }

    material.uniforms.time.value = time;
    renderer.render(scene, camera);

    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);