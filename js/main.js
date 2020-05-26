"use strict"

import * as THREE from './../node_modules/three/build/three.module.js';
import { OrbitControls } from './../node_modules/three/examples/jsm/controls/OrbitControls.js'

var container;
var renderer;
var scene;
var camera;
var light;
var mesh;
var windowWidth, windowHeight;
var controls;
var axesHelper;

// GRAPH PARAMETERS
var xMin = -10;
var xMax = 10;
var yMin = -10;
var yMax = 10;
var segments = 40;

var isWireframe = false;
var isBasicMaterial = false;

var zFuncText = "sin(sqrt(x^2  + y^2))";
var xRange, yRange, zFunc;


// GUI PARAMETERS
var gui, gui_zText, 
	gui_xMin, gui_xMax, gui_yMin, gui_yMax,
    gui_segments,
    gui_Basic, gui_Wireframe,
    gui_Ex1, gui_Ex2, gui_Ex3;
    

// Views
var views = [
    {
        left: 0,
        bottom: 0.5,
        width: 0.5,
        height: 0.5,
        background: new THREE.Color(0, 0, 0),
        eye: [ 0, -25, 0 ],
        up: [ 0, 0, 1 ],
        fov: 60,
        updateCamera: function ( camera, scene ) {
          camera.lookAt( new THREE.Vector3(0, 0, 0) );
        }
    },
    {
        left: 0,
        bottom: 0.0,
        width: 0.5,
        height: 0.5,
        background: new THREE.Color(0, 0, 0),
        eye: [ 0, 0, 25 ],
        up: [ 0, 1, 0 ],
        fov: 60,
        updateCamera: function ( camera, scene ) {
          camera.lookAt( new THREE.Vector3(0, 0, 0) );
        }
    },
    {
        left: 0.5,
        bottom: 0,
        width: 0.5,
        height: 0.5,
        background: new THREE.Color(0, 0, 0),
        eye: [ -25, 0, 0 ],
        up: [ 0, 1, 0 ],
        fov: 60,
        updateCamera: function ( camera, scene ) {
            camera.lookAt( new THREE.Vector3(0, 0, 0) );
        }
    },
    {
        left: 0.5,
        bottom: 0.5,
        width: 0.5,
        height: 0.5,
        background: new THREE.Color(0, 0, 0),
        eye: [ 0, 0, 25 ],
        up: [ 0, 1, 0 ],
        fov: 60,
        updateCamera: function ( camera, scene ) {
          camera.lookAt( scene.position );
        }
    }
];

main();

