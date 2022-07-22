// import * as THREE from 'three'
import {
    ACESFilmicToneMapping,
    AnimationClip,
    AnimationMixer,
    Clock,
    Euler,
    Group,
    HemisphereLight,
    InterpolateSmooth,
    LoopOnce,
    MathUtils,
    Mesh,
    MirroredRepeatWrapping,
    PerspectiveCamera,
    PlaneGeometry,
    PMREMGenerator,
    Quaternion,
    QuaternionKeyframeTrack,
    Scene, ShaderMaterial,
    SpotLight,
    TextureLoader,
    Vector3,
    VectorKeyframeTrack,
    WebGLRenderer,
} from 'three';

// todo
// level progress counter, high score, leaderboard, shop (irl money + bananas)

import {Water} from './objects/water'
import {Sky} from "three/examples/jsm/objects/Sky";
import * as joystick from 'nipplejs';
import {JoystickManager} from 'nipplejs';
import {garbageCollector} from "./game/garbageCollector";
import {moveCollectedBits} from "./game/physics";
import {
    crystalUiElement,
    nextLevel,
    nextLevelButton,
    progressUiElement,
    setProgress,
    shieldUiElement,
    showLevelEndScreen,
    startGameButton, startPanel,
    uiInit,
    updateLevelEndUI
} from './game/ui';
import {
    addBackgroundBit,
    addChallengeRow,
    challengeRows,
    environmentBits, mothershipModel,
    objectsInit,
    rocketModel,
    starterBay
} from "./game/objects";
import {isTouchDevice} from "./isTouchDevice";
import {detectCollisions} from "./game/collisionDetection";
import {Material} from "three/src/materials/Material";

import axios from 'axios'

export const scene = new Scene();
export const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
);
// Our three renderer
let renderer: WebGLRenderer;

export const destructionBits = new Array<Mesh>();

// Stores the current position of the camera, while the opening camera animation is playing
let cameraAngleStartAnimation = 0.00;

// The X Offset (left-to-right) of the rocket, as it moves within the scene
let positionOffset = 0.0;


let joystickManager: JoystickManager | null;

// The plane that shows our water
const waterGeometry = new PlaneGeometry(10000, 10000);

const water = new Water(
    waterGeometry,
    {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: new TextureLoader().load('static/normals/waternormals.jpeg', function (texture) {
            texture.wrapS = texture.wrapT = MirroredRepeatWrapping;
        }),
        sunDirection: new Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 3.7,
        fog: scene.fog !== undefined
    }
);

let distance = 0.0;
let leftPressed = false;
let rightPressed = false;


