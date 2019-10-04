import $ from "jquery";
import * as THREE from "three";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { Line2 } from 'three/examples/jsm/lines/Line2';

import { BaseApp } from "./baseApp";
import { APPCONFIG } from "./appConfig";
import { SceneConfig } from "./sceneConfig";
import { LabelManager } from "./LabelManager";
import controlkit from "controlkit";
import bootstrap from "bootstrap";

import sleepData from "../../data/sleepData.json";

const attributes = ["Asleep", "Quality sleep", "Awake", "Deep sleep"];
const attributeDisplayNames = ["  Asleep", "  Quality", "  Awake", "  Deep "];

class Framework extends BaseApp {
    constructor() {
        super();
        this.barMaterials = [];
        this.attributeMaterials = [];
        this.labelManager = new LabelManager();
        this.cameraRotate = false;
        this.rotSpeed = Math.PI/20;
        this.rotDirection = 1;
        this.zoomingIn = false;
        this.zoomingOut = false;
        this.zoomSpeed = APPCONFIG.ZOOM_SPEED;

        //Temp variables
        this.tempVec = new THREE.Vector3();
        this.camRotateLeftRight = new THREE.Vector3(0, 1, 0);
        this.camRotateUpDown = new THREE.Vector3(1, 0, 0);
    }

    setContainer(container) {
        this.container = container;
    }

    init(container) {
        this.container = container;
        super.init(container);
    }

    addGroundPlane() {
        const groundGeom = new THREE.PlaneBufferGeometry(APPCONFIG.GROUND_WIDTH, APPCONFIG.GROUND_HEIGHT, APPCONFIG.GROUND_SEGMENTS);
        const gridTexture = this.textureLoader.load("./images/grid.gif");
        gridTexture.wrapS = gridTexture.wrapT = THREE.RepeatWrapping;
        gridTexture.repeat.set(4, 4);
        const groundMat = new THREE.MeshPhongMaterial( { color: APPCONFIG.GROUND_MATERIAL, map: gridTexture } );
        const ground = new THREE.Mesh(groundGeom, groundMat);
        ground.rotation.x = -Math.PI/2;
        ground.position.y = 0;
        ground.castShadow = true;
        ground.receiveShadow = true;
        this.root.add(ground);
    }

    createBarMaterials() {
        let barMaterial;
        for(let row=0; row<APPCONFIG.NUM_ROWS; ++row) {
            barMaterial = new THREE.MeshLambertMaterial( {color: APPCONFIG.BAR_COLOURS[row], flatShading: true} );
            this.barMaterials.push(barMaterial);
        }
    }

    createAttributeMaterials() {
        let barMaterial;
        for (let attribute=0; attribute<APPCONFIG.NUM_ATTRIBUTES; ++attribute) {
            barMaterial = new THREE.MeshPhongMaterial( {color: APPCONFIG.BAR_COLOURS[attribute], shininess: 0, specular: 0x222222 } );
            this.attributeMaterials.push(barMaterial);
        }
    }

