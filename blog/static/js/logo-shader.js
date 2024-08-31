const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
    }
`;

const fragmentShader = `
    precision highp float;
    uniform float time;
    uniform vec2 resolution;

    const vec3 COLOR1 = vec3(0.3, 0.6, 0.6);
    const vec3 COLOR2 = vec3(0.75, 0.3, 0.6);
    const vec3 COLOR3 = vec3(0.95, 0.5, 0.8);

    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);  // Smooth interpolation for organic transitions
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
        for (float i = 1.0; i < 4.0; i++) {
            float scale = pow(1.2, i);
            n += noise(vec2(uv.x * scale - time * 0.1 * i, uv.y * scale * 0.4)) / scale;
        }

        float wave = sin(uv.x * 2.0 + time * 0.1 + n * 8.0);
        float pattern = smoothstep(0.3, 0.7, n * 0.9 + wave * 0.4);

        vec3 col = mix(COLOR1, COLOR2, pattern);
        col = mix(col, COLOR3, pow(1.0 - pattern, 5.0));

        gl_FragColor = vec4(col, 1.0);
    }
`;

const canvas = document.getElementById('logoCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2() }
    }
});

scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

// Generate a random time offset
const randomOffset = Math.random() * 1000;

function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width * window.devicePixelRatio || canvas.height !== height * window.devicePixelRatio) {
        renderer.setSize(width, height, false);
        return true;
    }
    return false;
}

function animate(time) {
    time = time * 0.001 + randomOffset; // Convert to seconds and add random offset
    if (resizeRendererToDisplaySize(renderer)) {
        material.uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height);
    }
    material.uniforms.time.value = time;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
