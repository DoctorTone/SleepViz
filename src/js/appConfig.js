// General parameters for this app

const APPCONFIG = {
    ROOT_ROTATE: Math.PI/4,
    BAR_COLOUR : 0xfff000,
    BAR_RADIUS: 5,
    BAR_HEIGHT: 10,
    BAR_SEGMENTS: 16,
    NUM_BARS_PER_ROW: 31,
    NUM_ATTRIBUTES: 2,
    ATTRIBUTE_INC_Z: 15,
    NUM_ROWS: 1,
    GROUND_WIDTH: 1800,
    GROUND_HEIGHT: 1000,
    GROUND_SEGMENTS: 16,
    GROUND_MATERIAL: 0xcbcbcb,
    barStartPos: {
        x: -100,
        y: 0,
        z: 0
    },
    BAR_INC_X: 30,
    BAR_INC_Z: 0,
    BAR_COLOURS: [
        0xff0000,
        0x00ff00,
        0x0000ff,
        0xffff00,
        0x00ffff
    ],
    MONTHS: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
    ],
    LABEL_SCALE: {
        x: 20,
        y: 5,
        z: 1
    },
    LABEL_HEIGHT: 2,
    LABEL_TEXTCOLOUR: "rgba(255, 255, 255, 1.0)",
    LABEL_MONTH_OFFSET: {
        x: 0,
        y: 0,
        z: 10
    },
    LABEL_YEAR_OFFSET: {
        x: -15,
        y: 0,
        z: 0
    },
    VALUE_OFFSET: 5,
    VALUE_SCALE: {
        x: 17.5,
        y: 8.5,
        z: 1
    },
    RIGHT: 1,
    LEFT: 0,
    UP: 2,
    DOWN: 3,
    ZOOM_SPEED: 0.1
}

export { APPCONFIG };
