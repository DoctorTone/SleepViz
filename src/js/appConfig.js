// General parameters for this app

const APPCONFIG = {
    ROOT_ROTATE: Math.PI/4,
    BAR_COLOUR : 0xfff000,
    BAR_RADIUS: 0.75,
    BAR_HEIGHT: 5,
    BAR_WIDTH: 0.75,
    BAR_DEPTH: 0.75,
    BAR_SEGMENTS: 16,
    BAR_SCALE: 80,
    NUM_BARS_PER_ROW: 31,
    NUM_ATTRIBUTES: 5,
    ATTRIBUTE_INC_Z: 7.5,
    NUM_ROWS: 1,
    GROUND_WIDTH: 200,
    GROUND_HEIGHT: 200,
    GROUND_SEGMENTS: 128,
    GROUND_MATERIAL: 0xdddddd,
    barStartPos: {
        x: -25,
        y: 0,
        z: 7.5
    },
    BAR_INC_X: 5,
    BAR_INC_Z: 0,
    BAR_COLOURS: [
        0xaa0000,
        0x0000aa,
        0x00aa00,
        0xaaaa00,
        0x00aaaa
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
    LABEL_DATE_SCALE: {
        x: 2.5,
        y: 1.5,
        z: 1
    },
    LABEL_DATE_OFFSET: {
        x: 0,
        y: 0.75,
        z: 2.5
    },
    LABEL_MONTH_SCALE: {
        x: 5,
        y: 2,
        z: 1
    },
    LABEL_MONTH_OFFSET: {
        x: -7,
        y: 2,
        z: 0
    },
    LABEL_YEAR_OFFSET: {
        x: -15,
        y: 0,
        z: 0
    },
    VALUE_OFFSET: 5,
    VALUE_SCALE: {
        x: 5,
        y: 2,
        z: 1
    },
    RIGHT: 1,
    LEFT: 0,
    UP: 2,
    DOWN: 3,
    ZOOM_SPEED: 0.1
}

export { APPCONFIG };