const sun = new Vector3();
const light = new HemisphereLight(0xffffff, 0x444444, 1.0);
light.position.set(0, 1, 0);
scene.add(light);
//
//console.log("\x1b[32m______________________██____________________________________________________");
//console.log("\x1b[32m__________________████░░████________________________________________________")
//console.log("\x1b[32m________________██▒▒▒▒▒▒▒▒▒▒████____________________________________________")
//console.log("\x1b[32m____________████▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒██__________________________________________")
//console.log("\x1b[32m__________██▒▒▒▒░░▒▒▒▒░░▒▒▒▒░░▒▒▒▒██________________________________________")
//console.log("\x1b[32m________██░░▒▒▒▒▒▒░░▒▒▒▒░░▒▒▒▒░░▒▒▒▒██______________________________________")
//console.log("\x1b[32m________██▒▒▒▒████▒▒▒▒▓▓██████▒▒▒▒▒▒▒▒██____________________________________")
//console.log("\x1b[32m______██▒▒▒▒██░░░░██▓▓██░░░░░░██▒▒▒▒▒▒██____________________________________")
//console.log("\x1b[32m______██▒▒██░░░░░░░░██░░░░░░░░░░██▒▒▒▒▒▒██__________________________________")
//console.log("\x1b[32m______██▒▒██░░░░░░░░░░░░░░░░░░░░░░██▒▒▒▒██__________________████████________")
//console.log("\x1b[32m____████▒▒██░░░░░░░░░░░░░░░░░░░░░░██▒▒████████____________██▒▒▒▒▒▒▒▒██______")
//console.log("\x1b[32m__██░░██▒▒██░░░░██░░░░░░██░░░░░░░░██▒▒██░░░░░░██________██░░████████▒▒██____")
//console.log("\x1b[32m__██░░██▒▒██░░░░██░░░░░░██░░░░░░██▒▒▒▒██░░░░░░██______██░░██________██▓▓██__")
//console.log("\x1b[32m__██░░██▒▒▒▒██____░░░░░░____░░██▒▒▒▒▒▒██░░░░░░██______██▒▒██__________████__")
//console.log("\x1b[32m____████▒▒██░░░░░░▒▒▒▒▒▒░░░░░░░░██▒▒▒▒████████________██▒▒██________________")
//console.log("\x1b[32m_____██▓▓██░░░░░░░░██░░░░░░░░░░░░██▒▒▓▓██____________██▒▒██_________________")
//console.log("\x1b[32m________████░░░░██░░██░░░░██░░░░░░██▒▒██▓▓████__________██▒▒██______________")
//console.log("\x1b[32m__________██░░░░░░████████░░░░░░██▓▓▒▒▒▒▒▒░░▒▒██__________██▒▒██____________")
//console.log("\x1b[32m____________██░░░░░░░░░░░░░░░░██▓▓▒▒▒▒▒▒▒▒▒▒▒▒░░██__________██▒▒██__________")
//console.log("\x1b[32m______________▓▓██░░░░░░██████▓▓██▒▒▒▒▒▒▓▓▒▒▒▒▒▒▒▒▓▓________██▒▒██__________")
//console.log("\x1b[32m______________██▓▓████████████▓▓██▒▒▒▒▒▒██▒▒▒▒▒▒▒▒██________██▒▒██__________")
//console.log("\x1b[32m______________██▒▒▒▒▓▓▓▓▒▒▒▒▓▓▓▓██▒▒▒▒▒▒██▓▓▓▓▒▒▒▒██________▓▓▒▒██__________")
//console.log("\x1b[32m______________██▒▒▒▒▓▓██▓▓▒▒▒▒▒▒██▒▒▒▒▒▒██▓▓▓▓▒▒▒▒▒▒██______▓▓▒▒██__________")
//console.log("\x1b[32m______________██▒▒▒▒██____██▒▒▒▒██▒▒▒▒▒▒██▓▓▓▓▒▒▒▒▒▒██____██▓▓██____________")
//console.log("\x1b[32m____________██▒▒▒▒▓▓██____██▒▒▒▒██▒▒▒▒▒▒██▓▓▓▓▒▒▒▒▒▒░░████▓▓██______________")
//console.log("\x1b[32m____________██▒▒▒▒▓▓██____██▒▒▒▒▒▒██▒▒▒▒▓▓████▓▓▒▒▒▒▒▒░░████________________")
//console.log("\x1b[32m____________██▒▒▓▓██____██░░▒▒▒▒▒▒██▒▒▒▒▓▓████▓▓▒▒▒▒▒▒▒▒▒▒██________________")
//console.log("\x1b[32m____________██▒▒▓▓██__██░░▒▒▒▒▒▒▓▓██▒▒▒▒▓▓████▓▓▓▓▒▒▒▒▒▒▒▒░░██______________")
//console.log("\x1b[32m____________██████████░░▒▒▒▒▒▒▓▓▓▓████████████████▓▓▒▒▒▒▒▒▒▒██______________")
//console.log("\x1b[32m____________██░░░░░░██▒▒▒▒▒▒▓▓▓▓████░░░░░░████____██▓▓▒▒▒▒▒▒░░██____________")
//console.log("\x1b[32m____________██░░░░░░██▒▒▒▒▒▒▓▓▓▓████░░░░░░▓▓▓▓____██▓▓▒▒▒▒▒▒░░▓▓____________")
//console.log("\x1b[32m____________██░░░░░░██▒▒▒▒▓▓▓▓██__██░░░░░░░░░░██__██▓▓▒▒▒▒▒▒▒▒██____________")
//console.log("\x1b[32m______________██████████████████____██████▓▓████__████████▓▓██████__________")
//console.log("\x1b[32m______________██░░██░░██░░░░░░░░██______________██░░░░░░░░██░░██░░██________")
//console.log("\x1b[32m______________████████████████████______________████████████████████________")
//console.log("\x1b[32m____________________________________________________________________________")
//

