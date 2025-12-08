// Marker & Image Sampling – Version mit Spieler-Support
App.markerHandler = {
  LONG_MARK_MS: 500,
  samplerCache: new WeakMap(),
  
  clampPct(v) {
    return Math.max(0, Math.min(100, v));
  },
  
  createImageSampler(imgEl) {
    if (!imgEl) return null;
    if (this.samplerCache.has(imgEl)) return this.samplerCache.get(imgEl);
    
    const sampler = { valid: false, canvas: null, ctx: null };
    
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      sampler.canvas = canvas;
      sampler.ctx = ctx;
      
      const draw = () => {
        try {
          const w = imgEl.naturalWidth || imgEl.width || 1;
          const h = imgEl.naturalHeight || imgEl.height || 1;
          canvas.width = w;
          canvas.height = h;
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(imgEl, 0, 0, w, h);
          sampler.valid = true;
        } catch (e) {
          sampler.valid = false;
        }
      };
      
      if (imgEl.complete) draw();
      else {
        imgEl.addEventListener("load", draw);
        imgEl.addEventListener("error", () => { sampler.valid = false; });
      }
      
      const getPixel = (xPct, yPct) => {
        if (!sampler.valid) return null;
        const px = Math.round((xPct / 100) * (canvas.width - 1));
        const py = Math.round((yPct / 100) * (canvas.height - 1));
        try {
          const d = ctx.getImageData(px, py, 1, 1).data;
          return { r: d[0], g: d[1], b: d[2], a: d[3] };
        } catch (e) {
          sampler.valid = false;
          return null;
        }
      };
      
      sampler.isWhiteAt = (xPct, yPct, threshold = 220) => {
        const p = getPixel(xPct, yPct);
        if (!p || p.a === 0) return false;
        return p.r >= threshold && p.g >= threshold && p.b >= threshold;
      };
      
      sampler.isNeutralWhiteAt = (xPct, yPct, threshold = 245, maxChannelDiff = 8) => {
        const p = getPixel(xPct, yPct);
        if (!p || p.a === 0) return false;
        const maxC = Math.max(p.r, p.g, p.b);
        const minC = Math.min(p.r, p.g, p.b);
        return maxC >= threshold && (maxC - minC) <= maxChannelDiff;
      };
      
      sampler.isGreenAt = (xPct, yPct, gThreshold = 110, diff = 30) => {
        const p = getPixel(xPct, yPct);
        if (!p || p.a === 0) return false;
        return (p.g >= gThreshold) && ((p.g - p.r) >= diff) && ((p.g - p.b) >= diff);
      };
      
      sampler.isRedAt = (xPct, yPct, rThreshold = 95, diff = 22) => {
        const p = getPixel(xPct, yPct);
        if (!p || p.a === 0) return false;
        return (p.r >= rThreshold) && ((p.r - p.g) >= diff) && ((p.r - p.b) >= diff);
      };
      
      this.samplerCache.set(imgEl, sampler);
      return sampler;
    } catch (err) {
      const fallback = {
        valid: false,
        isWhiteAt: () => false,
        isNeutralWhiteAt: () => false,
        isGreenAt: () => false,
        isRedAt: () => false
      };
      this.samplerCache.set(imgEl, fallback);
      return fallback;
    }
  },
  
  /**
   * Marker mit Prozent-Koordinaten erstellen.
   * Alle Styles kommen aus der CSS-Klasse .marker-dot
   * @param {number} xPct 0–100
   * @param {number} yPct 0–100
   * @param {string} color CSS-Farbe
   * @param {HTMLElement} container Box (field-box/goal-img-box)
   * @param {boolean} interactive Klick zum Entfernen? 
   * @param {string|null} playerName optionaler Spielername
   */
  createMarkerPercent(xPct, yPct, color, container, interactive = true, playerName = null) {
    xPct = this.clampPct(xPct);
    yPct = this.clampPct(yPct);
    
    const dot = document.createElement("div");
    dot.className = "marker-dot";
    
    // Nur Position und Farbe setzen - Rest kommt aus CSS-Klasse .marker-dot
    dot.style.left = `${xPct}%`;
    dot.style.top = `${yPct}%`;
    dot.style.backgroundColor = color;
    
    if (playerName) {
      dot.dataset.player = playerName;
    }
    
    if (interactive) {
      dot.addEventListener("click", (ev) => {
        ev.stopPropagation();
        dot.remove();
      });
    }
    
    container.style.position = container.style.position || "relative";
    container.appendChild(dot);
    
    return dot;
  },
  
  computeRenderedImageRect(imgEl) {
    try {
      const boxRect = imgEl.getBoundingClientRect();
      const naturalW = imgEl.naturalWidth || imgEl.width || 1;
      const naturalH = imgEl.naturalHeight || imgEl.height || 1;
      const boxW = boxRect.width || 1;
      const boxH = boxRect.height || 1;
      const cs = getComputedStyle(imgEl);
      const objectFit = cs?.getPropertyValue('object-fit')?.trim() || 'contain';
      
      let scale;
      if (objectFit === 'cover') {
        scale = Math.max(boxW / naturalW, boxH / naturalH);
      } else if (objectFit === 'fill') {
        return {
          x: boxRect.left,
          y: boxRect.top,
          width: naturalW * (boxW / naturalW),
          height: naturalH * (boxH / naturalH)
        };
      } else if (objectFit === 'none') {
        scale = 1;
      } else {
        scale = Math.min(boxW / naturalW, boxH / naturalH);
      }
      
      const renderedW = naturalW * scale;
      const renderedH = naturalH * scale;
      const offsetX = boxRect.left + (boxW - renderedW) / 2;
      const offsetY = boxRect.top + (boxH - renderedH) / 2;
      
      return { x: offsetX, y: offsetY, width: renderedW, height: renderedH };
    } catch (e) {
      return null;
    }
  },
  
  clearAllMarkers() {
    document.querySelectorAll(".marker-dot").forEach(d => d.remove());
  }
};
