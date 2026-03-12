(function() {

   if (document.getElementById("mathLab")) return;

   let functions2D = [];
   let scale = 40;
   let offsetX = 0;
   let offsetY = 0;

   let rotX = 0.8;
   let rotY = 0.6;
   let zoom3D = 40;

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
}

#mathLab:hover #sidebar{
left:0;
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

<div id="header">Console Math Lab</div>

<input id="display">

<div id="buttons"></div>

<div id="history"></div>

</div>

<div id="graphLab">
<div id="graphHeader">Graph Lab</div>
<div id="graphControls">
<button class="graphBtn" id="show2D">2D</button>
<button class="graphBtn" id="show3D">3D</button>
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
   const ctx3D = canvas3D.getContext("2d");

   const graphLab = document.getElementById("graphLab");
   const graph2D = document.getElementById("graph2D");
   const graph3D = document.getElementById("graph3D");
   const show2DButton = document.getElementById("show2D");
   const show3DButton = document.getElementById("show3D");

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
      draw3D(display.value);
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

      ctx2D.strokeStyle = "#ddd";

      for (let x = 0; x < canvas2D.width; x += scale) {
         ctx2D.beginPath();
         ctx2D.moveTo(x + offsetX % scale, 0);
         ctx2D.lineTo(x + offsetX % scale, canvas2D.height);
         ctx2D.stroke();
      }

      for (let y = 0; y < canvas2D.height; y += scale) {
         ctx2D.beginPath();
         ctx2D.moveTo(0, y + offsetY % scale);
         ctx2D.lineTo(canvas2D.width, y + offsetY % scale);
         ctx2D.stroke();
      }

   }

   function draw2D() {

      drawGrid();

      functions2D.forEach(fn => {

         ctx2D.beginPath();

         for (let px = 0; px < canvas2D.width; px++) {

            let x = (px - canvas2D.width / 2 - offsetX) / scale;

            let expr = parse(fn).replace(/x/g, "(" + x + ")");

            let y;

            try {
               y = Function("return " + expr)();
            } catch {
               continue;
            }

            let py = canvas2D.height / 2 - y * scale + offsetY;

            if (px === 0) ctx2D.moveTo(px, py);
            else ctx2D.lineTo(px, py);

         }

         ctx2D.strokeStyle = "red";
         ctx2D.stroke();

      });

   }

   function project(x, y, z) {

      let cx = Math.cos(rotY);
      let sx = Math.sin(rotY);
      let cy = Math.cos(rotX);
      let sy = Math.sin(rotX);

      let dx = cx * x - sx * z;
      let dz = sx * x + cx * z;

      let dy = cy * y - sy * dz;

      return {
         x: canvas3D.width / 2 + dx * zoom3D,
         y: canvas3D.height / 2 - dy * zoom3D
      };

   }

   function draw3D(expr) {

      canvas3D.width = canvas3D.clientWidth;
      canvas3D.height = 260;

      ctx3D.clearRect(0, 0, canvas3D.width, canvas3D.height);

      for (let x = -5; x < 5; x += 0.4) {

         for (let y = -5; y < 5; y += 0.4) {

            let e = parse(expr)
               .replace(/x/g, "(" + x + ")")
               .replace(/y/g, "(" + y + ")");

            let z;

            try {
               z = Function("return " + e)();
            } catch {
               continue;
            }

            let p = project(x, y, z);

            ctx3D.fillRect(p.x, p.y, 2, 2);

         }

      }

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
         functions2D.push(display.value);
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
   document.getElementById("hideGraph").onclick = closeGraphs;

   canvas2D.addEventListener("wheel", e => {
      e.preventDefault();
      scale += e.deltaY > 0 ? -2 : 2;
      scale = Math.max(10, Math.min(100, scale));
      draw2D();
   });

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

   let drag3D = false;

   canvas3D.onmousedown = e => {
      drag3D = true;
      startX = e.clientX;
      startY = e.clientY;
   };

   window.addEventListener("mousemove", e => {

      if (!drag3D) return;

      rotY += (e.clientX - startX) * 0.01;
      rotX += (e.clientY - startY) * 0.01;

      startX = e.clientX;
      startY = e.clientY;

      draw3D(display.value);

   });

   window.addEventListener("mouseup", () => drag3D = false);

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
