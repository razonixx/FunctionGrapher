"use strict"

import * as THREE from './../node_modules/three/build/three.module.js';
import { OrbitControls } from './../node_modules/three/examples/jsm/controls/OrbitControls.js'

var canvas;
var renderer;
var scene;
var camera;
var light;
var mesh;
var xRange, yRange, zFunc;

// GRAPH PARAMETERS
var xMin = -10;
var xMax = 10;
var yMin = -10;
var yMax = 10;
var segments = 40;

var zFuncText = "sin(sqrt(x^2  + y^2))";

// GUI PARAMETERS
var gui, gui_zText, 
	gui_xMin, gui_xMax, gui_yMin, gui_yMax,
	gui_a, gui_b, gui_c, gui_d,
	gui_segments;

main();

function main()
{
    var parser = new Parser();
    canvas = document.getElementById("canvas");
    renderer = new THREE.WebGLRenderer({canvas: canvas});
    renderer.setSize(canvas.width, canvas.height);
    renderer.setClearColor("black");                     


    // LIGHTS
    light = new THREE.AmbientLight();    

    // CAMERAS
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.y = 40;
    var controls = new OrbitControls( camera, renderer.domElement );

    // SCENE
    scene = new THREE.Scene(); 
    scene.add(camera);
    scene.add(light);

    // CREATE GRAPH
    prepareGraph();

    // ACTION
    requestAnimationFrame(renderLoop);              // RENDER LOOP

    // CREATE GUI
	gui = new dat.GUI();
	
	var parameters = 
	{
		resetCam:  function() { resetCamera(); },	
		preset1:   function() { preset01(); },
        graphFunc: function() { prepareGraph(); },
        
        zFuncTextParam: zFuncText,
        xMinParam: xMin,
        xMaxParam: xMax,
        yMinParam: yMin,
        yMaxParam: yMax,
        quality: segments,
	};

	// GUI -- equation
    gui_zText = gui.add( parameters, 'zFuncTextParam' ).name('f(x,y) = ');
    gui_zText.onChange( function(value) { zFuncText = gui_zText.getValue(); /*console.log(zFuncText);*/} );
    
    gui_xMin = gui.add( parameters, 'xMinParam' ).name('x Min = ');
    gui_xMin.onChange( function(value) { xMin = gui_xMin.getValue(); /*console.log("xMin: " + xMin);*/} );
    
    gui_yMin = gui.add( parameters, 'yMinParam' ).name('y Min = ');
    gui_yMin.onChange( function(value) { yMin = gui_yMin.getValue(); /*console.log("yMin: " + yMin);*/} );
    
    gui_xMax = gui.add( parameters, 'xMaxParam' ).name('x Max = ');
    gui_xMax.onChange( function(value) { xMax = gui_xMax.getValue(); /*console.log("xMax: " + xMax);*/} );
    
    gui_yMax = gui.add( parameters, 'yMaxParam' ).name('y Max = ');
    gui_yMax.onChange( function(value) { yMax = gui_yMax.getValue(); /*console.log("yMax: " + yMax);*/} );
    
    gui_segments = gui.add( parameters, 'quality' ).name('Quality = ');
    gui_segments.onChange( function(value) { segments = gui_segments.getValue(); /*console.log("Quality: " + segments);*/} );

    gui.add( parameters, 'graphFunc' ).name("Graph Function");	
}

function renderLoop() {
    renderer.render(scene, camera);
    requestAnimationFrame(renderLoop);
}

function meshFunction(x, y, w) 
	{
		x = xRange * x + xMin;
		y = yRange * y + yMin;
		var z = zFunc(x,y);
        if ( isNaN(z) )
        {
            w.x = 0;
            w.y = 0;
            w.z = 0;
            return;
        }
        else
        {
            w.x = x;
            w.y = y;
            w.z = z;
            return;
        }
	};

function prepareGraph()
{
    console.log("Creatin graph: " + zFuncText)

    xRange = xMax - xMin;
	yRange = yMax - yMin;
	zFunc = Parser.parse(zFuncText).toJSFunction( ['x','y'] );
    
    var material = new THREE.MeshNormalMaterial({wireframe:true});  
    var geometry = new THREE.ParametricGeometry( meshFunction, segments, segments );
    geometry = new THREE.BufferGeometry().fromGeometry(geometry);
    
    if (mesh) 
	{
		scene.remove( mesh );
    }   
    
    mesh = new THREE.Mesh(geometry, material);   
    scene.add(mesh);                                
}