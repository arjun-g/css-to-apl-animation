/* Based on https://github.com/gibbok/keyframes-tool */

const css = require('css');
const R = require('ramda');

/**
 * Parse content of CSS input file and create an AST tree.
 */
let parse = data => {
    return new Promise((fulfill, reject) => {
        try {
            let parsedData = css.parse(data.toString(), { silent: false });
            fulfill(parsedData);
        } catch (err) {
            reject(err);
        }
    });
};

/**
 * Validate AST tree content.
 */
let validate = data => {
    return new Promise((fulfill, reject) => {
        try {
            let isStylesheet = data.type === 'stylesheet',
                hasNoParsingErrors = 'stylesheet' in data && data.stylesheet.parsingErrors.length === 0,
                hasKeyframes = R.any((rule) => rule.type === 'keyframes', data.stylesheet.rules);
            if (!isStylesheet || !hasNoParsingErrors || !hasKeyframes) {
                if (!isStylesheet) {
                    throw 'ast is not of type stylesheet';
                }
                if (!hasNoParsingErrors) {
                    R.map(err => console.log(new Error(`error: ${err}`)), data.stylesheet.parsingErrors);
                    throw 'file has parse error';
                }
                if (!hasKeyframes) {
                    throw 'no keyframes rules found';
                }
            }
            fulfill(data);
        } catch (err) {
            reject(err);
        }
    });
};

/**
 * Process AST tree content and a new data structure valid for Web Animation API KeyframeEffect.
 * The following code uses Ramda.js for traversing a complex AST tree,
 * an alternative and simplified version is visible at http://codepen.io/gibbok/pen/PbRrxp
 */
let processAST = data => {
    return new Promise((fulfill, reject) => {
        try {
            let processKeyframe = (vals, declarations) => [
                // map each value
                R.map(R.cond([
                    [R.equals('from'), R.always("0")],
                    [R.equals('to'), R.always("1")],
                    [R.T, R.pipe(
                        // covert `offset` to a string representing a decimal point
                        parseFloat, R.divide(R.__, 100),
                        R.toString()
                    )]
                ]), vals),
                // collect all property value pairs and merge in one object
                R.reduce(R.merge, {},
                    R.map(R.converge(R.objOf, [
                        R.prop('property'),
                        R.prop('value')
                    ]), declarations))
            ];

            let processAnimation = (offsets, transf) =>
                // process offset property
                R.map(R.pipe(
                    R.objOf('offset'),
                    R.merge(transf)), offsets);

            let getContentOfKeyframes = R.map(R.pipe(
                // process keyframes
                R.converge(processKeyframe, [
                    R.prop('values'),
                    R.prop('declarations')
                ]),
                // process animations
                R.converge(processAnimation, [
                    R.nth(0),
                    R.nth(1)
                ])));

            let transformAST = R.pipe(
                // get `stylesheet.rules` property
                R.path(['stylesheet', 'rules']),
                // get only object whose `type` property is `keyframes`
                R.filter(R.propEq('type', 'keyframes')),
                // map each item in `keyframes` collection
                // to an object `{name: keyframe.name, content: [contentOfkeyframes] }`
                R.map((keyframe) => ({
                    name: keyframe.name,
                    content: getContentOfKeyframes(keyframe.keyframes)
                })),
                // make a new object using animation `name` as keys
                // and using a flatten content as values
                R.converge(R.zipObj, [
                    R.map(R.prop('name')),
                    R.map(R.pipe(R.prop('content'), R.flatten))
                ])
            );

            // order by property `offset` ascending
            let orderByOffset = R.map(R.pipe(R.sortBy(R.prop('offset'))));

            // convert hyphenated properties to camelCase
            let convertToCamelCase = data => {
                let mapKeys = R.curry((fn, obj) =>
                    R.fromPairs(R.map(R.adjust(fn, 0), R.toPairs(obj)))
                ),
                    camelCase = (str) => str.replace(/[-_]([a-z])/g, (m) => m[1].toUpperCase())
                return R.map(R.map(mapKeys(camelCase)), data)
            };

            // convert `animationTimingFunction` to `easing` for compatibility with web animations api
            // and assign `easing` default value to `ease` when `animation-timing-function` from css file is not provided
            let convertToEasing = data => {
                const convert = data => {
                    const ease = R.prop('animationTimingFunction', data);
                    return R.dissoc('animationTimingFunction', R.assoc('easing', ease, data));
                };
                let result = R.map(R.map(convert))(data);
                return result;
            };

            // process
            let process = R.pipe(
                transformAST,
                orderByOffset,
                convertToCamelCase,
                convertToEasing
            );
            let result = process(data);
            fulfill(result);
        } catch (err) {
            reject(err);
        }
    });
};