    createGUI() {
        let attributeConfig = {
            Asleep: true,
            Quality: true,
            Awake: true,
            Deep: true
        };

        let trendConfig = {
            Asleep: false,
            Quality: false,
            Awake: false,
            Deep: false
        };

        let valueConfig = {
            Asleep: false,
            Quality: false,
            Awake: false,
            Deep: false
        };

        let scaleAttributeConfig = {
            Scale: 1,
            range: [0.1, 3]
        };

        let shadowConfig = {
            Shadows: true
        };

        let guiWidth = $('#guiWidth').css("width");
        guiWidth = parseInt(guiWidth, 10);
        let gui = new controlkit();
        gui.addPanel( {label: "Configuration", width: guiWidth, enable: false})
            .addSubGroup( {label: "Attributes", enable: false} )
                    .addCheckbox(attributeConfig, "Asleep", {
                        onChange: () => {
                            this.toggleAttribute("Asleep", "May");
                        }
                    })
                    .addCheckbox(attributeConfig, "Quality", {
                        onChange: () => {
                            this.toggleAttribute("Quality sleep", "May");
                        }
                    })
                    .addCheckbox(attributeConfig, "Awake", {
                        onChange: () => {
                            this.toggleAttribute("Awake", "May");
                        }
                    })
                    .addCheckbox(attributeConfig, "Deep", {
                        onChange: () => {
                            this.toggleAttribute("Deep sleep", "May");
                        }
                    })
            .addSubGroup( {label: "Trends", enable: false} )
                .addCheckbox(trendConfig, "Asleep", {
                    onChange: () => {
                        this.toggleTrend("Asleep");
                    }
                })
                .addCheckbox(trendConfig, "Quality", {
                    onChange: () => {
                        this.toggleTrend("Quality sleep");
                    }
                })
                .addCheckbox(trendConfig, "Awake", {
                    onChange: () => {
                        this.toggleTrend("Awake");
                    }
                })
                .addCheckbox(trendConfig, "Deep", {
                    onChange: () => {
                        this.toggleTrend("Deep sleep");
                    }
                })
            .addSubGroup( {label: "Scale", enable: false} )
                .addSlider(scaleAttributeConfig, "Scale", "range", {
                    onChange: () => {
                        this.scaleAttributes(scaleAttributeConfig.Scale);
                    },
                    onFinish: () => {
                        this.scaleAttributes(scaleAttributeConfig.Scale);
                    }
                })
            .addSubGroup( {label: "Values", enable: false} )
                .addCheckbox(valueConfig, "Asleep", {
                    onChange: () => {
                        this.toggleValues("Asleep");
                    }
                })
                .addCheckbox(valueConfig, "Quality", {
                    onChange: () => {
                        this.toggleValues("Quality sleep");
                    }
                })
                .addCheckbox(valueConfig, "Awake", {
                    onChange: () => {
                        this.toggleValues("Awake");
                    }
                })
                .addCheckbox(valueConfig, "Deep", {
                    onChange: () => {
                        this.toggleValues("Deep sleep");
                    }
                })
            .addSubGroup( {label: "Shadows", enable: false} )
                .addCheckbox(shadowConfig, "Shadows", {
                    onChange: () => {
                        this.toggleShadows();
                    }
                })
            
        this.gui = gui;
    }