function main()
{
    var parser = new Parser();
    container = document.getElementById( 'container' );
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );
    renderer.setClearColor("black");    
    
    for ( var ii = 0; ii < 4; ++ ii ) {
        var view = views[ ii ];
        var camera = new THREE.PerspectiveCamera( view.fov, window.innerWidth / window.innerHeight, 1, 10000 );
        if(ii == 3)
            controls = new OrbitControls( camera, renderer.domElement );
        camera.position.fromArray( view.eye );
        camera.up.fromArray( view.up );
        view.camera = camera;
    }

    // SCENE
    scene = new THREE.Scene(); 
    scene.add(camera);
    axesHelper = new THREE.AxesHelper(20);

    // CREATE GRAPH
    prepareGraph();

    // ACTION
    requestAnimationFrame(renderLoop);              // RENDER LOOP

    // CREATE GUI
	gui = new dat.GUI();
	
	var parameters = 
	{
        graphFunc: function() { prepareGraph(); },
        autoFocus: function() { focus(); },
        Ex1: function() { 
            zFuncText = "sin(x) * cos(y)"; 
            gui_zText.setValue(zFuncText);
            prepareGraph(); 
        },
        Ex2: function() { 
            zFuncText = "1-abs(x+y)-abs(y-x)"; 
            gui_zText.setValue(zFuncText);
            prepareGraph(); 
        },

        zFuncTextParam: zFuncText,
        xMinParam: xMin,
        xMaxParam: xMax,
        yMinParam: yMin,
        yMaxParam: yMax,
        quality: segments,

        wireframe: isWireframe,
        basic: isBasicMaterial,
	};

	// GUI
    gui_zText = gui.add( parameters, 'zFuncTextParam' ).name('f(x,y) = ');
    gui_zText.onChange( function(value) { zFuncText = gui_zText.getValue(); /*console.log(zFuncText);*/} );
    
    gui_xMin = gui.add( parameters, 'xMinParam' ).min(-30).max(30).step(1).name('x Min');
    gui_xMin.onChange( function(value) { xMin = gui_xMin.getValue(); prepareGraph();} );
    
    gui_yMin = gui.add( parameters, 'yMinParam' ).min(-30).max(30).step(1).name('y Min = ');
    gui_yMin.onChange( function(value) { yMin = gui_yMin.getValue(); prepareGraph();} );
    
    gui_xMax = gui.add( parameters, 'xMaxParam' ).min(-30).max(30).step(1).name('x Max = ');
    gui_xMax.onChange( function(value) { xMax = gui_xMax.getValue(); prepareGraph();} );
    
    gui_yMax = gui.add( parameters, 'yMaxParam' ).min(-30).max(30).step(1).name('y Max = ');
    gui_yMax.onChange( function(value) { yMax = gui_yMax.getValue(); prepareGraph();} );
    
    gui_segments = gui.add( parameters, 'quality' ).min(5).max(60).step(1).name('Quality = ');
    gui_segments.onChange( function(value) { segments = gui_segments.getValue(); prepareGraph();} );

    var gui_material = gui.addFolder('Material');
    gui_Basic = gui_material.add( parameters, 'basic' ).name('Basic Material');
    gui_Basic.onChange( function(value) { isBasicMaterial = gui_Basic.getValue(); prepareGraph();});

    gui_Wireframe = gui_material.add( parameters, 'wireframe' ).name('Wireframe');
    gui_Wireframe.onChange( function(value) { isWireframe = gui_Wireframe.getValue(); prepareGraph();});

    var gui_examples = gui.addFolder('Examples');
    gui_Ex1 = gui_examples.add( parameters, 'Ex1' ).name('Ex1: sin(x)*cos(y)');
    gui_Ex2 = gui_examples.add( parameters, 'Ex2' ).name('Ex2: Pyramid');

    gui.add( parameters, 'autoFocus').name("Auto Focus");
    gui.add( parameters, 'graphFunc' ).name("Graph Function");	
}

function focus()
{
    views[0].eye = [0, -(xRange>yRange?xRange:yRange), 0];
    views[0].camera.position.fromArray( views[0].eye );

    views[1].eye = [0, 0, (xRange>yRange?xRange:yRange)];
    views[1].camera.position.fromArray( views[1].eye );

    views[2].eye = [-(xRange>yRange?xRange:yRange), 0, 0];
    views[2].camera.position.fromArray( views[2].eye );
}

function updateSize()
{
    if ( windowWidth != window.innerWidth || windowHeight != window.innerHeight ) {

        windowWidth = window.innerWidth;
        windowHeight = window.innerHeight;

        renderer.setSize( windowWidth, windowHeight );
    }
}

function renderLoop() {
    updateSize();
    for ( var ii = 0; ii < views.length; ++ ii ) {

        var view = views[ ii ];
        var camera = view.camera;

        view.updateCamera( camera, scene);

        var left = Math.floor( windowWidth * view.left );
        var bottom = Math.floor( windowHeight * view.bottom );
        var width = Math.floor( windowWidth * view.width );
        var height = Math.floor( windowHeight * view.height );

        renderer.setViewport( left, bottom, width, height );
        renderer.setScissor( left, bottom, width, height );
        renderer.setScissorTest( true );
        renderer.setClearColor( view.background );

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.render( scene, camera );

    }
    controls.update();
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
    
    var material = isBasicMaterial?
                   new THREE.MeshBasicMaterial({wireframe: isWireframe}):
                   new THREE.MeshNormalMaterial({wireframe:isWireframe});  
    material.side = THREE.DoubleSide;
    var geometry = new THREE.ParametricGeometry( meshFunction, segments, segments );
    geometry = new THREE.BufferGeometry().fromGeometry(geometry);
    
    if (mesh) 
	{
		scene.remove( mesh );
    }   
    
    mesh = new THREE.Mesh(geometry, material);   
    mesh.add( axesHelper );
    scene.add(mesh);                                
}