let parseTransformString = data => {
    let result = {}, apl = {};
    for (var i in data = data.match(/(\w+\((\s*\-?\w+\%*\.?\w*e?\-?\w*,?)+\))+/g))
    {
        let c = data[i].match(/[\w\.\-\%]+/g);
        result[c.shift()] = c;
    }
    if(result.translate){
        apl['translateX'] = result.translate[0];
        apl['translateY'] = result.translate.length === 1 ? result.translate[0] : result.translate[1];
    }
    if(result.translate3d){
        apl['translateX'] = result.translate3d[0];
        apl['translateY'] = result.translate3d[1];
    }
    if(result.translateX){
        apl['translateX'] = result.translateX[0];
    }
    if(result.translateY){
        apl['translateY'] = result.translateY[0];
    }
    if(result.scale){
        apl['scaleX'] = parseFloat(result.scale[0]);
        apl['scaleY'] = result.scale.length === 1 ? parseFloat(result.scale[0]) : parseFloat(result.scale[1]);
    }
    if(result.scale3d){
        apl['scaleX'] = parseFloat(result.scale3d[0]);
        apl['scaleY'] = parseFloat(result.scale3d[1]);
    }
    if(result.scaleX){
        apl['scaleX'] = parseFloat(result.scaleX[0]);
    }
    if(result.scaleY){
        apl['scaleY'] = parseFloat(result.scaleY[0]);
    }
    if(result.rotate){
        apl['rotate'] = parseFloat(result.rotate[0]);
    }
    if(result.rotate3d){
        if(result.rotate3d[2] === "1")
            apl['rotate'] = parseFloat(result.rotate3d[3]);
    }
    if(result.rotateX){
        apl['rotate'] = parseFloat(result.rotateX[0]);
    }
    if(result.rotateY){
        apl['rotate'] = parseFloat(result.rotateY[0]);
    }
    if(result.skew){
        apl['skewX'] = parseFloat(result.skew[0]);
        apl['skewY'] = parseFloat(result.skew[1]);
    }
    if(result.skewX){
        apl['skewX'] = parseFloat(result.skewX[0]);
    }
    if(result.skewY){
        apl['skewY'] = parseFloat(result.skewY[0]);
    }
    let grouped = [
        {
            translateX: apl.translateX,
            translateY: apl.translateY
        },
        {
            rotate: apl.rotate
        },
        {
            scaleX: apl.scaleX,
            scaleY: apl.scaleY
        },
        {
            skewX: apl.skewX,
            skewY: apl.skewY
        }
    ];
    grouped = JSON.parse(JSON.stringify(grouped));
    return grouped.filter(group => Object.keys(group).length > 0);
}

function fixDecimalPrecision(value){
    return Math.round((value) * 1000) / 1000
}

let convertToAPL = data => {
    let apl = {
        type: "APL",
        version: "1.1.0",
        commands: {}
    };
    let commandbase = {
        parameters: [
            "duration",
            "delay"
        ],
        commands: []
    };
    Object.keys(data).forEach(name => {
        let command = Object.assign({}, commandbase);
        let css = data[name];
        command.commands = [];
        for(let i = 0; i < css.length; i++){
            if(css[i].transform)
                css[i].transform = parseTransformString(css[i].transform);
            if(css[i].offset)
                css[i].offset = parseFloat(css[i].offset);
        }
        for(let i = 0; i < css.length; i++){
            if(css[i].offset === 0) continue;
            let animateitem = {
                type: "AnimateItem",
                duration: `\${duration * ${css[i].offset}}`,
                delay: command.commands.length === 0 ? "${delay || 0}" : undefined,
                easing: css[i].easing,
                value: []
            };
            if(i === 0) animateitem.duration = `\${duration * ${css[i].offset}}`;
            else animateitem.duration = `\${duration * ${fixDecimalPrecision(css[i].offset - css[i - 1].offset)}}`;
            if(i > 0){
                if(css[i].transform){
                    animateitem.value.push({
                        property: "transform",
                        from: css[i - 1].transform,
                        to: css[i].transform
                    });
                }
                if(css[i].opacity){
                    animateitem.value.push({
                        property: "opacity",
                        from: Number(css[i - 1].opacity),
                        to: Number(css[i].opacity)
                    });
                }
            }
            command.commands.push(animateitem);
        }
        apl.commands[name] = command;
    });
    return Promise.resolve(apl);
}

/**
 * Initiate conversion process.
 */
let convert = ({ css }) => {
    return Promise.resolve(css)
    .then(data => {
        return parse(data);
    }).then(data => {
        return validate(data);
    }).then(data => {
        return processAST(data);
    }).then(data => {
        return convertToAPL(data);
    }).then(data => {
        return data;
    })
};

module.exports = { convert };