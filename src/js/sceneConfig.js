// General parameters to help with setting up scene

const SceneConfig = {
    clearColour: 0xcccccc,
    ambientLightColour: 0x444444,
    pointLightColour: 0xbbbbbb,
    LightPos: {
        x: 35,
        y: 30,
        z: 20
    },
    ShadowWidth: 20,
    ShadowMapSize: 512,
    CameraPos: {
        x: 0,
        y: 10,
        z: 30
    },
    LookAtPos: {
        x: 0,
        y: 0,
        z: 0
    },
    NEAR_PLANE: 0.1,
    FAR_PLANE: 10000,
    FOV: 45
};

export { SceneConfig };