    createScene() {
        // Init base createsScene
        super.createScene();

        // Create root object.
        this.root = new THREE.Object3D();
        this.addToScene(this.root);

        // Textures
        this.textureLoader = new THREE.TextureLoader();

        // Add ground
        this.addGroundPlane();

        // Show numerical sleep data
        this.showSleepData();

        // Add bars to scene
        const barGeom = new THREE.CylinderBufferGeometry(APPCONFIG.BAR_RADIUS, APPCONFIG.BAR_RADIUS, APPCONFIG.BAR_HEIGHT, APPCONFIG.BAR_SEGMENTS, APPCONFIG.BAR_SEGMENTS);
        //const barGeom = new THREE.BoxBufferGeometry(APPCONFIG.BAR_WIDTH, APPCONFIG.BAR_HEIGHT, APPCONFIG.BAR_DEPTH, APPCONFIG.BAR_SEGMENTS, APPCONFIG.BAR_SEGMENTS);
        const bars = [];
        this.createAttributeMaterials();
        let barMesh;
        let label;
        let labelProperty;
        let dayData;
        let minuteData;
        let startMonth = 4;
        let currentMonth = APPCONFIG.MONTHS[startMonth];
        let barStartPos = new THREE.Vector3();
        let monthData = sleepData[currentMonth];
        let height;
        let barScale;
        let barValue;

        // Groups
        let currentAttributeGroup;
        let attributeGroups = [];
        let currentValueGroup;
        let valueGroups = [];
        let currentTrendGroup;
        let trendGroups = [];

        // Lines
        let attributeLinePositions = [];
        

        // Set up groups
        // Group of groups
        const superGroup = new THREE.Group();
        superGroup.name = "SuperGroup";
        this.root.add(superGroup);

        for (let attribute=0; attribute<attributes.length; ++attribute) {
            // Attributes themselves
            currentAttributeGroup = new THREE.Group();
            currentAttributeGroup.name = attributes[attribute] + currentMonth + "Group";
            attributeGroups.push(currentAttributeGroup);
            superGroup.add(currentAttributeGroup);

            // Trends
            currentTrendGroup = new THREE.Group();
            currentTrendGroup.name = attributes[attribute] + "Trend" + currentMonth + "Group";
            currentTrendGroup.visible = false;
            trendGroups.push(currentTrendGroup);
            superGroup.add(currentTrendGroup);

            // Values
            currentValueGroup = new THREE.Group();
            currentValueGroup.name = attributes[attribute] + "Values" + currentMonth + "Group";
            currentValueGroup.visible = false;
            valueGroups.push(currentValueGroup);
            this.root.add(currentValueGroup);
        }

        // Lines
        let linePositions;
        for (let attribute=0; attribute<attributes.length; ++attribute) {
            linePositions = [];
            attributeLinePositions.push(linePositions);
        }

        for(let bar=0; bar<monthData.length; ++bar) {
            // Label properties
            labelProperty = {};
            labelProperty.position = new THREE.Vector3();

            // Create meshes
            barStartPos.set(APPCONFIG.barStartPos.x + (APPCONFIG.BAR_INC_X * bar), APPCONFIG.barStartPos.y, APPCONFIG.barStartPos.z);
            for (let attribute=0; attribute<attributes.length; ++attribute) {
                barMesh = new THREE.Mesh(barGeom, this.attributeMaterials[attribute]);
                barMesh.name = "bar" + bar + attributes[attribute] + currentMonth;
                barMesh.castShadow = true;
                barMesh.receiveShadow = true;
                bars.push(barMesh);
                barMesh.position.copy(barStartPos);
                barMesh.position.z += (attribute * APPCONFIG.ATTRIBUTE_INC_Z);
                dayData = monthData[bar];
                dayData = dayData[attributes[attribute]];
                barValue = dayData;
                dayData = dayData.split(":");
                dayData.hours = parseInt(dayData[0], 10);
                dayData.minutes = parseInt(dayData[1], 10);
                minuteData = (dayData.hours * 60) + dayData.minutes;
                if (minuteData === 0) {
                    minuteData = 0.1;
                }
                barScale = minuteData/APPCONFIG.BAR_SCALE;
                barMesh.scale.set(1, barScale, 1);
                height = barScale * (APPCONFIG.BAR_HEIGHT/2);
                barMesh.position.y = height;
                attributeGroups[attribute].add(barMesh);

                // Attribute labels
                if (bar === 0) {
                    labelProperty.position.copy(barMesh.position);
                    labelProperty.position.x += APPCONFIG.ATTRIBUTE_LABEL_OFFSET_X;
                    labelProperty.position.y = APPCONFIG.LABEL_Y_POS;
                    labelProperty.visibility = true;
                    labelProperty.scale = APPCONFIG.LABEL_MONTH_SCALE;
                    labelProperty.textColour =  "rgba(255, 255, 255, 1.0)",
                    label = this.labelManager.create("attributeLabel" + attributes[attribute], attributeDisplayNames[attribute], labelProperty);
                    this.root.add(label.getSprite());
                }

                // Month label
                if (bar === 0 && attribute === 1) {
                    labelProperty.position.copy(barMesh.position);
                    labelProperty.visibility = true;
                    labelProperty.scale = APPCONFIG.LABEL_MONTH_SCALE;
                    labelProperty.position.add(APPCONFIG.LABEL_MONTH_OFFSET);
                    labelProperty.textColour =  "rgba(0, 0, 0, 1.0)",
                    label = this.labelManager.create("monthLabel" + attributes[attribute] + currentMonth, currentMonth, labelProperty);
                    this.root.add(label.getSprite());
                }

                // Lines
                attributeLinePositions[attribute].push(barMesh.position.x, height * 2, barMesh.position.z);

                // Values
                labelProperty.position.copy(barMesh.position);
                labelProperty.position.y = height * 2;
                labelProperty.position.y += APPCONFIG.LABEL_VALUE_OFFSET;
                labelProperty.visibility = true;
                labelProperty.scale = APPCONFIG.LABEL_VALUE_SCALE;
                label = this.labelManager.create("valueLabel" + bar + attributes[attribute] + currentMonth, barValue, labelProperty);
                valueGroups[attribute].add(label.getSprite());
            }
            
            // Day labels
            labelProperty.position.copy(barMesh.position);
            labelProperty.position.add(APPCONFIG.LABEL_DATE_OFFSET);
            labelProperty.position.y = APPCONFIG.LABEL_Y_POS;
            labelProperty.visibility = true;
            labelProperty.scale = APPCONFIG.LABEL_DATE_SCALE;
            label = this.labelManager.create("dayLabel" + bar, monthData[bar].Day, labelProperty);
            this.root.add(label.getSprite());
        }

        this.bars = bars;

        // Lines
        const lineColour = new THREE.Color();
        lineColour.setHex(0xdadada);
        let lineColours = [];
        const numPositions = attributeLinePositions[0].length;
        for(let i=0; i<numPositions; ++i) {
            lineColours.push(lineColour.r, lineColour.g, lineColour.b);
        }

        let lineMat = new LineMaterial( {
            color: 0xffffff,
            linewidth: 10,
            vertexColors: THREE.VertexColors,
            dashed: false
        });

        lineMat.resolution.set( window.innerWidth, window.innerHeight );

        const numLineGeometries = attributeLinePositions.length;
        let lineGeom;
        let line;
        const scale = 1;
        let lineGeoms = [];
        for(let i=0; i<numLineGeometries; ++i) {
            lineGeom = new LineGeometry();
            lineGeom.setPositions(attributeLinePositions[i]);
            lineGeom.setColors(lineColours);
            lineGeoms.push(lineGeom);

            line = new Line2(lineGeom, lineMat);
            line.name = "Attribute" + i + "Trend";
            line.computeLineDistances();
            line.scale.set(scale, scale, scale);
            line.visible = true;
            trendGroups[i].add(line);
        }
        this.lineGeoms = lineGeoms;

        this.createGUI();
    }