export const sceneConfiguration = {
    /// Whether the scene is ready (i.e.: All models have been loaded and can be used)
    ready: false,
    /// Whether the camera is moving from the beginning circular pattern to behind the ship
    cameraMovingToStartPosition: false,
    /// Whether the rocket is moving forward
    rocketMoving: false,
    // backgroundMoving: false,
    /// Collected game data
    data: {
        /// How many crystals the player has collected on this run
        crystalsCollected: 0,
        /// How many shields the player has collected on this run (can be as low as -5 if player hits rocks)
        shieldsCollected: 0,
    },
    /// The length of the current level, increases as levels go up
    courseLength: 500000,
    /// How far the player is through the current level, initialises to zero.
    courseProgress: 0,
    /// Whether the level has finished
    levelOver: false,
    /// The current level, initialises to one.
    level: 100,
    /// Gives the completion amount of the course thus far, from 0.0 to 1.0.
    coursePercentComplete: () => (sceneConfiguration.courseProgress / sceneConfiguration.courseLength),
    /// Whether the start animation is playing (the circular camera movement while looking at the ship)
    cameraStartAnimationPlaying: false,
    /// How many 'background bits' are in the scene (the cliffs)
    backgroundBitCount: 0,
    /// How many 'challenge rows' are in the scene (the rows that have rocks, shields, or crystals in them).
    challengeRowCount: 0,
    /// The current speed of the ship
    speed: 0.0
}


window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    updateWaterMaterial()
}

const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

const animate = () => {
    //this function limits framerate and therefore game speed. chage second value to chagne
    setTimeout( function() {
        requestAnimationFrame( animate );
    }, 1000 / 100 );


    if (leftPressed) {
        rocketModel.position.x -= 0.5;
    }

    if (rightPressed) {
        rocketModel.position.x += 0.5;
    }
    // If the joystick is in use, update the current location of the monke accordingly
    rocketModel.position.x += positionOffset;
    // Clamp the final position of the monke to an allowable region
    rocketModel.position.x = clamp(rocketModel.position.x, -20, 25);

//////////////////////////////////////////////////note
    if (sceneConfiguration.rocketMoving) {
        progressUiElement.style.width = String(sceneConfiguration.coursePercentComplete() * 200) + 'px';
        sceneConfiguration.speed += 0.001;
        sceneConfiguration.courseProgress += sceneConfiguration.speed;

        garbageCollector();
    }


    if (sceneConfiguration.ready) {
        if (rocketModel.userData?.mixer != null) {
            // debugger;
            rocketModel.userData?.mixer?.update(rocketModel.userData.clock.getDelta());
        }

        if (!sceneConfiguration.cameraStartAnimationPlaying) {
            camera.position.x = 20 * Math.cos(cameraAngleStartAnimation);
            camera.position.z = 20 * Math.sin(cameraAngleStartAnimation);
            camera.position.y = 30;
            // camera.position.y += 40;
            camera.lookAt(rocketModel.position);
            cameraAngleStartAnimation += 0.005;
        }
        if (sceneConfiguration.levelOver) {
            if (sceneConfiguration.speed > 0) {
                sceneConfiguration.speed -= 0.1;
            }
        }


        destructionBits.forEach(mesh => {
            if (mesh.userData.clock && mesh.userData.mixer) {
                // debugger;
                mesh.userData.mixer.update(mesh.userData.clock.getDelta());
            }
        });

        camera.userData?.mixer?.update(camera.userData?.clock?.getDelta());

        if (sceneConfiguration.rocketMoving) {
            // Detect if the monke has collided with any of the objects within the scene
            detectCollisions();

            // Move the rocks towards the player
            for (let i = 0; i < environmentBits.length; i++) {
                let mesh = environmentBits[i];
                mesh.position.z += sceneConfiguration.speed;
            }

            // Move the challenge rows towards the player
            for (let i = 0; i < challengeRows.length; i++) {
                challengeRows[i].rowParent.position.z += sceneConfiguration.speed;
            }

            // If the furtherest rock is less than a certain distance, create a new one on the horizon
            if ((!environmentBits.length || environmentBits[0].position.z > -1300) && !sceneConfiguration.levelOver) {
                addBackgroundBit(sceneConfiguration.backgroundBitCount++, true);
            }

            // If the furtherest challenge row is less than a certain distance, create a new one on the horizon
            if ((!challengeRows.length || challengeRows[0].rowParent.position.z > -1300) && !sceneConfiguration.levelOver) {
                addChallengeRow(sceneConfiguration.challengeRowCount++, true);
            }

            // If the starter bay hasn't already been removed from the scene, move it towards the player
            if (starterBay != null) {
                starterBay.position.z += sceneConfiguration.speed;
            }

            // If the starter bay is outside of the players' field of view, remove it from the scene
            if (starterBay.position.z > 200) {
                scene.remove(starterBay);
            }
        }

        // Call the function to relocate the current bits on the screen and move them towards the rocket
        // so it looks like the rocket is collecting them
        moveCollectedBits();
        // If the rockets progress equals the length of the course...
        if (sceneConfiguration.courseProgress >= sceneConfiguration.courseLength) {
            // ...check that we haven't already started the level-end process
            if (!rocketModel.userData.flyingAway) {
                // ...and end the level
                endLevel(false);
            }
        }
        // If the level end-scene is playing...
        if (rocketModel.userData.flyingAway) {
            // Rotate the camera to look at the rocket on it's return journey to the mothership
            camera.lookAt(rocketModel.position);
        }
    }
    updateWaterMaterial()
    renderer.render(scene, camera);

}

