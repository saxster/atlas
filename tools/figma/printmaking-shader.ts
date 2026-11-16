import { defineProperties } from "figma:shaders"

export default function Effect() {}

export function setup(device, frame) {
  var wgsl = `diagnostic(off,derivative_uniformity);
struct Uniforms {
  ink: vec4f,
  cfg: vec4f,
  res: vec4f,
};
@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var samp: sampler;
@group(0) @binding(2) var inputTex: texture_2d<f32>;

struct VsIn {
  @location(0) pos: vec2f,
  @location(1) uv: vec2f,
};
struct VsOut {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};

@vertex fn vs_main(in: VsIn) -> VsOut {
  var out: VsOut;
  out.position = vec4f(in.pos, 0.0, 1.0);
  out.uv = in.uv;
  return out;
}

fn hash21(p: vec2f) -> f32 {
  var p3 = fract(vec3f(p.x, p.y, p.x) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

fn valueNoise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  let a = hash21(i);
  let b = hash21(i + vec2f(1.0, 0.0));
  let c = hash21(i + vec2f(0.0, 1.0));
  let d = hash21(i + vec2f(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

fn luma(rgb: vec3f) -> f32 {
  return dot(rgb, vec3f(0.299, 0.587, 0.114));
}

fn rot2(p: vec2f, deg: f32) -> vec2f {
  let a = deg * 0.0174532925;
  let c = cos(a);
  let s = sin(a);
  return vec2f(c * p.x - s * p.y, s * p.x + c * p.y);
}

fn risoDot(px: vec2f, deg: f32, cov: f32, cell: f32) -> f32 {
  let rp = rot2(px, deg) / cell;
  let f = fract(rp) - vec2f(0.5, 0.5);
  let d = length(f);
  let r = clamp(sqrt(max(0.0, cov)) * 0.56, 0.0, 0.54);
  return 1.0 - smoothstep(r - 0.08, r + 0.08, d);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let dims = max(vec2f(1.0, 1.0), uniforms.res.xy);
  let texel = 1.0 / dims;
  let px = uv * dims;

  // All textureSample calls execute in uniform control flow before branching
  let n0 = valueNoise(px * 0.045) - 0.5;
  let n1 = valueNoise(px * 0.045 + vec2f(19.7, 41.3)) - 0.5;
  let wobbleUv = clamp(uv + vec2f(n0, n1) * texel * 1.35, vec2f(0.0, 0.0), vec2f(1.0, 1.0));
  let washUv = clamp(uv + vec2f(1.6, -1.3) * texel + vec2f(n0, n1) * texel * 2.2, vec2f(0.0, 0.0), vec2f(1.0, 1.0));

  let sCenter = textureSample(inputTex, samp, uv);
  let sWash = textureSample(inputTex, samp, washUv);
  let sL = textureSample(inputTex, samp, clamp(wobbleUv - vec2f(texel.x, 0.0), vec2f(0.0, 0.0), vec2f(1.0, 1.0)));
  let sR = textureSample(inputTex, samp, clamp(wobbleUv + vec2f(texel.x, 0.0), vec2f(0.0, 0.0), vec2f(1.0, 1.0)));
  let sU = textureSample(inputTex, samp, clamp(wobbleUv - vec2f(0.0, texel.y), vec2f(0.0, 0.0), vec2f(1.0, 1.0)));
  let sD = textureSample(inputTex, samp, clamp(wobbleUv + vec2f(0.0, texel.y), vec2f(0.0, 0.0), vec2f(1.0, 1.0)));

  let alpha = sCenter.a;
  let invA = select(1.0 / max(0.0001, alpha), 0.0, alpha < 0.0001);
  let baseRgb = sCenter.rgb * invA;
  let washRgb = mix(baseRgb, sWash.rgb * select(1.0 / max(0.0001, sWash.a), 0.0, sWash.a < 0.0001), 0.72);

  let gx = length(sR.rgb - sL.rgb);
  let gy = length(sD.rgb - sU.rgb);
  let grad = clamp((gx + gy) * 2.4 * uniforms.res.z, 0.0, 1.0);

  let mode = uniforms.cfg.x;
  let intensity = clamp(uniforms.cfg.y, 0.0, 1.0);
  let cell = max(3.0, uniforms.cfg.z);
  let inkRgb = uniforms.ink.rgb;
  let grain = (hash21(floor(px)) - 0.5) * 0.045;

  var styledRgb = baseRgb;

  if (mode < 0.5) {
    let bleed = 1.0 - grad * 0.24;
    let tooth = 0.72 + 0.28 * valueNoise(px * 0.35);
    let edgeMix = clamp(grad * tooth * 1.25, 0.0, 1.0);
    styledRgb = mix(washRgb * bleed + vec3f(grain, grain, grain), inkRgb, edgeMix);
  } else if (mode < 1.5) {
    let lum = luma(baseRgb);
    let hp = px / max(1.0, cell * 0.38);
    var hatch = 0.0;
    if (lum <= 0.76 && abs((hp.x + hp.y) - floor((hp.x + hp.y) / 7.0) * 7.0) <= 1.05) {
      hatch = 0.55;
    }
    if (lum <= 0.54 && abs((hp.x - hp.y) - floor((hp.x - hp.y) / 7.0) * 7.0) <= 1.05) {
      hatch = 0.74;
    }
    if (lum <= 0.34 && abs(hp.y - floor(hp.y / 6.0) * 6.0) <= 1.05) {
      hatch = 0.88;
    }
    let hatched = mix(baseRgb, inkRgb, hatch);
    styledRgb = mix(hatched, inkRgb, clamp(grad * 1.15, 0.0, 1.0));
  } else if (mode < 2.5) {
    let k = 1.0 - max(baseRgb.r, max(baseRgb.g, baseRgb.b));
    let invK = 1.0 / max(0.0001, 1.0 - k);
    let c = max(0.0, (1.0 - baseRgb.r - k) * invK - 0.08);
    let m = max(0.0, (1.0 - baseRgb.g - k) * invK - 0.08);
    let y = max(0.0, (1.0 - baseRgb.b - k) * invK - 0.08);
    let kInk = max(0.0, k - 0.14);
    var paper = vec3f(0.968, 0.952, 0.912) + vec3f(grain * 0.7);
    paper.r *= (1.0 - 0.85 * risoDot(px, 15.0, c, cell));
    paper.g *= (1.0 - 0.83 * risoDot(px, 75.0, m, cell));
    paper.b *= (1.0 - 0.85 * risoDot(px, 0.0, y, cell));
    paper *= (1.0 - 0.78 * risoDot(px, 45.0, kInk, cell));
    let risoMix = mix(baseRgb, paper, 0.64);
    styledRgb = mix(risoMix, inkRgb, clamp(grad * 1.05, 0.0, 1.0));
  } else {
    styledRgb = mix(baseRgb + vec3f(grain * 0.45), inkRgb, clamp(grad * 1.1, 0.0, 1.0));
  }

  let outRgb = mix(baseRgb, clamp(styledRgb, vec3f(0.0), vec3f(1.0)), intensity) * alpha;
  return vec4f(outRgb, alpha);
}
`
  frame.state.module = device.createShaderModule({ code: wgsl })
  frame.state.pipeline = null
  frame.state.pipelineFormat = null

  frame.state.quad = device.createBuffer({
    size: 6 * 4 * 4,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  })
  new Float32Array(frame.state.quad.getMappedRange()).set([
    -1, -1, 0, 1,
    1, -1, 1, 1,
    -1, 1, 0, 0,
    -1, 1, 0, 0,
    1, -1, 1, 1,
    1, 1, 1, 0,
  ])
  frame.state.quad.unmap()

  frame.state.uniforms = device.createBuffer({
    size: 48,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  })

  frame.state.sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
  })

  frame.state.placeholder = device.createTexture({
    size: [1, 1, 1],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
  })
  device.queue.writeTexture(
    { texture: frame.state.placeholder },
    new Uint8Array([0, 0, 0, 0]),
    { bytesPerRow: 4 },
    { width: 1, height: 1, depthOrArrayLayers: 1 },
  )
}

