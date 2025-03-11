const fs = require('fs-extra');
const path = require('path');

async function setupPdfJs() {
  const sourceDir = path.join(__dirname, 'node_modules', 'pdfjs-dist');
  const targetDir = path.join(__dirname, 'public', 'pdfjs-dist');

  try {
    // Ensure target directory exists
    await fs.ensureDir(path.join(targetDir, 'build'));
    await fs.ensureDir(path.join(targetDir, 'cmaps'));

    // Copy worker file
    await fs.copy(
      path.join(sourceDir, 'build', 'pdf.worker.min.mjs'),
      path.join(targetDir, 'build', 'pdf.worker.min.mjs')
    );

    // Copy cmaps directory
    await fs.copy(
      path.join(sourceDir, 'cmaps'),
      path.join(targetDir, 'cmaps')
    );

    console.log('PDF.js files copied successfully!');
  } catch (err) {
    console.error('Error copying PDF.js files:', err);
    process.exit(1);
  }
}

setupPdfJs();