/// Initialisation for the scene
async function init() {
    renderer = new WebGLRenderer();
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)
    if (isTouchDevice()) {
        // Get the area within the UI to use as our joystick
        let touchZone = document.getElementById('joystick-zone');

        if (touchZone != null) {
            // Create a Joystick Manager
            joystickManager = joystick.create({zone: document.getElementById('joystick-zone')!,})
            // Register what to do when the joystick moves
            joystickManager.on("move", (event, data) => {
                positionOffset = data.vector.x;
            })
            // When the joystick isn't being interacted with anymore, stop moving the monke
            joystickManager.on('end', (event, data) => {
                positionOffset = 0.0;
            })
        }
    }

    startPanel.classList.remove('hidden');

    function ip() {
        console.log("|||||||||||||||||||||||||||||||||")

        const setIP = ""

        const getData = async () => {
            const res = await axios.get('https://checkip.amazonaws.com')
            console.log(res.data);
            setIP(res.data.IPv4)
        }
        console.log("client ip is " + ip)
    }


    nextLevelButton.onclick = (event) => {
        nextLevel();
        // sceneConfiguration.speed = 0.1;
        ip()
    }

    startGameButton.onclick = (event) => {
        // Indicate that the animation from the camera starting position to the monke location is running
        sceneConfiguration.cameraStartAnimationPlaying = true;
        // Remove the red text on the shield item, if it existed from the last level
        shieldUiElement.classList.remove('danger');
        // Show the heads up display (that shows crystals collected, etc) ui
        document.getElementById('headsUpDisplay')!.classList.remove('hidden');

        // Create an animation mixer on the monke model
        camera.userData.mixer = new AnimationMixer(camera);
        // Create an animation from the cameras' current position to behind the monke
        let track = new VectorKeyframeTrack('.position', [0, 2], [
            camera.position.x, // x 1
            camera.position.y, // y 1
            camera.position.z, // z 1
            0, // x 2
            30, // y 2
            100, // z 2
        ], InterpolateSmooth);

        // Create a Quaternion rotation for the "forwards" position on the camera
        let identityRotation = new Quaternion().setFromAxisAngle(new Vector3(-1, 0, 0), .3);

        // Create an animation clip that begins with the cameras' current rotation, and ends on the camera being
        // rotated towards the game space
        let rotationClip = new QuaternionKeyframeTrack('.quaternion', [0, 2], [
            camera.quaternion.x, camera.quaternion.y, camera.quaternion.z, camera.quaternion.w,
            identityRotation.x, identityRotation.y, identityRotation.z, identityRotation.w
        ]);

        // Associate both KeyFrameTracks to an AnimationClip, so they both play at the same time
        const animationClip = new AnimationClip('animateIn', 4, [track, rotationClip]);
        const animationAction = camera.userData.mixer.clipAction(animationClip);
        animationAction.setLoop(LoopOnce, 1);
        animationAction.clampWhenFinished = true;

        camera.userData.clock = new Clock();
        camera.userData.mixer.addEventListener('finished', function () {
            // Make sure the camera is facing in the right direction
            camera.lookAt(new Vector3(0, -500, -1400));
            // Indicate that the rocket has begun moving
            sceneConfiguration.rocketMoving = true;
        });

        // Play the animation
        camera.userData.mixer.clipAction(animationClip).play();
        // Remove the "start panel" (containing the play buttons) from view
        startPanel.classList.add('hidden');
    }

    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);


    setProgress('Scene loaded!');
    document.getElementById('loadingCover')?.remove();
    document.getElementById('loadingTextContainer')?.remove();
    document.getElementById('rocketPicture')?.remove();

    // Water
    water.rotation.x = -Math.PI / 2;
    water.rotation.z = 0;

    scene.add(water);
    // Create the skybox
    const sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);

    // Set up variables to control the look of the sky
    const skyUniforms = sky.material.uniforms;
    skyUniforms['turbidity'].value = 10;
    skyUniforms['rayleigh'].value = 2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;

    const parameters = {
        elevation: 3,
        azimuth: 115
    };

    const pmremGenerator = new PMREMGenerator(renderer);

    const phi = MathUtils.degToRad(90 - parameters.elevation);
    const theta = MathUtils.degToRad(parameters.azimuth);

    sun.setFromSphericalCoords(1, phi, theta);

    sky.material.uniforms['sunPosition'].value.copy(sun);
    (water.material as ShaderMaterial).uniforms['sunDirection'].value.copy(sun).normalize();
    scene.environment = pmremGenerator.fromScene(sky as any).texture;


    (water.material as ShaderMaterial).uniforms['speed'].value = 0.0;


    // Create some lighting for the foreground of the scene
    const shadowLight = new SpotLight();
    shadowLight.lookAt(rocketModel.position);
    shadowLight.position.z = 50;
    shadowLight.position.y = 100;
    shadowLight.position.x = 100;
    shadowLight.castShadow = true;
    scene.add(shadowLight);

    // Set the appropriate scale for our monke
    rocketModel.scale.set(6, 6, 6);
    scene.add(rocketModel);
    scene.add(mothershipModel);

    // Set the scale and location for our mothership (above the player)
    mothershipModel.position.y = 150;
    mothershipModel.position.z = 150;
    mothershipModel.scale.set(15,15,15);
    sceneConfiguration.ready = true;
    sceneSetup(sceneConfiguration.level);
}

