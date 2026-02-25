(function initBlogBackground() {
  const statsCanvas = document.getElementById("bg-stats");
  const textCanvas = document.getElementById("bg-text");
  const lightningCanvas = document.getElementById("bg-lightning");
  if (!statsCanvas || !textCanvas || !lightningCanvas) return;

  const statsCtx = statsCanvas.getContext("2d");
  const textCtx = textCanvas.getContext("2d");
  const lightningCtx = lightningCanvas.getContext("2d");
  if (!statsCtx || !textCtx || !lightningCtx) return;

  const floaters = [];
  const words = ["+420", "19.2%", "-115", "53.5%", "+380", "20.8%", "+550", "15.4%", "+180", "35.7%"];

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    [statsCanvas, textCanvas, lightningCanvas].forEach((canvas) => {
      canvas.width = w;
      canvas.height = h;
    });
  }

  function spawnFloaters() {
    floaters.length = 0;
    for (let i = 0; i < 22; i += 1) {
      floaters.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        speed: 0.1 + Math.random() * 0.35,
        value: words[Math.floor(Math.random() * words.length)],
        alpha: 0.08 + Math.random() * 0.12,
      });
    }
  }

  function drawStats() {
    statsCtx.clearRect(0, 0, statsCanvas.width, statsCanvas.height);
    statsCtx.strokeStyle = "rgba(200, 144, 63, 0.08)";
    statsCtx.lineWidth = 1;
    for (let x = 0; x < statsCanvas.width; x += 72) {
      statsCtx.beginPath();
      statsCtx.moveTo(x, 0);
      statsCtx.lineTo(x, statsCanvas.height);
      statsCtx.stroke();
    }
    for (let y = 0; y < statsCanvas.height; y += 72) {
      statsCtx.beginPath();
      statsCtx.moveTo(0, y);
      statsCtx.lineTo(statsCanvas.width, y);
      statsCtx.stroke();
    }
  }

  function drawText() {
    textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
    textCtx.font = "12px 'IBM Plex Mono', monospace";
    textCtx.textBaseline = "middle";

    floaters.forEach((item) => {
      item.y -= item.speed;
      if (item.y < -20) {
        item.y = textCanvas.height + 20;
        item.x = Math.random() * textCanvas.width;
        item.value = words[Math.floor(Math.random() * words.length)];
      }
      textCtx.fillStyle = `rgba(216, 162, 78, ${item.alpha})`;
      textCtx.fillText(item.value, item.x, item.y);
    });
  }

  let boltPhase = 0;
  function drawLightning() {
    lightningCtx.clearRect(0, 0, lightningCanvas.width, lightningCanvas.height);
    boltPhase += 0.01;
    const pulse = 0.05 + (Math.sin(boltPhase) + 1) * 0.02;
    lightningCtx.strokeStyle = `rgba(216, 162, 78, ${pulse})`;
    lightningCtx.lineWidth = 1.25;
    lightningCtx.beginPath();
    lightningCtx.moveTo(lightningCanvas.width * 0.72, lightningCanvas.height * 0.2);
    lightningCtx.lineTo(lightningCanvas.width * 0.64, lightningCanvas.height * 0.46);
    lightningCtx.lineTo(lightningCanvas.width * 0.71, lightningCanvas.height * 0.46);
    lightningCtx.lineTo(lightningCanvas.width * 0.61, lightningCanvas.height * 0.78);
    lightningCtx.stroke();
  }

  function tick() {
    drawStats();
    drawText();
    drawLightning();
    requestAnimationFrame(tick);
  }

  resize();
  spawnFloaters();
  window.addEventListener("resize", () => {
    resize();
    spawnFloaters();
  });
  requestAnimationFrame(tick);
})();
