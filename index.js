'use strict';

const recurse = require('reftools/lib/recurse.js').recurse;
const clone = require('reftools/lib/clone.js').clone;
const jptr = require('reftools/lib/jptr.js').jptr;

function filter(obj,options) {

    const defaults = {};
    defaults.tags = ['x-internal'];
    defaults.inverse = false;
    defaults.strip = false;
    defaults.overrides = [];
    options = Object.assign({},defaults,options);

    let src = clone(obj);
    let filtered = {};
    let filteredpaths = [];
    recurse(src,{},function(obj,key,state){
        for (let override of options.overrides||[]) {
            if (key.startsWith(override)) {
                obj[key.substring(override.length)] = obj[key];

                if (options.strip) {
                    delete obj[key];
                }
            }
        }
        for (let tag of options.tags) {
            if (obj[key] && obj[key][tag]) {
                if (options.inverse) {
                    if (options.strip) {
                        delete obj[key][tag];
                    }
                    jptr(filtered,state.path,clone(obj[key]));
                }
                filteredpaths.push(state.path);
                delete obj[key];
                break;
            }
        }
    });
    recurse(src,{},function(obj,key,state){
        if (Array.isArray(obj[key])) {
            obj[key] = obj[key].filter(function(e){
                return typeof e !== 'undefined';
            });
        }
    });
    recurse(src,{},function(obj,key,state){
        if (obj.hasOwnProperty('$ref') && filteredpaths.includes(obj['$ref'])) {
            if (Array.isArray(state.parent)) {
                state.parent.splice(state.pkey, 1);
            }
        }
    });
    if (options.inverse && options.valid) {
        if (src.swagger && !filtered.swagger) {
            filtered.swagger = src.swagger;
        }
        if (src.openapi && !filtered.openapi) {
            filtered.openapi = src.openapi;
        }
        if (src.info && (!filtered.info || !filtered.info.version || !filtered.info.title)) {
            filtered.info = Object.assign({}, filtered.info, { title: src.info.title, version: src.info.version });
        }
        if (!filtered.paths) filtered.paths = {};
    }
    return (options.inverse ? filtered : src);
    
}

module.exports = {
    filter : filter
};