export const endLevel = (damaged: boolean) => {
    updateLevelEndUI(damaged);
    sceneConfiguration.rocketMoving = false;
    sceneConfiguration.levelOver = true;
    rocketModel.userData.flyingAway = true;
    destructionBits.forEach(x => {
        scene.remove(x);
    });
    destructionBits.length = 0;

    // make the camera look at the rocket before it flies away

    let destinationRotation = camera.position;
    let cubeLook = new Group();
    let rocketPositionCopy = rocketModel.position.clone();
    cubeLook.position.copy(rocketPositionCopy);
    cubeLook.lookAt(rocketModel.position);
    let lookAtRocketQuaternion = cubeLook.quaternion;

    let cameraRotationTrack = new QuaternionKeyframeTrack('.quaternion', [0, 2], [
        camera.quaternion.x,
        camera.quaternion.y,
        camera.quaternion.z,
        camera.quaternion.w,
        lookAtRocketQuaternion.x,
        lookAtRocketQuaternion.y,
        lookAtRocketQuaternion.z,
        lookAtRocketQuaternion.w,
    ])

    const lookAtRocketAnimationClip = new AnimationClip('lookAtRocket', 2, [cameraRotationTrack]);
    const lookAtRocketAnimationAction = camera.userData.mixer.clipAction(lookAtRocketAnimationClip);
    lookAtRocketAnimationAction.setLoop(LoopOnce, 1);
    lookAtRocketAnimationAction.clampWhenFinished = true;
    lookAtRocketAnimationAction.play();

    rocketModel.userData.mixer = new AnimationMixer(rocketModel);
    let track = new VectorKeyframeTrack('.position', [2, 3, 5], [
        rocketModel.position.x, rocketModel.position.y, rocketModel.position.z,
        20, 100, 20,
        40, 400, 100
    ]);

    let destinationQuaternion = new Quaternion().setFromEuler(new Euler(-90, 0, -90))

    let rotationTrack = new QuaternionKeyframeTrack('.quaternion', [0, 2], [
        rocketModel.quaternion.x,
        rocketModel.quaternion.y,
        rocketModel.quaternion.z,
        rocketModel.quaternion.w,
        destinationQuaternion.x,
        destinationQuaternion.y,
        destinationQuaternion.z,
        destinationQuaternion.w
    ]);

    rocketModel.userData.clock = new Clock();

    const animationClip = new AnimationClip('flyAway', 6, [track, rotationTrack]);
    const animationAction = rocketModel.userData.mixer.clipAction(animationClip);
    animationAction.setLoop(LoopOnce, 1);
    animationAction.clampWhenFinished = true;

    rocketModel.userData.mixer.addEventListener('finished', function () {
        showLevelEndScreen();
        console.log(sceneConfiguration.data)
        console.log("1 " + sceneConfiguration.data.crystalsCollected)
    });
    animationAction.play();
}


