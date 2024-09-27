"use strict";

const { vec3 } = glMatrix;
let gl;
let vertices = [];
let vertexColors = [];
let subdivisionLevel = 4;
let shapeType = "2d";
let rotationAngle = 60;
let applyTwist = false;
let radius = 1.0;
let enableRotation = false;
let rotationEffect = "none";

window.onload = function initialize() {
    const canvas = document.getElementById("gasketCanvas");
    const levelInput = document.getElementById("subdivisionLevel");
    const shapeButton = document.getElementById("applyShapeButton");
    const rotationButton = document.getElementById("applyRotationButton");
    const rotationInput = document.getElementById("rotationAngle");
    const resetButton = document.getElementById("resetButton");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available.");
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    if (shapeType === "2d" || shapeType === "wireframe") {
        const baseVertices = shapeType === "wireframe" && enableRotation ? [
            radius * Math.cos(Math.PI / 2), radius * Math.sin(Math.PI / 2), 0,
            radius * Math.cos(7 * Math.PI / 6), radius * Math.sin(7 * Math.PI / 6), 0,
            radius * Math.cos(11 * Math.PI / 6), radius * Math.sin(11 * Math.PI / 6), 0
        ] : [
            -1.0, -1.0, 0.0,
             0.0,  1.0, 0.0,
             1.0, -1.0, 0.0
        ];
        const [a, b, c] = [
            vec3.fromValues(...baseVertices.slice(0, 3)),
            vec3.fromValues(...baseVertices.slice(3, 6)),
            vec3.fromValues(...baseVertices.slice(6, 9))
        ];
        subdivideTriangle2D(a, b, c, subdivisionLevel);
        const program = initShaders(gl, "vertex-shader-2d", "fragment-shader-2d");
        gl.useProgram(program);
        const bufferId = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        const vPosition = gl.getAttribLocation(program, "aVertexPosition");
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        shapeType === "wireframe" ? renderWireframe() : render2D();
    } else {
        const baseVertices = [
            0.0, 0.0, -1.0,
            0.0, 0.9428, 0.3333,
            -0.8165, -0.4714, 0.3333,
            0.8165, -0.4714, 0.3333
        ];
        const [a, b, c, d] = [
            vec3.fromValues(...baseVertices.slice(0, 3)),
            vec3.fromValues(...baseVertices.slice(3, 6)),
            vec3.fromValues(...baseVertices.slice(6, 9)),
            vec3.fromValues(...baseVertices.slice(9, 12))
        ];
        subdivideTetrahedron3D(a, b, c, d, subdivisionLevel);
        gl.enable(gl.DEPTH_TEST);
        const program = initShaders(gl, "vertex-shader-3d", "fragment-shader-3d");
        gl.useProgram(program);
        const vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        const vPosition = gl.getAttribLocation(program, "aVertexPosition");
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        const cBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);
        const vColor = gl.getAttribLocation(program, "aVertexColor");
        gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vColor);

        render3D();
    }

    levelInput.onmouseup = function () {
        vertices = [];
        subdivisionLevel = levelInput.value;
        initialize();
    };

    shapeButton.onclick = function () {
        vertices = [];
        const shapeOptions = document.getElementsByName("shapeType");
        for (let option of shapeOptions) {
            if (option.checked) {
                shapeType = option.value;
            }
        }
        if (shapeType !== "wireframe") {
            enableRotation = false;
            applyTwist = false;
            document.getElementsByName("rotationEffect")[0].checked = true;
        }
        initialize();
    };

    rotationButton.onclick = function () {
        vertices = [];
        const rotationOptions = document.getElementsByName("rotationEffect");
        for (let option of rotationOptions) {
            if (option.checked) {
                rotationEffect = option.value;
            }
        }
		        if (rotationEffect === "none") {
		            enableRotation = false;
		            applyTwist = false;
		        } else if (rotationEffect === "taskD") {
		            enableRotation = true;
		            applyTwist = false;
		        } else if (rotationEffect === "taskE") {
		            enableRotation = true;
		            applyTwist = true;
		        }
		        initialize();
		    };
		
		    rotationInput.onmouseup = function () {
		        vertices = [];
		        rotationAngle = rotationInput.value;
		        initialize();
		    };
		
		    resetButton.onclick = function () {
		        vertices = [];
		        rotationAngle = 60;
		        shapeType = "2d";
		        enableRotation = false;
		        subdivisionLevel = document.getElementById("subdivisionLevel").value = 4;
		        document.getElementsByName("shapeType")[0].checked = true;
		        document.getElementsByName("rotationEffect")[0].checked = true;
		        document.getElementById("rotationAngle").value = 60;
		        initialize();
		    };
		};
		
		function drawTriangle2D(a, b, c) {
		    vertices.push(a[0], a[1], a[2]);
		    if (shapeType === "wireframe") vertices.push(b[0], b[1], b[2]);
		    vertices.push(b[0], b[1], b[2]);
		    if (shapeType === "wireframe") vertices.push(c[0], c[1], c[2]);
		    vertices.push(c[0], c[1], c[2]);
		    if (shapeType === "wireframe") vertices.push(a[0], a[1], a[2]);
		}
		
		function subdivideTriangle2D(a, b, c, count) {
		    if (count === 0) {
		        enableRotation ? twistTriangle(a, b, c) : drawTriangle2D(a, b, c);
		    } else {
		        const ab = vec3.create();
		        vec3.lerp(ab, a, b, 0.5);
		        const ac = vec3.create();
		        vec3.lerp(ac, a, c, 0.5);
		        const bc = vec3.create();
		        vec3.lerp(bc, b, c, 0.5);
		
		        --count;
		
		        subdivideTriangle2D(a, ab, ac, count);
		        subdivideTriangle2D(b, bc, ab, count);
		        subdivideTriangle2D(c, ac, bc, count);
		        if (shapeType === "wireframe") subdivideTriangle2D(ab, ac, bc, count);
		    }
		}
		
		function render2D() {
		    gl.clear(gl.COLOR_BUFFER_BIT);
		    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);
		}
		
		function drawTriangle3D(a, b, c, colorIndex) {
		    const baseColors = [
		        1.0, 0.0, 0.0,
		        0.0, 1.0, 0.0,
		        0.0, 0.0, 1.0,
		        0.0, 0.0, 0.0
		    ];
		
		    for (let i = 0; i < 3; i++) {
		        vertexColors.push(baseColors[colorIndex * 3 + i]);
		    }
		    for (let i = 0; i < 3; i++) vertices.push(a[i]);
		
		    for (let i = 0; i < 3; i++) {
		        vertexColors.push(baseColors[colorIndex * 3 + i]);
		    }
		    for (let i = 0; i < 3; i++) vertices.push(b[i]);
		
		    for (let i = 0; i < 3; i++) {
		        vertexColors.push(baseColors[colorIndex * 3 + i]);
		    }
		    for (let i = 0; i < 3; i++) vertices.push(c[i]);
		}
		
		function drawTetrahedron(a, b, c, d) {
		    drawTriangle3D(a, c, b, 0);
		    drawTriangle3D(a, c, d, 1);
		    drawTriangle3D(a, b, d, 2);
		    drawTriangle3D(b, c, d, 3);
		}
		
		function subdivideTetrahedron3D(a, b, c, d, count) {
		    if (count === 0) {
		        drawTetrahedron(a, b, c, d);
		    } else {
		        const ab = vec3.create();
		        vec3.lerp(ab, a, b, 0.5);
		        const ac = vec3.create();
		        vec3.lerp(ac, a, c, 0.5);
		        const ad = vec3.create();
		        vec3.lerp(ad, a, d, 0.5);
		        const bc = vec3.create();
		        vec3.lerp(bc, b, c, 0.5);
		        const bd = vec3.create();
		        vec3.lerp(bd, b, d, 0.5);
		        const cd = vec3.create();
		        vec3.lerp(cd, c, d, 0.5);
		
		        --count;
		
		        subdivideTetrahedron3D(a, ab, ac, ad, count);
		        subdivideTetrahedron3D(ab, b, bc, bd, count);
		        subdivideTetrahedron3D(ac, bc, c, cd, count);
		        subdivideTetrahedron3D(ad, bd, cd, d, count);
		    }
		}
		
		function render3D() {
		    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);
		}
		
		function twistTriangle(a, b, c) {
		    const origin = vec3.create();
		    vec3.zero(origin);
		    const radian = rotationAngle * Math.PI / 180.0;
		
		    const a_new = vec3.create();
		    const b_new = vec3.create();
		    const c_new = vec3.create();
		
		    if (rotationEffect === "taskD") {
		        vec3.rotateZ(a_new, a, origin, radian);
		        vec3.rotateZ(b_new, b, origin, radian);
		        vec3.rotateZ(c_new, c, origin, radian);
		    } else if (rotationEffect === "taskE") {
		        const d_a = Math.sqrt(a[0] * a[0] + a[1] * a[1]);
		        const d_b = Math.sqrt(b[0] * b[0] + b[1] * b[1]);
		        const d_c = Math.sqrt(c[0] * c[0] + c[1] * c[1]);
		
		        vec3.set(a_new, a[0] * Math.cos(d_a * radian) - a[1] * Math.sin(d_a * radian),
		            a[0] * Math.sin(d_a * radian) + a[1] * Math.cos(d_a * radian), 0);
		        vec3.set(b_new, b[0] * Math.cos(d_b * radian) - b[1] * Math.sin(d_b * radian),
		            b[0] * Math.sin(d_b * radian) + b[1] * Math.cos(d_b * radian), 0);
		        vec3.set(c_new, c[0] * Math.cos(d_c * radian) - c[1] * Math.sin(d_c * radian),
		            c[0] * Math.sin(d_c * radian) + c[1] * Math.cos(d_c * radian), 0);
		    }
		
		    vertices.push(a_new[0], a_new[1], a_new[2]);
		    vertices.push(b_new[0], b_new[1], b_new[2]);
		    vertices.push(b_new[0], b_new[1], b_new[2]);
		    vertices.push(c_new[0], c_new[1], c_new[2]);
		    vertices.push(c_new[0], c_new[1], c_new[2]);
		    vertices.push(a_new[0], a_new[1], a_new[2]);
		}
		
		function renderWireframe() {
		    gl.clear(gl.COLOR_BUFFER_BIT);
		    gl.drawArrays(gl.LINES, 0, vertices.length / 3);
		}
