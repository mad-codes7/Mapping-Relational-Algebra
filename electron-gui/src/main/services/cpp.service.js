const { spawn } = require('node:child_process');
const path      = require('node:path');
const fs        = require('node:fs');

// 4 levels up from src/main/services/ → project root → cpp-translator/build/
const CPP_EXE = path.join(
  __dirname, '..', '..', '..', '..',
  'cpp-translator', 'build', 'RelationalAlgebraMapper.exe'
);

function cppExeExists() {
  return fs.existsSync(CPP_EXE);
}

function runCppTranslator(ra) {
  return new Promise((resolve, reject) => {
    const child = spawn(CPP_EXE, [], { encoding: 'utf8' });
    let out = '', err = '';

    child.stdout.on('data', d => out += d);
    child.stderr.on('data', d => err += d);
    child.on('close', code => {
      if (code !== 0 || err) reject(new Error(err || `C++ process exited with code ${code}`));
      else resolve(out.trim());
    });

    child.stdin.setEncoding('utf8');
    child.stdin.write(ra);
    child.stdin.end();
  });
}

module.exports = { runCppTranslator, cppExeExists };
