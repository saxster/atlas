// Where Chrome is and how it gets WebGL, for every browser tool: the GPU through Metal on a Mac, the SwiftShader
// software renderer elsewhere (CI's Linux runners have no GPU). CHROME overrides the path; GL=swiftshader forces the
// software renderer on a Mac too, to see what CI sees.
export const CHROME = process.env.CHROME || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : '/usr/bin/google-chrome');
export const GL_ARGS = process.platform === 'darwin' && process.env.GL !== 'swiftshader'
  ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist']
  : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'];
