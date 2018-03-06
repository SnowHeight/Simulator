const _ = require('lodash');
const Chance = require('chance');
const integrity = require('./integrity');

const chance = new Chance();

exports.generateGeneralData = () => {
    let items = [];
    _.times(5000, index => {
        let string = `${index};201803020912;36;1005;124;22`;
        items.push(`${string}@${integrity.generateChecksum(string)}`);
    });
    return items;
};

exports.generateErrorLogs = () => {
    let items = '';
    _.times(20, index => {
        items += `${index};201803020912;tmp;number out of range\n`
    });
    return `[elogs]${items.substr(0, items.length - 1)}[/elogs]`;
};

exports.generateLaserData = () => {
    let items = '';
    _.times(100, measurementIndex => {
        _.times(50, positionIndex => {
            let string =  `${measurementIndex * 200 + positionIndex};201803020912;${measurementIndex};20`;
            items += `${string}@${integrity.generateChecksum(string)}\n`;
        });
    });
    return `[ldata]${items.substr(0, items.length - 1)}[/ldata]`;
};