export function render(device, frame) {
  var params = frame.params || {}
  var ink = params.ink || {}
  var mode = Number(params.medium)
  var intensity = Number(params.intensity)
  var scale = Number(params.scale)
  var edgeWeight = Number(params.edgeWeight)

  device.queue.writeBuffer(frame.state.uniforms, 0, new Float32Array([
    Number.isFinite(Number(ink.r)) ? Number(ink.r) : 0.11,
    Number.isFinite(Number(ink.g)) ? Number(ink.g) : 0.10,
    Number.isFinite(Number(ink.b)) ? Number(ink.b) : 0.09,
    Number.isFinite(Number(ink.a)) ? Number(ink.a) : 1.0,
    Number.isFinite(mode) ? mode : 0,
    Number.isFinite(intensity) ? intensity : 0.9,
    Number.isFinite(scale) ? scale : 5.0,
    0,
    frame.output.width,
    frame.output.height,
    Number.isFinite(edgeWeight) ? edgeWeight : 1.0,
    0,
  ]))

  var inputView = frame.input != null
    ? frame.input.createView()
    : frame.state.placeholder.createView()

  var outputFormat = frame.output.format
  if (frame.state.pipeline == null || frame.state.pipelineFormat !== outputFormat) {
    frame.state.pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: frame.state.module,
        entryPoint: 'vs_main',
        buffers: [{
          arrayStride: 16,
          attributes: [
            { shaderLocation: 0, format: 'float32x2', offset: 0 },
            { shaderLocation: 1, format: 'float32x2', offset: 8 },
          ],
        }],
      },
      fragment: {
        module: frame.state.module,
        entryPoint: 'fs_main',
        targets: [{ format: outputFormat }],
      },
      primitive: { topology: 'triangle-list' },
    })
    frame.state.pipelineFormat = outputFormat
  }

  var bindGroup = device.createBindGroup({
    layout: frame.state.pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: frame.state.uniforms } },
      { binding: 1, resource: frame.state.sampler },
      { binding: 2, resource: inputView },
    ],
  })

  var encoder = device.createCommandEncoder()
  var pass = encoder.beginRenderPass({
    colorAttachments: [{
      view: frame.output.createView(),
      loadOp: 'clear',
      clearValue: { r: 0, g: 0, b: 0, a: 0 },
      storeOp: 'store',
    }],
  })
  pass.setPipeline(frame.state.pipeline)
  pass.setBindGroup(0, bindGroup)
  pass.setVertexBuffer(0, frame.state.quad)
  pass.draw(6)
  pass.end()
  device.queue.submit([encoder.finish()])
}

defineProperties(Effect, {
  medium: {
    type: 'number',
    label: 'Medium',
    defaultValue: 0,
    control: 'select',
    options: [
      { value: 0, label: 'Sketchbook (Pencil & Wash)' },
      { value: 1, label: 'Ligne-Claire (Moebius Hatch)' },
      { value: 2, label: 'Risograph (CMYK Halftone)' },
      { value: 3, label: 'Textbook (Paper & Ink)' },
    ],
  },
  intensity: {
    type: 'number',
    label: 'Mix',
    defaultValue: 0.9,
    control: 'slider',
    min: 0,
    max: 1,
    step: 0.02,
  },
  scale: {
    type: 'number',
    label: 'Screen / Hatch Scale',
    defaultValue: 5.0,
    control: 'slider',
    min: 2.5,
    max: 12.0,
    step: 0.5,
  },
  edgeWeight: {
    type: 'number',
    label: 'Keyline Strength',
    defaultValue: 1.0,
    control: 'slider',
    min: 0,
    max: 2.5,
    step: 0.05,
  },
  ink: {
    type: 'color',
    label: 'Keyline Ink',
    defaultValue: { r: 0.11, g: 0.10, b: 0.09, a: 1 },
  },
})