    update() {
        let delta = this.clock.getDelta();

        if (this.cameraRotate) {
            this.tempVec.copy(this.camera.position);
            this.tempVec.sub(this.controls.target);
            this.tempVec.applyAxisAngle(this.camRotAxis, this.rotSpeed * this.rotDirection * delta);
            this.camera.position.copy(this.tempVec);
            this.camera.position.add(this.controls.target);
        }

        if(this.zoomingIn) {
            this.tempVec.copy(this.camera.position);
            this.tempVec.sub(this.controls.target);
            this.tempVec.multiplyScalar(this.zoomSpeed * -delta);
            this.camera.position.add(this.tempVec);
            //DEBUG
            //console.log("Root = ", this.root.position);
        }

        if(this.zoomingOut) {
            this.tempVec.copy(this.camera.position);
            this.tempVec.sub(this.controls.target);
            this.tempVec.multiplyScalar(this.zoomSpeed * delta);
            this.camera.position.add(this.tempVec);
            //DEBUG
            //console.log("Root = ", this.root.position);
        }

        super.update();
    }

    redrawScene(xIncrement, zIncrement) {
        const barsPerRow = APPCONFIG.NUM_BARS_PER_ROW;
        let currentBar;
        let currentLabel;
        let labelValue;
        for(let row=0; row<APPCONFIG.NUM_ROWS; ++row) {
            for(let bar=0; bar<barsPerRow; ++bar) {
                currentBar = this.bars[(row * barsPerRow) + bar];
                currentBar.position.x = APPCONFIG.barStartPos.x + (xIncrement * bar);
                currentBar.position.z = APPCONFIG.barStartPos.z + (zIncrement * row);

                // Value labels
                labelValue = (row * APPCONFIG.NUM_BARS_PER_ROW) + bar;
                currentLabel = this.labelManager.getLabel("valueLabel" + labelValue);
                if (currentLabel) {
                    currentLabel.setXPosition(currentBar.position.x);
                    currentLabel.setZPosition(currentBar.position.z);
                }

                // Month labels
                if (row === 0) {
                    currentLabel = this.labelManager.getLabel("monthLabel" + bar);
                    if (currentLabel) {
                        currentLabel.setXPosition(currentBar.position.x);
                    }
                }

                // Year labels
                if (bar === 0) {
                    currentLabel = this.labelManager.getLabel("yearLabel" + row);
                    if (currentLabel) {
                        currentLabel.setZPosition(currentBar.position.z);
                    }
                }
            }
        }
    }

