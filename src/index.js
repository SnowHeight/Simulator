const SerialPort = require('serialport');
const generator = require('./generator');
const _ = require('lodash');

const ITEMS_PER_PACKET = 500;

let port = new SerialPort('COM5', {baudRate: 115200}, function (err) {
    if (err) {
        return console.log('Error: ', err.message);
    }
});

let gdata = generator.generateGeneralData(3000);

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

port.on('data', function (data) {
    console.log('rec  < ' + JSON.stringify(data.toString()));
    collector += data.toString();
    checkForNewCommand();
});