function updateWaterMaterial() {
    (water.material as ShaderMaterial).uniforms['time'].value += 1 / 60.0;
    if (sceneConfiguration.rocketMoving) {
        (water.material as ShaderMaterial).uniforms['speed'].value += sceneConfiguration.speed / 50;
    }
}

function onKeyDown(event: KeyboardEvent) {
    //console.log('keypress');
    let keyCode = event.which;
    if (keyCode == 37) {
        leftPressed = true
    }
    else if (keyCode == 65) {
        leftPressed = true;
    }
    else if (keyCode == 39) {
        rightPressed = true;
    }
    else if (keyCode == 68) {
        rightPressed = true
    }

    
}

function onKeyUp(event: KeyboardEvent) {
    let keyCode = event.which;
    if (keyCode == 37) {
        leftPressed = false;
    } 
    else if (keyCode == 65) {
        leftPressed = false;
    }
    else if (keyCode == 39) {
        rightPressed = false;
    }
    else if (keyCode == 68) {
        rightPressed = false;
    }
}

export const sceneSetup = (level: number) => {
    // Remove all references to old "challenge rows" and background bits
    sceneConfiguration.challengeRowCount = 0;
    sceneConfiguration.backgroundBitCount = 0;

    // Reset the camera position back to slightly infront of the ship, for the start-up animation
    camera.position.z = 50;
    camera.position.y = 12;
    camera.position.x = 15;
    camera.rotation.y = 2.5;

    // Add the starter bay to the scene (the sandy shore with the rocks around it)
    scene.add(starterBay);

    // Set the starter bay position to be close to the ship
    starterBay.position.copy(new Vector3(10, 0, 120));

    // Rotate the rocket model back to the correct orientation to play the level
    rocketModel.rotation.x = Math.PI;
    rocketModel.rotation.z = Math.PI;

    // Set the location of the rocket model to be within the starter bay
    rocketModel.position.z = 70;
    rocketModel.position.y = 10;
    rocketModel.position.x = 0;

    // Remove any existing challenge rows from the scene
    challengeRows.forEach(x => {
        scene.remove(x.rowParent);
    });

    // Remove any existing environment bits from the scene
    environmentBits.forEach(x => {
        scene.remove(x);
    })

    // Setting the length of these arrays to zero clears the array of any values
    environmentBits.length = 0;
    challengeRows.length = 0;

    // Render some challenge rows and background bits into the distance
    for (let i = 0; i < 60; i++) {
        // debugger;
        addChallengeRow(sceneConfiguration.challengeRowCount++);
        addBackgroundBit(sceneConfiguration.backgroundBitCount++);
    }

    //Set the variables back to their beginning state

    // Indicates that the animation where the camera flies from the current position isn't playing
    sceneConfiguration.cameraStartAnimationPlaying = false;
    // The level isn't over (we just started it)
    sceneConfiguration.levelOver = false;
    // The rocket isn't flying away back to the mothership
    rocketModel.userData.flyingAway = false;
    // Resets the current progress of the course to 0, as we haven't yet started the level we're on
    sceneConfiguration.courseProgress = 0;
    // Sets the length of the course based on our current level
    sceneConfiguration.courseLength = 1000 * level;

    // Reset how many things we've collected in this level to zero
    sceneConfiguration.data.shieldsCollected = 0;
    sceneConfiguration.data.crystalsCollected = 0;

    // Updates the UI to show how many things we've collected to zero.
    crystalUiElement.innerText = String(sceneConfiguration.data.crystalsCollected);
    shieldUiElement.innerText = String(sceneConfiguration.data.shieldsCollected);

    // Sets the current level ID in the UI
    // we minus 99 as we start at level 100, and dont want the player to know how badly this is coded.
    document.getElementById('levelIndicator')!.innerText = `LEVEL ${sceneConfiguration.level - 99}`;
    // Indicates that the scene setup has completed, and the scene is now ready
    sceneConfiguration.ready = true;
}


objectsInit().then(x => {
    uiInit();
    init();
    animate();
})