    rotateCamera(status, direction) {
        switch (direction) {
            case APPCONFIG.RIGHT:
                this.rotDirection = 1;
                this.camRotAxis = this.camRotateLeftRight;
                break;

            case APPCONFIG.LEFT:
                this.rotDirection = -1;
                this.camRotAxis = this.camRotateLeftRight;
                break;

            case APPCONFIG.UP:
                this.rotDirection = -1;
                this.camRotAxis = this.camRotateUpDown;
                break;

            case APPCONFIG.DOWN:
                this.rotDirection = 1;
                this.camRotAxis = this.camRotateUpDown;
                break;

            default:
                break;
        };
         
        this.cameraRotate = status;
    }

    zoomIn(status) {
        this.zoomingIn = status;
    }

    zoomOut(status) {
        this.zoomingOut = status;
    }

    resetView() {
        this.controls.reset();
        this.camera.position.copy(SceneConfig.CameraPos);
        this.controls.target.copy(SceneConfig.LookAtPos);
    }

    redrawValueLabels(scale) {
        // Get all bars
        let currentBar;
        let height;
        let labelName;
        let currentLabel;
        for (let i=0, numBars=this.bars.length; i<numBars; ++i) {
            currentBar = this.bars[i];
            height = currentBar.position.y * 2 * scale;
            labelName = currentBar.name;
            labelName = labelName.slice(3);
            labelName = "valueLabel" + labelName;
            currentLabel = this.labelManager.getLabel(labelName);
            if (currentLabel) {
                currentLabel.setHeight(height + APPCONFIG.LABEL_VALUE_OFFSET);
            }
        }
    }
    
    toggleAttribute(attributeName, attributeMonth) {
        const currentGroupName = attributeName + attributeMonth + "Group";
        const currentAttribute = this.getObjectByName(currentGroupName);
        if (currentAttribute) {
            currentAttribute.visible = !currentAttribute.visible;
        }
        // Set value visibility
        /*
        let column;
        let label;
        for (let i=0; i<numYears; ++i) {
            column = monthNum + (i*APPCONFIG.NUM_BARS_PER_ROW);
            label = this.labelManager.getLabel("valueLabel" + column);
            if (label) {
                label.setVisibility(currentMonth.visible);
            }
        }
        */
    }

    toggleTransparency(year) {
        let currentYear = this.getObjectByName(year);
        if (currentYear) {
            let opacity = currentYear.children[0].material.opacity;
            opacity === 1 ? currentYear.children[0].material.opacity = 0.5 : currentYear.children[0].material.opacity = 1.0;
        }
    }

    toggleTrend(attributeName) {
        let currentTrend = this.getObjectByName(attributeName + "TrendMayGroup");
        if(currentTrend) {
            currentTrend.visible = !currentTrend.visible;
        }
    }

    toggleValues(attributeName) {
        let currentAttribute = this.getObjectByName(attributeName + "ValuesMayGroup");
        if (currentAttribute) {
            currentAttribute.visible = !currentAttribute.visible;
        }
    }

    toggleShadows() {
        this.directionalLight.castShadow = !this.directionalLight.castShadow;
    }

    scaleBars(xScale, zScale) {
        let scaledIncX = APPCONFIG.BAR_INC_X * xScale;
        let scaledIncZ = APPCONFIG.BAR_INC_Z * zScale;
        this.redrawScene(scaledIncX, scaledIncZ);
    }

