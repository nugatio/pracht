const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  #ifdef GL_ES
  precision highp float;
  #endif

  uniform float time;
  uniform vec2 resolution;
  varying vec2 vUv;

  const vec3 COLOR1 = vec3(0.3, 0.6, 0.5);
  const vec3 COLOR2 = vec3(0.75, 0.3, 0.6);
  const vec3 COLOR3 = vec3(0.8, 0.45, 0.7);

  // Original hash function
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  // Original noise function
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
    vec2 uv = vUv;
    float aspect = resolution.x / resolution.y;
    uv.x *= aspect;

    float n = 0.0;
    for (float i = 1.0; i < 3.0; i++) {
      float scale = pow(1.25, i);
      n += noise(vec2(uv.x * scale - time * 0.2 * i, uv.y * scale * 0.7)) / scale;
    }

    float wave = sin(uv.x * 1.0 + time * 0.15 + n * 1.0);
    float pattern = smoothstep(0.3, 0.7, n * 0.8 + wave * 0.15);

    vec3 col = mix(COLOR1, COLOR2, pattern);
    col = mix(col, COLOR3, pow(1.0 - pattern, 10.0));

    gl_FragColor = vec4(col, 1.0);
  }
`;

const canvas = document.getElementById('logoCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);

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

const randomOffset = Math.random() * 1000;

function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const pixelRatio = window.devicePixelRatio;
  const width = canvas.clientWidth * pixelRatio | 0;
  const height = canvas.clientHeight * pixelRatio | 0;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

function animate(time) {
  time = time * 0.001 + randomOffset;

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    material.uniforms.resolution.value.set(canvas.width, canvas.height);
  }

  material.uniforms.time.value = time;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);