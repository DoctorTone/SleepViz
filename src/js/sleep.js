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
import { MonthlyConfig } from "./appConfig";
import bootstrap from "bootstrap";

import sleepData from "../../data/sleepData.json";

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
        this.animating = false;
        this.groupRotatingDown = false;
        this.groupRotatingUp = false;
        this.groupAnimatingDown = false;
        this.groupAnimatingUp = false;

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
                            this.toggleAttribute("Asleep");
                        }
                    })
                    .addCheckbox(attributeConfig, "Quality", {
                        onChange: () => {
                            this.toggleAttribute("Quality sleep");
                        }
                    })
                    .addCheckbox(attributeConfig, "Awake", {
                        onChange: () => {
                            this.toggleAttribute("Awake");
                        }
                    })
                    .addCheckbox(attributeConfig, "Deep", {
                        onChange: () => {
                            this.toggleAttribute("Deep sleep");
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

        this.createAttributeMaterials();
        
        this.currentMonthNumber = APPCONFIG.START_MONTH;
        this.currentMonthName = APPCONFIG.MONTHS[this.currentMonthNumber];

        this.createSceneGroups(this.currentMonthNumber, true);
        this.adjustCameraPosition();
        
        this.createGUI();

        // Show numerical sleep data
        this.showSleepData();
    }

    createSceneGroups(monthNumber, visible) {
        // See if groups exist
        let monthName = APPCONFIG.MONTHS[monthNumber];
        let currentMonthConfig = MonthlyConfig[monthName];
        if (currentMonthConfig.superGroup) return;

        // Create new groups
        const superGroup = new THREE.Group();
        superGroup.visible = visible;
        superGroup.name = "SuperGroup" + monthName;
        currentMonthConfig.superGroup = superGroup;
        this.root.add(superGroup);

        const labelGroup = new THREE.Group();
        labelGroup.visible = visible;
        labelGroup.name = "LabelGroup" + monthName;
        currentMonthConfig.labelGroup = labelGroup;
        this.root.add(labelGroup);
        let currentAttributeGroup;
        let attributeGroups = [];
        let currentValueGroup;
        let valueGroups = [];
        let currentTrendGroup;
        let trendGroups = [];

        for (let attribute=0; attribute<APPCONFIG.attributes.length; ++attribute) {
            // Attributes themselves
            currentAttributeGroup = new THREE.Group();
            currentAttributeGroup.name = APPCONFIG.attributes[attribute] + monthName + "Group";
            attributeGroups.push(currentAttributeGroup);
            superGroup.add(currentAttributeGroup);

            // Trends
            currentTrendGroup = new THREE.Group();
            currentTrendGroup.name = APPCONFIG.attributes[attribute] + "Trend" + monthName + "Group";
            currentTrendGroup.visible = false;
            trendGroups.push(currentTrendGroup);
            superGroup.add(currentTrendGroup);

            // Values
            currentValueGroup = new THREE.Group();
            currentValueGroup.name = APPCONFIG.attributes[attribute] + "Values" + monthName + "Group";
            currentValueGroup.visible = false;
            valueGroups.push(currentValueGroup);
            labelGroup.add(currentValueGroup);
        }

        // Store in month config
        currentMonthConfig.attributeGroups = attributeGroups;
        currentMonthConfig.trendGroups = trendGroups;
        currentMonthConfig.valueGroups = valueGroups;

        // Add bars
        this.createBars(monthName);
        this.createLineGeometries(monthName);
    }

    createBars(monthName) {
        // Month data
        let monthData = sleepData[monthName];
        const numBars = monthData.length;
        let currentMonthConfig = MonthlyConfig[monthName];

        // Start position
        let startPosX = ((numBars/2) - 0.5) * -APPCONFIG.BAR_INC_X;
        let barStartPos = new THREE.Vector3();

        // Bars
        const barGeom = new THREE.CylinderBufferGeometry(APPCONFIG.BAR_RADIUS, APPCONFIG.BAR_RADIUS, APPCONFIG.BAR_HEIGHT, APPCONFIG.BAR_SEGMENTS, APPCONFIG.BAR_SEGMENTS);
        let barMesh;
        let bars = [];
        let barScale;
        let height;
        let barValue;

        // Day data
        let dayData;
        let minuteData;
        let label;
        let labelProperty;

        let labelGroup = this.getObjectByName("LabelGroup" + monthName);

        // Lines
        let attributeLinePositions = [];
        let linePositions;
        for (let attribute=0; attribute<APPCONFIG.attributes.length; ++attribute) {
            linePositions = [];
            attributeLinePositions.push(linePositions);
        }
        MonthlyConfig[monthName].attributeLinePositions = attributeLinePositions;

        for(let bar=0; bar<numBars; ++bar) {
            // Label properties
            labelProperty = {};
            labelProperty.position = new THREE.Vector3();

            // Create meshes
            barStartPos.set(startPosX + (APPCONFIG.BAR_INC_X * bar), barStartPos.y, barStartPos.z);
            for (let attribute=0; attribute<APPCONFIG.attributes.length; ++attribute) {
                barMesh = new THREE.Mesh(barGeom, this.attributeMaterials[attribute]);
                barMesh.name = "bar" + bar + APPCONFIG.attributes[attribute] + monthName;
                barMesh.castShadow = true;
                barMesh.receiveShadow = true;
                bars.push(barMesh);
                barMesh.position.copy(barStartPos);
                barMesh.position.z += (attribute * APPCONFIG.ATTRIBUTE_INC_Z);
                dayData = monthData[bar];
                dayData = dayData[APPCONFIG.attributes[attribute]];
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
                currentMonthConfig.attributeGroups[attribute].add(barMesh);

                // Attribute labels
                if (bar === 0) {
                    labelProperty.position.copy(barMesh.position);
                    labelProperty.position.x += APPCONFIG.ATTRIBUTE_LABEL_OFFSET_X;
                    labelProperty.position.y = APPCONFIG.LABEL_Y_POS;
                    labelProperty.visibility = true;
                    labelProperty.scale = APPCONFIG.LABEL_MONTH_SCALE;
                    labelProperty.textColour =  "rgba(255, 255, 255, 1.0)",
                    label = this.labelManager.create("attributeLabel" + APPCONFIG.attributes[attribute], APPCONFIG.attributeDisplayNames[attribute], labelProperty);
                    labelGroup.add(label.getSprite());
                }

                // Month label
                if (bar === 0 && attribute === 1) {
                    labelProperty.position.copy(barMesh.position);
                    labelProperty.visibility = true;
                    labelProperty.scale = APPCONFIG.LABEL_MONTH_SCALE;
                    labelProperty.position.add(APPCONFIG.LABEL_MONTH_OFFSET);
                    labelProperty.textColour =  "rgba(0, 0, 0, 1.0)",
                    label = this.labelManager.create("monthLabel" + APPCONFIG.attributes[attribute] + monthName, monthName, labelProperty);
                    labelGroup.add(label.getSprite());
                }

                // Lines
                attributeLinePositions[attribute].push(barMesh.position.x, height * 2, barMesh.position.z);

                // Values
                labelProperty.position.copy(barMesh.position);
                labelProperty.position.y = height * 2;
                labelProperty.position.y += APPCONFIG.LABEL_VALUE_OFFSET;
                labelProperty.visibility = true;
                labelProperty.scale = APPCONFIG.LABEL_VALUE_SCALE;
                label = this.labelManager.create("valueLabel" + bar + APPCONFIG.attributes[attribute] + monthName, barValue, labelProperty);
                currentMonthConfig.valueGroups[attribute].add(label.getSprite());
            }
            
            // Day labels
            labelProperty.position.copy(barMesh.position);
            labelProperty.position.add(APPCONFIG.LABEL_DATE_OFFSET);
            labelProperty.position.y = APPCONFIG.LABEL_Y_POS;
            labelProperty.visibility = true;
            labelProperty.scale = APPCONFIG.LABEL_DATE_SCALE;
            label = this.labelManager.create("dayLabel" + bar, monthData[bar].Day, labelProperty);
            labelGroup.add(label.getSprite());
        }

        currentMonthConfig.bars = bars;
    }

    adjustCameraPosition() {
        // Calculate bounding sphere for group
        // Month data
        let monthData = sleepData[this.currentMonthName];
        const numBars = monthData.length;

        let bbox = new THREE.Box3().setFromObject(MonthlyConfig[this.currentMonthName].attributeGroups[3]);
        let bsphere = new THREE.Sphere();
        bbox.getBoundingSphere(bsphere);
        let cameraScale = numBars > 10 ? APPCONFIG.CAMERA_SCALE_LARGE : APPCONFIG.CAMERA_SCALE_SMALL;
        this.camera.position.z = bsphere.center.z + (bsphere.radius * cameraScale);
    }

    createLineGeometries(monthName) {
        // Monthly data
        let currentMonthConfig = MonthlyConfig[monthName];

        // Lines
        const lineColour = new THREE.Color();
        lineColour.setHex(0xdadada);
        let lineColours = [];
        const numPositions = currentMonthConfig.attributeLinePositions[0].length;
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

        const numLineGeometries = currentMonthConfig.attributeLinePositions.length;
        let lineGeom;
        let line;
        const scale = 1;

        for(let i=0; i<numLineGeometries; ++i) {
            lineGeom = new LineGeometry();
            lineGeom.setPositions(currentMonthConfig.attributeLinePositions[i]);
            lineGeom.setColors(lineColours);

            line = new Line2(lineGeom, lineMat);
            line.name = "Attribute" + i + "Trend";
            line.computeLineDistances();
            line.scale.set(scale, scale, scale);
            line.visible = true;
            currentMonthConfig.trendGroups[i].add(line);
        }
    }

    redrawScene(lastMonth) {
        // See if next scene is set up
        let currentMonthConfig = MonthlyConfig[this.currentMonthName];

        // Hide previous, show next
        let previousMonthName = APPCONFIG.MONTHS[lastMonth];
        MonthlyConfig[previousMonthName].superGroup.visible = false;
        MonthlyConfig[previousMonthName].labelGroup.visible = false;
        this.showSleepData();

        if (currentMonthConfig.superGroup) {
            //Show this month
            currentMonthConfig.superGroup.visible = true;
            currentMonthConfig.labelGroup.visible = true;
            this.adjustCameraPosition();

            return;
        }

        // Draw next month
        let topGroupName = "SuperGroup" + this.currentMonthName;
        if (this.getObjectByName(topGroupName)) return;

        // Group of groups
        const superGroup = new THREE.Group();
        superGroup.name = "SuperGroup" + this.currentMonthName;
        currentMonthConfig.superGroup = superGroup;
        this.root.add(superGroup);

        const labelGroup = new THREE.Group();
        labelGroup.name = "LabelGroup" + this.currentMonthName;
        currentMonthConfig.labelGroup = labelGroup;
        this.root.add(labelGroup);

        this.createSceneGroups(superGroup, labelGroup);

        this.createBars();

        this.adjustCameraPosition();

        this.createLineGeometries();
    }

    startRedraw() {
        let currentMonthConfig = MonthlyConfig[this.currentMonthName];
        this.animateGroup = currentMonthConfig.labelGroup;
        this.groupAnimatingDown = true;
    }

    rotateBars(direction) {
        let currentMonthConfig = MonthlyConfig[this.currentMonthName];
        this.rotateGroup = currentMonthConfig.superGroup;
        this.groupRotatingDown = direction;
        this.groupRotatingUp = !this.groupRotatingDown;
    }

    moveGroups() {
        let currentMonthConfig = MonthlyConfig[this.currentMonthName];
        currentMonthConfig.labelGroup.position.y = APPCONFIG.LABEL_ANIMATE_OFFSET;
        currentMonthConfig.labelGroup.visible = true;
        currentMonthConfig.superGroup.rotation.x = APPCONFIG.GROUP_ROTATE_OFFSET;
        currentMonthConfig.superGroup.visible = true;
    }

    setAnimateGroup() {
        let currentMonthConfig = MonthlyConfig[this.currentMonthName];
        let animateGroup = currentMonthConfig.labelGroup;

        return animateGroup;
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

        if (this.groupAnimatingDown) {
            this.animateGroup.position.y -= APPCONFIG.LABEL_ANIMATE_SPEED * delta;
            if (this.animateGroup.position.y <= APPCONFIG.LABEL_ANIMATE_OFFSET) {
                this.animateGroup.position.y = APPCONFIG.LABEL_ANIMATE_OFFSET;
                this.groupAnimatingDown = false;
                this.animateGroup.visible = false;
                this.animateGroup.position.y = 0;
                // Labels stopped animating
                this.rotateBars(APPCONFIG.ROTATE_DOWN);
            }
        }

        if (this.groupAnimatingUp) {
            this.animateGroup.position.y += APPCONFIG.LABEL_ANIMATE_SPEED * delta;
            if (this.animateGroup.position.y >= 0) {
                this.animateGroup.position.y = 0;
                this.groupAnimatingUp = false;
                this.animating = false;
            }
        }

        if (this.groupRotatingDown) {
            this.rotateGroup.rotation.x += APPCONFIG.GROUP_ROTATE_SPEED * -delta;
            if (this.rotateGroup.rotation.x <= -APPCONFIG.GROUP_ROTATE_OFFSET) {
                this.rotateGroup.rotation.x = APPCONFIG.GROUP_ROTATE_OFFSET;
                this.rotateGroup.visible = false;
                this.groupRotatingDown = false;
                this.rotateGroup.rotation.x = 0;
        
                // Rotate next set of bars
                this.currentMonthNumber = this.nextMonthNumber;
                this.currentMonthName = APPCONFIG.MONTHS[this.currentMonthNumber];
                this.moveGroups();
                this.rotateBars(APPCONFIG.ROTATE_UP);
            }
        }

        if (this.groupRotatingUp) {
            this.rotateGroup.rotation.x += APPCONFIG.GROUP_ROTATE_SPEED * -delta;
            if (this.rotateGroup.rotation.x <= 0) {
                this.rotateGroup.rotation.x = 0;
                this.groupRotatingUp = false;
                this.groupAnimatingUp = true;
                this.adjustCameraPosition();
                this.animateGroup = this.setAnimateGroup();
                this.showSleepData();
            }
        }

        super.update();
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
        let bars = MonthlyConfig[this.currentMonthName].bars;

        for (let i=0, numBars=bars.length; i<numBars; ++i) {
            currentBar = bars[i];
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
    
    toggleAttribute(attributeName) {
        const currentGroupName = attributeName + this.currentMonthName + "Group";
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
        let currentTrend = this.getObjectByName(attributeName + "Trend" + this.currentMonthName +"Group");
        if(currentTrend) {
            currentTrend.visible = !currentTrend.visible;
        }
    }

    toggleValues(attributeName) {
        let currentAttribute = this.getObjectByName(attributeName + "Values" + this.currentMonthName + "Group");
        if (currentAttribute) {
            currentAttribute.visible = !currentAttribute.visible;
        }
    }

    toggleShadows() {
        this.directionalLight.castShadow = !this.directionalLight.castShadow;
    }

    scaleAttributes(scale) {
        const attributeGroup = this.getObjectByName("SuperGroup" + this.currentMonthName);
        if (attributeGroup) {
            attributeGroup.scale.y = scale;
        }
        this.redrawValueLabels(scale);
    }

    nextMonth() {
        if (this.animating) return;

        this.animating = true;
        let monthNumber = this.currentMonthNumber + 1;
        if (monthNumber> APPCONFIG.LAST_MONTH) {
            monthNumber = APPCONFIG.START_MONTH;
        }
        this.nextMonthNumber = monthNumber;
        this.createSceneGroups(monthNumber, false);
        this.animationFinished = false;
        this.startRedraw();

        // DEBUG
        /*
        let lastMonth = this.currentMonthNumber;
        if (++this.currentMonthNumber > APPCONFIG.LAST_MONTH) {
            this.currentMonthNumber = APPCONFIG.START_MONTH;
        }

        this.currentMonthName = APPCONFIG.MONTHS[this.currentMonthNumber];
        */
        // this.redrawScene(lastMonth);
    }

    previousMonth() {
        if (this.animating) return;

        this.animating = true;
        let monthNumber = this.currentMonthNumber - 1;
        if (monthNumber < APPCONFIG.START_MONTH) {
            monthNumber = APPCONFIG.LAST_MONTH;
        }
        
        this.nextMonthNumber = monthNumber;
        this.createSceneGroups(monthNumber, false);
        this.animationFinished = false;
        this.startRedraw();
    }

    showSleepData() {
        let monthData = sleepData[this.currentMonthName];
        let totalSleep;
        let currentSleep;
        let currentAttribute;
        let numDays = monthData.length;
        const sleepTimes = [];
        for (let attribute=0; attribute<APPCONFIG.attributes.length; ++attribute) {
            currentAttribute = APPCONFIG.attributes[attribute];
            totalSleep = 0;
            for (let day=0; day<numDays; ++day) {
                currentSleep = monthData[day];
                currentSleep = currentSleep[currentAttribute];
                currentSleep = currentSleep.split(":");
                currentSleep.hours = parseInt(currentSleep[0], 10);
                currentSleep.minutes = parseInt(currentSleep[1], 10);
                currentSleep = (currentSleep.hours * 60) + currentSleep.minutes;
                totalSleep += currentSleep;
            }
            sleepTimes.push(totalSleep/numDays);
        }
        
        // Format sleep times
        let hours;
        let minutes;
        const sleepDisplay = [];
        for (let i=0, numTimes=sleepTimes.length; i<numTimes; ++i) {
            hours = Math.round(sleepTimes[i]/60);
            hours = hours.toString();
            hours += "h";
            minutes = Math.round(sleepTimes[i] % 60);
            minutes = minutes.toString();
            minutes += "mins";
            sleepDisplay.push(hours + " " + minutes);
        }
        $("#sleep").html(sleepDisplay[0]);
        $("#quality").html(sleepDisplay[1]);
        $("#awake").html(sleepDisplay[2]);
        $("#deep").html(sleepDisplay[3]);
    }

    openSideMenu() {
        document.getElementById("sideMenu").style.width = "250px";
        document.getElementById("WebGL-Output").style.marginLeft = "250px";
    }

    stopNotifications(elemList) {
        for(let i=0, numElems=elemList.length; i<numElems; ++i) {
            $('#' + elemList[i]).contextmenu(() => {
                return false;
            });
        }
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
    let monthRight = $("#monthRight");
    let monthLeft = $("#monthLeft");
    let sideMenu = $("#sideMenu");

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

    monthRight.on("click", () => {
        app.nextMonth();
    });

    monthLeft.on("click", () => {
        app.previousMonth();
    });

    sideMenu.on("click", () => {
        app.openSideMenu();
    });

    $("#info").on("click", () => {
        $("#infoModal").modal();
    });

    let elemList = ["rotate", "info", "sleepData"];
    app.stopNotifications(elemList);
});
