const _ = require('lodash');
const Chance = require('chance');
const integrity = require('./integrity');
const moment = require('moment');

const chance = new Chance();

exports.generateGeneralData = (amount) => {
    let items = [];
    let date = moment();
    _.times(amount, index => {
        date.subtract(10, 'minutes');
        let string = `${amount - index - 1};${date.format("YYYYMMDDHHmm")};${chance.integer({max: 35, min: -20})};${chance.integer({min: 990, max: 1020})};${chance.integer({min: 115, max: 130})};${chance.integer({min: 10, max: 50})}`;
        items.push(`${string}@${integrity.generateChecksum(string)}`);
    });
    items.reverse();
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