// Initialize Pyodide and run Python code
async function initPyodide() {
  let pyodide = await loadPyodide();
  await pyodide.loadPackage('micropip');
  await pyodide.runPythonAsync(`
    import micropip
    await micropip.install('pyodide-http')
  `);
  // Fetch and run the Python script
  const response = await fetch('snake.py');
  const pythonCode = await response.text();
  await pyodide.runPythonAsync(pythonCode);
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  if (window.renderer && window.scene && window.camera) {
    window.renderer.render(window.scene, window.camera);
  }
}

// Start the game
initPyodide();
animate();