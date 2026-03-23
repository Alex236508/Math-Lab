(function() {

   if (document.getElementById("mathLab")) return;

   let functions2D = [];
   let offsetX = 0;
   let offsetY = 0;
   const GRAPH_MIN = -10;
   const GRAPH_MAX = 10;
   const GRAPH3D_MIN = -10;
   const GRAPH3D_MAX = 10;

   const style = document.createElement("style");
   style.textContent = `

#mathLab{
position:fixed;
top:120px;
left:120px;
width:420px;
background:#1e1e1e;
border-radius:12px;
font-family:Arial;
box-shadow:0 20px 40px rgba(0,0,0,.5);
resize:both;
overflow:hidden;
z-index:999999;
}

#graphLab{
position:fixed;
top:120px;
left:560px;
width:420px;
background:#1e1e1e;
border-radius:12px;
font-family:Arial;
box-shadow:0 20px 40px rgba(0,0,0,.5);
resize:both;
overflow:hidden;
z-index:999998;
display:none;
}

#graphLab.open{display:block;}

#header{
background:#2a2a2a;
color:white;
padding:10px;
text-align:center;
cursor:move;
font-weight:bold;
}

#graphHeader{
background:#2a2a2a;
color:white;
padding:10px;
text-align:center;
cursor:move;
font-weight:bold;
}

#graphControls{
display:flex;
gap:8px;
padding:8px;
background:#1a1a1a;
}

.graphBtn{
flex:1;
padding:8px;
border:none;
border-radius:6px;
background:#2c2c2c;
color:white;
cursor:pointer;
}

.graphBtn.active,
.graphBtn:hover{background:#3f3f3f}

.graphBtn.warn{background:#5a2d2d}
.graphBtn.warn:hover{background:#7a3b3b}

#display{
width:calc(100% - 20px);
margin:10px;
padding:12px;
font-size:20px;
background:#111;
color:#00ff9d;
border:none;
border-radius:6px;
outline:none;
text-align:right;
}


#buttons{
display:grid;
grid-template-columns:repeat(6,1fr);
gap:6px;
padding:10px;
}

.btn{
padding:10px;
border:none;
border-radius:6px;
background:#333;
color:white;
cursor:pointer;
font-size:14px;
}

.btn:hover{background:#555;}


#sidebar{
position:absolute;
top:0;
left:-130px;
width:130px;
height:100%;
background:#151515;
transition:left .35s ease;
display:flex;
flex-direction:column;
padding-top:40px;
z-index:1000000;
}

#mathLab.sidebar-open #sidebar{
left:0;
}

#sidebarHandle{
position:absolute;
top:0;
left:0;
width:12px;
height:100%;
background:#151515;
cursor:ew-resize;
z-index:1000002;
border-top-left-radius:12px;
border-bottom-left-radius:12px;
}

#sidebarHandle:after{
content:'';
position:absolute;
top:50%;
left:50%;
width:4px;
height:56px;
transform:translate(-50%,-50%);
background:#2a2a2a;
border-radius:3px;
opacity:.9;
}

#mathLab.sidebar-open #sidebarHandle{
background:#2a2a2a;
}

.sidebtn{
margin:6px;
padding:10px;
border:none;
border-radius:6px;
background:#2c2c2c;
color:white;
cursor:pointer;
}

.sidebtn:hover{background:#444}


.graphArea{
display:none;
}

.graphArea.open{
display:block;
}

canvas{
background:white;
width:100%;
height:260px;
display:block;
}


#history{
max-height:120px;
overflow:auto;
background:#111;
color:#aaa;
font-size:12px;
padding:8px;
}

`;
   document.head.appendChild(style);

   const calc = document.createElement("div");
   calc.id = "mathLab";

   calc.innerHTML = `

<div id="sidebar">
<button class="sidebtn" id="sciBtn">Scientific</button>
<button class="sidebtn" id="g2Btn">2D Graph</button>
<button class="sidebtn" id="g3Btn">3D Graph</button>
</div>
<div id="sidebarHandle" title="Open sidebar"></div>

<div id="header">Math Lab</div>

<input id="display">

<div id="buttons"></div>

<div id="history"></div>

</div>

<div id="graphLab">
<div id="graphHeader">Graph Lab</div>
<div id="graphControls">
<button class="graphBtn" id="show2D">2D</button>
<button class="graphBtn" id="show3D">3D</button>
<button class="graphBtn" id="undo2D">Undo 2D</button>
<button class="graphBtn warn" id="clear2D">Clear 2D</button>
<button class="graphBtn" id="hideGraph">Close</button>
</div>

<div id="graph2D" class="graphArea">
<canvas id="canvas2D"></canvas>
</div>

<div id="graph3D" class="graphArea">
<canvas id="canvas3D"></canvas>
</div>

`;

   document.body.appendChild(calc);

   const display = document.getElementById("display");
   const canvas2D = document.getElementById("canvas2D");
   const ctx2D = canvas2D.getContext("2d");

   const canvas3D = document.getElementById("canvas3D");
   let threePromise = null;
   let threeReady = false;
   let threeRenderer = null;
   let threeScene = null;
   let threeCamera = null;
   let threeSurfaceMesh = null;
   let threeSurfaceMaterial = null;
   const orbitState = { theta: 0.7, phi: 1.05, radius: 30 };
   let orbitDragging = false;
   let orbitStartX = 0;
   let orbitStartY = 0;

   const graphLab = document.getElementById("graphLab");
   const graph2D = document.getElementById("graph2D");
   const graph3D = document.getElementById("graph3D");
   const show2DButton = document.getElementById("show2D");
   const show3DButton = document.getElementById("show3D");
   const clear2DButton = document.getElementById("clear2D");
   const undo2DButton = document.getElementById("undo2D");

   const sidebarEl = document.getElementById("sidebar");
   const sidebarHandle = document.getElementById("sidebarHandle");

   const historyBox = document.getElementById("history");

   const layout = [
      "7", "8", "9", "/", "sin", "cos",
      "4", "5", "6", "*", "tan", "log",
      "1", "2", "3", "-", "ln", "√",
      "0", ".", "π", "+", "^", "x²",
      "(", ")", "!", "graph", "C", "="
   ];

   layout.forEach(k => {
      const b = document.createElement("button");
      b.textContent = k;
      b.className = "btn";
      document.getElementById("buttons").appendChild(b);
      b.onclick = () => handle(k);
   });

   function factorial(n) {
      let r = 1;
      for (let i = 1; i <= n; i++) r *= i;
      return r;
   }

   function parse(expr) {

      return expr
         .replace(/π/g, "Math.PI")
         .replace(/√/g, "Math.sqrt")
         .replace(/sin/g, "Math.sin")
         .replace(/cos/g, "Math.cos")
         .replace(/tan/g, "Math.tan")
         .replace(/log/g, "Math.log10")
         .replace(/ln/g, "Math.log")
         .replace(/\^/g, "**")
         .replace(/(\d+)!/g, (m, n) => factorial(Number(n)));

   }

   function normalizeGraphExpression(expr, variableName) {
      const text = String(expr || "").trim();
      if (!text) return "";
      const assignment = new RegExp("^\\s*" + variableName + "\\s*=", "i");
      return text.replace(assignment, "").trim();
   }

   function evaluate(expr) {

      try {
         return Function("return " + parse(expr))();
      } catch {
         return "Error";
      }

   }

   function activateGraph(mode) {
      show2DButton.classList.toggle("active", mode === "2d");
      show3DButton.classList.toggle("active", mode === "3d");
   }

   function open2D() {
      graphLab.classList.add("open");
      graph3D.classList.remove("open");
      graph2D.classList.add("open");
      activateGraph("2d");
      draw2D();
   }

   function open3D() {
      graphLab.classList.add("open");
      graph2D.classList.remove("open");
      graph3D.classList.add("open");
      activateGraph("3d");
      draw3D(display.value).catch(() => {});
   }

   function closeGraphs() {
      graphLab.classList.remove("open");
      graph2D.classList.remove("open");
      graph3D.classList.remove("open");
      activateGraph();
   }

   function drawGrid() {

      canvas2D.width = canvas2D.clientWidth;
      canvas2D.height = 260;

      ctx2D.clearRect(0, 0, canvas2D.width, canvas2D.height);
      ctx2D.fillStyle = "#fff";
      ctx2D.fillRect(0, 0, canvas2D.width, canvas2D.height);

      const marginLeft = 42;
      const marginRight = 14;
      const marginTop = 14;
      const marginBottom = 28;

      const plotLeft = marginLeft;
      const plotTop = marginTop;
      const plotWidth = canvas2D.width - marginLeft - marginRight;
      const plotHeight = canvas2D.height - marginTop - marginBottom;
      const plotRight = plotLeft + plotWidth;
      const plotBottom = plotTop + plotHeight;

      const xSpan = GRAPH_MAX - GRAPH_MIN;
      const ySpan = GRAPH_MAX - GRAPH_MIN;
      const pixelsPerUnitX = plotWidth / xSpan;
      const pixelsPerUnitY = plotHeight / ySpan;

      const centerX = (plotLeft + plotRight) / 2 + offsetX;
      const centerY = (plotTop + plotBottom) / 2 + offsetY;

      function toScreenX(x) {
         return centerX + x * pixelsPerUnitX;
      }

      function toScreenY(y) {
         return centerY - y * pixelsPerUnitY;
      }

      function toMathX(px) {
         return (px - centerX) / pixelsPerUnitX;
      }

      function toMathY(py) {
         return (centerY - py) / pixelsPerUnitY;
      }

      // Bounded plotting rectangle.
      ctx2D.strokeStyle = "#c8c8c8";
      ctx2D.lineWidth = 1;
      ctx2D.strokeRect(plotLeft, plotTop, plotWidth, plotHeight);

      // Integer grid lines in the current visible bounded window.
      const minGridX = Math.ceil(toMathX(plotLeft));
      const maxGridX = Math.floor(toMathX(plotRight));
      const minGridY = Math.ceil(toMathY(plotBottom));
      const maxGridY = Math.floor(toMathY(plotTop));

      ctx2D.strokeStyle = "#ececec";
      for (let x = minGridX; x <= maxGridX; x++) {
         const sx = toScreenX(x);
         ctx2D.beginPath();
         ctx2D.moveTo(sx, plotTop);
         ctx2D.lineTo(sx, plotBottom);
         ctx2D.stroke();
      }

      for (let y = minGridY; y <= maxGridY; y++) {
         const sy = toScreenY(y);
         ctx2D.beginPath();
         ctx2D.moveTo(plotLeft, sy);
         ctx2D.lineTo(plotRight, sy);
         ctx2D.stroke();
      }

      // Axes.
      const axisX = toScreenX(0);
      const axisY = toScreenY(0);
      const axisXVisible = axisX >= plotLeft && axisX <= plotRight;
      const axisYVisible = axisY >= plotTop && axisY <= plotBottom;

      ctx2D.strokeStyle = "#444";
      ctx2D.lineWidth = 1.5;
      if (axisXVisible) {
         ctx2D.beginPath();
         ctx2D.moveTo(axisX, plotTop);
         ctx2D.lineTo(axisX, plotBottom);
         ctx2D.stroke();
      }

      if (axisYVisible) {
         ctx2D.beginPath();
         ctx2D.moveTo(plotLeft, axisY);
         ctx2D.lineTo(plotRight, axisY);
         ctx2D.stroke();
      }

      // Tick marks and labels on visible axes.
      ctx2D.fillStyle = "#333";
      ctx2D.font = "11px Arial";
      ctx2D.textAlign = "center";
      ctx2D.textBaseline = "top";

      if (axisYVisible) {
         for (let x = minGridX; x <= maxGridX; x++) {
            if (x === 0) continue;
            const sx = toScreenX(x);
            ctx2D.beginPath();
            ctx2D.moveTo(sx, axisY - 4);
            ctx2D.lineTo(sx, axisY + 4);
            ctx2D.stroke();
            ctx2D.fillText(String(x), sx, axisY + 6);
         }
      }

      if (axisXVisible) {
         ctx2D.textAlign = "left";
         ctx2D.textBaseline = "middle";
         for (let y = minGridY; y <= maxGridY; y++) {
            if (y === 0) continue;
            const sy = toScreenY(y);
            ctx2D.beginPath();
            ctx2D.moveTo(axisX - 4, sy);
            ctx2D.lineTo(axisX + 4, sy);
            ctx2D.stroke();
            ctx2D.fillText(String(y), axisX + 6, sy);
         }
      }

      // Axis labels.
      ctx2D.fillStyle = "#222";
      ctx2D.font = "bold 12px Arial";
      if (axisYVisible) {
         ctx2D.textAlign = "right";
         ctx2D.textBaseline = "bottom";
         ctx2D.fillText("x", plotRight - 4, axisY - 4);
      }
      if (axisXVisible) {
         ctx2D.textAlign = "left";
         ctx2D.textBaseline = "top";
         ctx2D.fillText("y", axisX + 6, plotTop + 4);
      }

      return {
         plotLeft,
         plotTop,
         plotRight,
         plotBottom,
         plotHeight,
         toMathX,
         toScreenY
      };
   }

   function draw2D() {

      const view = drawGrid();

      const discontinuityPx = view.plotHeight * 0.75;

      ctx2D.save();
      ctx2D.beginPath();
      ctx2D.rect(
         view.plotLeft,
         view.plotTop,
         view.plotRight - view.plotLeft,
         view.plotBottom - view.plotTop
      );
      ctx2D.clip();

      functions2D.forEach(fn => {

         ctx2D.beginPath();

         let lastValid = false;
         let lastPy = 0;
         const parsedFn = parse(fn);

         for (let px = Math.floor(view.plotLeft); px <= Math.ceil(view.plotRight); px++) {

            let x = view.toMathX(px);

            let expr = parsedFn.replace(/\bx\b/g, "(" + x + ")");

            let y;

            try {
               y = Function("return " + expr)();
            } catch {
               lastValid = false;
               continue;
            }

            y = Number(y);
            if (!Number.isFinite(y)) {
               lastValid = false;
               continue;
            }

            let py = view.toScreenY(y);
            if (!Number.isFinite(py)) {
               lastValid = false;
               continue;
            }

            if (!lastValid) {
               ctx2D.moveTo(px, py);
            } else if (Math.abs(py - lastPy) > discontinuityPx) {
               // Likely discontinuity/asymptote: start a new segment.
               ctx2D.moveTo(px, py);
            } else {
               ctx2D.lineTo(px, py);
            }

            lastPy = py;
            lastValid = true;

         }

         ctx2D.strokeStyle = "red";
         ctx2D.lineWidth = 2;
         ctx2D.stroke();

      });

      ctx2D.restore();
   }

   

function loadThree() {

    // If already loaded, return it
    if (window.THREE) return Promise.resolve(window.THREE);
    if (threePromise) return threePromise;

    // Dynamically import the module
    threePromise = import("https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js")
        .then(mod => {
            window.THREE = mod;
            return mod;
        })
        .catch(() => {
            throw new Error("Failed to load Three.js module");
        });

    return threePromise;
}

   function updateThreeCamera() {
      if (!threeCamera) return;
      const sinPhi = Math.sin(orbitState.phi);
      const cosPhi = Math.cos(orbitState.phi);
      const sinTheta = Math.sin(orbitState.theta);
      const cosTheta = Math.cos(orbitState.theta);

      threeCamera.position.set(
         orbitState.radius * sinPhi * cosTheta,
         orbitState.radius * cosPhi,
         orbitState.radius * sinPhi * sinTheta
      );
      threeCamera.lookAt(0, 0, 0);
   }

   function render3D() {
      if (!threeRenderer || !threeScene || !threeCamera) return;
      const w = canvas3D.clientWidth;
      const h = canvas3D.clientHeight || 260;
      threeRenderer.setSize(w, h, false);
      threeCamera.aspect = w / h;
      threeCamera.updateProjectionMatrix();
      threeRenderer.render(threeScene, threeCamera);
   }

   async function ensureThreeScene() {
      if (threeReady) return;
      const THREE = await loadThree();

      threeRenderer = new THREE.WebGLRenderer({
         canvas: canvas3D,
         antialias: true
      });
      threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      threeRenderer.setClearColor(0x101418, 1);

      threeScene = new THREE.Scene();
      threeScene.fog = new THREE.Fog(0x101418, 35, 90);
      threeCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
      updateThreeCamera();

      threeScene.add(new THREE.AmbientLight(0xffffff, 0.38));
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.05);
      dirLight.position.set(15, 20, 10);
      threeScene.add(dirLight);
      const fillLight = new THREE.DirectionalLight(0x9db4ff, 0.4);
      fillLight.position.set(-12, 8, -10);
      threeScene.add(fillLight);

      const span = GRAPH3D_MAX - GRAPH3D_MIN;
      const center = (GRAPH3D_MAX + GRAPH3D_MIN) / 2;
      const box = new THREE.Box3Helper(
         new THREE.Box3(
            new THREE.Vector3(GRAPH3D_MIN, GRAPH3D_MIN, GRAPH3D_MIN),
            new THREE.Vector3(GRAPH3D_MAX, GRAPH3D_MAX, GRAPH3D_MAX)
         ),
         0xb3b3b3
      );
      threeScene.add(box);

      const xAxis = new THREE.BufferGeometry().setFromPoints([
         new THREE.Vector3(GRAPH3D_MIN, 0, 0),
         new THREE.Vector3(GRAPH3D_MAX, 0, 0)
      ]);
      const yAxis = new THREE.BufferGeometry().setFromPoints([
         new THREE.Vector3(0, GRAPH3D_MIN, 0),
         new THREE.Vector3(0, GRAPH3D_MAX, 0)
      ]);
      const zAxis = new THREE.BufferGeometry().setFromPoints([
         new THREE.Vector3(0, 0, GRAPH3D_MIN),
         new THREE.Vector3(0, 0, GRAPH3D_MAX)
      ]);
      threeScene.add(new THREE.Line(xAxis, new THREE.LineBasicMaterial({ color: 0xe53935 })));
      threeScene.add(new THREE.Line(yAxis, new THREE.LineBasicMaterial({ color: 0x43a047 })));
      threeScene.add(new THREE.Line(zAxis, new THREE.LineBasicMaterial({ color: 0x1e88e5 })));

      const step = 2;
      const tickSize = 0.25;
      const tickMaterial = new THREE.LineBasicMaterial({ color: 0x777777 });
      for (let t = GRAPH3D_MIN; t <= GRAPH3D_MAX; t += step) {
         if (t === 0) continue;
         const xTick = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(t, -tickSize, 0),
            new THREE.Vector3(t, tickSize, 0)
         ]);
         const yTick = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-tickSize, t, 0),
            new THREE.Vector3(tickSize, t, 0)
         ]);
         const zTick = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, -tickSize, t),
            new THREE.Vector3(0, tickSize, t)
         ]);
         threeScene.add(new THREE.Line(xTick, tickMaterial));
         threeScene.add(new THREE.Line(yTick, tickMaterial));
         threeScene.add(new THREE.Line(zTick, tickMaterial));
      }

      const grid = new THREE.GridHelper(
         GRAPH3D_MAX - GRAPH3D_MIN,
         (GRAPH3D_MAX - GRAPH3D_MIN) / step,
         0x6a6a6a,
         0x3a3a3a
      );
      threeScene.add(grid);

      const planeGeom = new THREE.PlaneGeometry(span, span, 10, 10);
      const planeMat = new THREE.MeshBasicMaterial({
         color: 0xdedede,
         wireframe: true,
         transparent: true,
         opacity: 0.25
      });
      const plane = new THREE.Mesh(planeGeom, planeMat);
      plane.rotation.x = -Math.PI / 2;
      plane.position.set(center, 0, center);
      threeScene.add(plane);

      threeSurfaceMaterial = new THREE.MeshPhongMaterial({
         color: 0x4da6ff,
         side: THREE.DoubleSide,
         shininess: 55,
         transparent: true,
         opacity: 0.92
      });

      canvas3D.addEventListener("mousedown", e => {
         orbitDragging = true;
         orbitStartX = e.clientX;
         orbitStartY = e.clientY;
      });

      window.addEventListener("mousemove", e => {
         if (!orbitDragging) return;
         orbitState.theta -= (e.clientX - orbitStartX) * 0.01;
         orbitState.phi += (e.clientY - orbitStartY) * 0.01;
         orbitState.phi = Math.max(0.2, Math.min(Math.PI - 0.2, orbitState.phi));
         orbitStartX = e.clientX;
         orbitStartY = e.clientY;
         updateThreeCamera();
         render3D();
      });

      window.addEventListener("mouseup", () => {
         orbitDragging = false;
      });

      threeReady = true;
      render3D();
   }

   async function draw3D(expr) {
      await ensureThreeScene();
      const THREE = window.THREE || await loadThree();
      if (!THREE || !threeScene) return;

      if (threeSurfaceMesh) {
         threeScene.remove(threeSurfaceMesh);
         threeSurfaceMesh.geometry.dispose();
         threeSurfaceMesh = null;
      }

      const segments = 70;
      const size = segments + 1;
      const positions = new Float32Array(size * size * 3);
      const indices = [];
      const cleanExpr = normalizeGraphExpression(expr, "z");
      const parsed = parse(cleanExpr || "0");

      let idx = 0;
      for (let iy = 0; iy <= segments; iy++) {
         const y = GRAPH3D_MIN + (iy / segments) * (GRAPH3D_MAX - GRAPH3D_MIN);
         for (let ix = 0; ix <= segments; ix++) {
            const x = GRAPH3D_MIN + (ix / segments) * (GRAPH3D_MAX - GRAPH3D_MIN);
            let z = NaN;
            try {
               const e = parsed
                  .replace(/\bx\b/g, "(" + x + ")")
                  .replace(/\by\b/g, "(" + y + ")");
               z = Number(Function("return " + e)());
            } catch {
               z = NaN;
            }

            // No clamp: out-of-range z -> NaN so triangles are skipped (avoids flat "lip" at bounds).
            const height =
               Number.isFinite(z) && z >= GRAPH3D_MIN && z <= GRAPH3D_MAX ? z : NaN;
            positions[idx++] = x;
            positions[idx++] = height;
            positions[idx++] = y;
         }
      }

      function validVertex(i) {
         const yValue = positions[i * 3 + 1];
         return Number.isFinite(yValue);
      }

      for (let iy = 0; iy < segments; iy++) {
         for (let ix = 0; ix < segments; ix++) {
            const a = iy * size + ix;
            const b = a + 1;
            const c = a + size;
            const d = c + 1;
            if (validVertex(a) && validVertex(b) && validVertex(c)) {
               indices.push(a, c, b);
            }
            if (validVertex(b) && validVertex(c) && validVertex(d)) {
               indices.push(b, c, d);
            }
         }
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geom.setIndex(indices);
      geom.computeVertexNormals();
      threeSurfaceMesh = new THREE.Mesh(geom, threeSurfaceMaterial);
      threeScene.add(threeSurfaceMesh);

      const wire = new THREE.LineSegments(
         new THREE.WireframeGeometry(geom),
         new THREE.LineBasicMaterial({ color: 0x0f4b7a, transparent: true, opacity: 0.32 })
      );
      threeSurfaceMesh.add(wire);
      render3D();
   }

   function handle(k) {

      if (k === "C") {
         display.value = "";
         closeGraphs();
         return;
      }

      if (k === "=") {
         let r = evaluate(display.value);
         addHistory(display.value, r);
         display.value = r;
         return;
      }

      if (k === "graph") {
         const cleanExpr = normalizeGraphExpression(display.value, "y");
         if (!cleanExpr) return;
         functions2D.push(cleanExpr);
         open2D();
         return;
      }

      if (k === "π") {
         display.value += "π";
         return;
      }
      if (k === "x²") {
         display.value += "**2";
         return;
      }
      if (k === "√") {
         display.value += "√(";
         return;
      }

      if (["sin", "cos", "tan", "log", "ln"].includes(k)) {
         display.value += k + "(";
         return;
      }

      display.value += k;

   }

   function addHistory(e, r) {
      let d = document.createElement("div");
      d.textContent = e + " = " + r;
      historyBox.prepend(d);
   }

   document.getElementById("sciBtn").onclick = closeGraphs;
   document.getElementById("g2Btn").onclick = open2D;
   document.getElementById("g3Btn").onclick = () => open3D();
   document.getElementById("show2D").onclick = open2D;
   document.getElementById("show3D").onclick = open3D;
   clear2DButton.onclick = () => {
      functions2D = [];
      draw2D();
   };
   undo2DButton.onclick = () => {
      functions2D.pop();
      draw2D();
   };
   document.getElementById("hideGraph").onclick = closeGraphs;

   function setSidebarOpen(open) {
      calc.classList.toggle("sidebar-open", open);
   }

   sidebarHandle.addEventListener("mouseenter", () => setSidebarOpen(true));
   sidebarEl.addEventListener("mouseenter", () => setSidebarOpen(true));

   sidebarHandle.addEventListener("mouseleave", e => {
      const t = e.relatedTarget;
      if (t && (sidebarEl.contains(t) || sidebarHandle.contains(t))) return;
      setSidebarOpen(false);
   });

   sidebarEl.addEventListener("mouseleave", e => {
      const t = e.relatedTarget;
      if (t && (sidebarEl.contains(t) || sidebarHandle.contains(t))) return;
      setSidebarOpen(false);
   });

   canvas2D.addEventListener("wheel", e => {
      e.preventDefault();
   }, { passive: false });

   let dragging = false,
      startX, startY;

   canvas2D.onmousedown = e => {
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
   };

   window.onmouseup = () => dragging = false;

   window.onmousemove = e => {
      if (!dragging) return;

      offsetX += e.clientX - startX;
      offsetY += e.clientY - startY;

      startX = e.clientX;
      startY = e.clientY;

      draw2D();

   };

   const header = document.getElementById("header");
   const graphHeader = document.getElementById("graphHeader");

   let drag = false,
      ox, oy;

   header.onmousedown = e => {
      drag = true;
      ox = e.clientX - calc.offsetLeft;
      oy = e.clientY - calc.offsetTop;
   };

   document.onmousemove = e => {
      if (!drag) return;
      calc.style.left = e.clientX - ox + "px";
      calc.style.top = e.clientY - oy + "px";
   };

   document.onmouseup = () => drag = false;

   let graphDrag = false,
      graphOffsetX, graphOffsetY;

   graphHeader.onmousedown = e => {
      graphDrag = true;
      graphOffsetX = e.clientX - graphLab.offsetLeft;
      graphOffsetY = e.clientY - graphLab.offsetTop;
   };

   window.addEventListener("mousemove", e => {
      if (!graphDrag) return;
      graphLab.style.left = e.clientX - graphOffsetX + "px";
      graphLab.style.top = e.clientY - graphOffsetY + "px";
   });

   window.addEventListener("mouseup", () => graphDrag = false);

})();
