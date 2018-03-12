const SerialPort = require('serialport');
const generator = require('./generator');
const Chance = require('chance');
const _ = require('lodash');

const chance = new Chance(Math.random());

const ITEMS_PER_PACKET = 500;
const MAX_ITEMS = 3500;
const MIN_ITEMS = 2500;

let port;

SerialPort.list().then(devices => {
    let device = null;
    if(process.argv[process.argv.length - 1].indexOf('COM') > -1) {
        device = process.argv[process.argv.length - 1];
    } else if(devices.length === 1) {
        console.log('no device specified but exactly one device was found: ' + devices[0].comName);
        device = devices[0].comName;
    } else {
        console.error('no device specified. the following devices were found', devices);
        process.exit(1);
    }
    port = new SerialPort(device, {baudRate: 115200}, function (err) {
        if (err) {
            return console.log('Error: ', err.message);
        } else {
            console.log('connected to the serial port\nthe simulator is running');
        }
    });

    port.on('data', function (data) {
        console.log('rec  < ' + JSON.stringify(data.toString()));
        collector += data.toString();
        checkForNewCommand();
    });
});

let gdata = generator.generateGeneralData(chance.integer({min: MIN_ITEMS, max: MAX_ITEMS}));

let collector = '';

function send(data) {
    console.log('send > ' + JSON.stringify(data));
    port.write(Buffer.from(data));
}

function checkForNewCommand() {
    if (collector.indexOf('[settings]') > -1) {
        collector = '';
        send('[settings]BluetoothName=HC-06;' +
            'BluetoothCode=1234;UltraSonicInterval=1;' +
            'LaserInterval=10;Height=150;ServoDrivingTime=100;' +
            'PowerSaveVoltage=12[/settings]');
    }
    if (collector.indexOf('[/savesettings]') > -1) {
        collector = '';
        send('[savesettings]');
    }
    if (collector.indexOf('[gdata:length]') > -1) {
        collector = '';
        send(`[gdata:length]${gdata.length}[/gdata:length]`);
    }
    if (collector.indexOf('[gdata:next]') > -1) {
        collector = '';
        _.times(ITEMS_PER_PACKET, () => {
            if (gdata.length) gdata.shift()
        });
        console.log('received gdata:next command ' + collector);
        send('[gdata:next]');
    }
    if (collector.indexOf('[gdata]') > -1) {
        collector = '';
        let arr = [];
        _.times(ITEMS_PER_PACKET, i => {
            if (gdata[i]) arr.push(gdata[i])
        });
        send(`[gdata]${arr.join('\n')}[/gdata]`);
    }
    if (collector.indexOf('[ldata]') > -1) {
        collector = '';
        let data = generator.generateLaserData();
        console.log('send > ' + data);
        port.write(Buffer.from(data));
    }
    if (collector.indexOf('[elogs]') > -1) {
        collector = '';
        let data = generator.generateErrorLogs();
        port.write(Buffer.from(data));
    }
    if (collector.indexOf('+DISC:SUCCESS\r\nOK\r\n') > -1) {
        console.log('disconnected ' + collector);
        collector = '';
    }
}

setInterval(() => {
    if(!gdata.length) {
        console.log('generating new data');
        gdata = generator.generateGeneralData(chance.integer({min: MIN_ITEMS, max: MAX_ITEMS}));
    }
}, 5000);