    scaleAttributes(scale) {
        const attributeGroup = this.getObjectByName("SuperGroup");
        if (attributeGroup) {
            attributeGroup.scale.y = scale;
        }
        this.redrawValueLabels(scale);
    }

    showSleepData() {
        let startMonth = 4;
        let currentMonth = APPCONFIG.MONTHS[startMonth];
        let monthData = sleepData[currentMonth];
        let totalSleep = 0;
        let currentSleep;
        let numDays = monthData.length;
        for (let day=0; day<numDays; ++day) {
            currentSleep = monthData[day].Asleep;
            currentSleep = currentSleep.split(":");
            currentSleep.hours = parseInt(currentSleep[0], 10);
            currentSleep.minutes = parseInt(currentSleep[1], 10);
            currentSleep = (currentSleep.hours * 60) + currentSleep.minutes;
            totalSleep += currentSleep;
        }

        $("#sleep").html(totalSleep/numDays);
    }
}

$(document).ready( () => {
    
    const container = document.getElementById("WebGL-Output");
    const app = new Framework();
    app.setContainer(container);

    app.init(container);
    app.createScene();

    app.run();

    // Elements
    let rotateLeft = $("#rotateLeft");
    let rotateRight = $("#rotateRight");
    let rotateUp = $("#rotateUp");
    let rotateDown = $("#rotateDown");
    let zoomIn = $("#zoomIn");
    let zoomOut = $("#zoomOut");
    let reset = $("#reset");

    // Mouse interaction
    rotateLeft.on("mousedown", () => {
        app.rotateCamera(true, APPCONFIG.LEFT);
    });

    rotateLeft.on("mouseup", () => {
        app.rotateCamera(false);
    });

    rotateRight.on("mousedown", () => {
        app.rotateCamera(true, APPCONFIG.RIGHT);
    });

    rotateRight.on("mouseup", () => {
        app.rotateCamera(false);
    });

    rotateUp.on("mousedown", () => {
        app.rotateCamera(true, APPCONFIG.UP);
    });

    rotateUp.on("mouseup", () => {
        app.rotateCamera(false);
    });

    rotateDown.on("mousedown", () => {
        app.rotateCamera(true, APPCONFIG.DOWN);
    });

    rotateDown.on("mouseup", () => {
        app.rotateCamera(false);
    });

    zoomIn.on("mousedown", () => {
        app.zoomIn(true);
    });

    zoomIn.on("mouseup", () => {
        app.zoomIn(false);
    });

    zoomOut.on("mousedown", () => {
        app.zoomOut(true);
    });

    zoomOut.on("mouseup", () => {
        app.zoomOut(false);
    });

    zoomOut.on("mousedown", () => {
        app.zoomOut(true);
    });

    zoomOut.on("mouseup", () => {
        app.zoomOut(false);
    });

    // Touch interaction
    rotateLeft.on("touchstart", () => {
        app.rotateCamera(true, APPCONFIG.LEFT);
    });

    rotateLeft.on("touchend", () => {
        app.rotateCamera(false);
    });

    rotateRight.on("touchstart", () => {
        app.rotateCamera(true, APPCONFIG.RIGHT);
    });

    rotateRight.on("touchend", () => {
        app.rotateCamera(false);
    });

    rotateUp.on("touchstart", () => {
        app.rotateCamera(true, APPCONFIG.UP);
    });

    rotateUp.on("touchend", () => {
        app.rotateCamera(false);
    });

    rotateDown.on("touchstart", () => {
        app.rotateCamera(true, APPCONFIG.DOWN);
    });

    rotateDown.on("touchend", () => {
        app.rotateCamera(false);
    });

    zoomIn.on("touchstart", () => {
        app.zoomIn(true);
    });

    zoomIn.on("touchend", () => {
        app.zoomIn(false);
    });

    zoomOut.on("touchstart", () => {
        app.zoomOut(true);
    });

    zoomOut.on("touchend", () => {
        app.zoomOut(false);
    });

    reset.on("click", () => {
        app.resetView();
    });

    $("#info").on("click", () => {
        $("#infoModal").modal();
    });
});
