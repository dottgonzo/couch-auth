"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rpj = require("request-promise-json");
var inquirer = require("inquirer");
var couchjsonconf_1 = require("couchjsonconf");
var couchServer;
function promptfor_newuser() {
    inquirer.prompt([{
            type: 'input',
            name: 'username',
            message: 'Insert username'
        },
        {
            type: 'password',
            message: 'Enter the new user password',
            name: 'password'
        }]).then(function (user) {
        inquirer.prompt([{
                type: 'confirm',
                name: 'confirm',
                message: 'Do you want to add the user ' + user.username + ' with password ' + user.password
            }]).then(function (answer) {
            if (answer.confirm) {
                console.log('create user ' + user.username + ' with password ' + user.password);
            }
            else {
                console.log('exit');
            }
        });
    });
}
function testserverandrun(server) {
    couchServer = new couchjsonconf_1.default({
        hostname: server.host,
        user: server.username,
        password: server.password
    });
    rpj.get(couchServer.my('app_main')).then(function (a) {
        inquirer.prompt([
            {
                type: 'list',
                name: 'todo',
                message: 'What do you want to do?',
                choices: [
                    'add new service',
                    'add new user'
                ],
                filter: function (val) {
                    return val.replace(/ /g, '').toLowerCase();
                }
            }
        ]).then(function (answer) {
            switch (answer.todo) {
                case 'addnewuser':
                    promptfor_newuser();
                    break;
            }
        });
    }).catch(function (err) {
        console.error('invalid host credentials');
        start();
    });
}
function start() {
    inquirer.prompt([
        {
            type: 'input',
            name: 'host',
            message: 'Insert server host'
        },
        {
            type: 'input',
            name: 'username',
            message: 'Insert username'
        },
        {
            type: 'password',
            message: 'Enter the new user password',
            name: 'password'
        },
        {
            type: 'list',
            name: 'port',
            message: 'What do you want to do?',
            choices: [
                '80',
                '5984',
                '443',
                'custom'
            ],
            filter: function (val) {
                if (val === 'custom')
                    val = 0;
                return parseInt(val);
            }
        }
    ]).then(function (server) {
        if (server && server.host && server.password && server.username) {
            if (server.port) {
                testserverandrun(server);
            }
            else {
                inquirer.prompt([
                    {
                        type: 'input',
                        name: 'customport',
                        message: 'Insert server custom port',
                        filter: function (val) {
                            return parseInt(val);
                        }
                    }
                ]).then(function (port) {
                    if (port && port.customport && port.customport > 0 && port.customport < 70000) {
                        server.port = port.customport;
                        testserverandrun(server);
                    }
                    else {
                        console.error('invalid custom port');
                        start();
                    }
                });
            }
        }
        else {
            console.error('incomplete host credentials');
            start();
        }
    });
}
start();

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QUFDLElBQUksSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO3dCQUM5RSxNQUFNLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUE7d0JBQzdCLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFBO29CQUMxQixDQUFDO29CQUFDLElBQUksQ0FBQyxDQUFDO3dCQUNOLE9BQU8sQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQTt3QkFDcEMsS0FBSyxFQUFFLENBQUE7b0JBQ1QsQ0FBQztnQkFDSCxDQUFDLENBQUMsQ0FBQTtZQUNOLENBQUM7UUFDSCxDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFFTixPQUFPLENBQUMsS0FBSyxDQUFDLDZCQUE2QixDQUFDLENBQUE7WUFDNUMsS0FBSyxFQUFFLENBQUE7UUFDVCxDQUFDO0lBR0gsQ0FBQyxDQUFDLENBQUE7QUFHTixDQUFDO0FBRUQsS0FBSyxFQUFFLENBQUEiLCJmaWxlIjoicmVzdGNsaWVudC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHJwaiBmcm9tIFwicmVxdWVzdC1wcm9taXNlLWpzb25cIlxuXG5pbXBvcnQgKiBhcyBpbnF1aXJlciBmcm9tIFwiaW5xdWlyZXJcIlxuXG5pbXBvcnQgY291Y2hKc29uQ29uZiBmcm9tIFwiY291Y2hqc29uY29uZlwiXG5cblxubGV0IGNvdWNoU2VydmVyXG5cblxuZnVuY3Rpb24gcHJvbXB0Zm9yX25ld3VzZXIoKSB7XG5cblxuICBpbnF1aXJlci5wcm9tcHQoW3tcbiAgICB0eXBlOiAnaW5wdXQnLFxuICAgIG5hbWU6ICd1c2VybmFtZScsXG4gICAgbWVzc2FnZTogJ0luc2VydCB1c2VybmFtZSdcbiAgfSxcbiAge1xuICAgIHR5cGU6ICdwYXNzd29yZCcsXG4gICAgbWVzc2FnZTogJ0VudGVyIHRoZSBuZXcgdXNlciBwYXNzd29yZCcsXG4gICAgbmFtZTogJ3Bhc3N3b3JkJ1xuICB9XSkudGhlbihmdW5jdGlvbiAodXNlcikge1xuXG5cbiAgICBpbnF1aXJlci5wcm9tcHQoW3tcbiAgICAgIHR5cGU6ICdjb25maXJtJyxcbiAgICAgIG5hbWU6ICdjb25maXJtJyxcbiAgICAgIG1lc3NhZ2U6ICdEbyB5b3Ugd2FudCB0byBhZGQgdGhlIHVzZXIgJyArIHVzZXIudXNlcm5hbWUgKyAnIHdpdGggcGFzc3dvcmQgJyArIHVzZXIucGFzc3dvcmRcbiAgICB9XSkudGhlbihmdW5jdGlvbiAoYW5zd2VyKSB7XG5cbiAgICAgIGlmIChhbnN3ZXIuY29uZmlybSkge1xuICAgICAgICBjb25zb2xlLmxvZygnY3JlYXRlIHVzZXIgJyArIHVzZXIudXNlcm5hbWUgKyAnIHdpdGggcGFzc3dvcmQgJyArIHVzZXIucGFzc3dvcmQpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZygnZXhpdCcpXG4gICAgICB9XG5cbiAgICB9KVxuXG5cbiAgfSlcblxuXG5cbn1cblxuXG5cbmZ1bmN0aW9uIHRlc3RzZXJ2ZXJhbmRydW4oc2VydmVyKSB7XG5cbiAgY291Y2hTZXJ2ZXIgPSBuZXcgY291Y2hKc29uQ29uZih7XG4gICAgaG9zdG5hbWU6IHNlcnZlci5ob3N0LFxuICAgIHVzZXI6IHNlcnZlci51c2VybmFtZSxcbiAgICBwYXNzd29yZDogc2VydmVyLnBhc3N3b3JkXG4gIH0pXG5cbiAgcnBqLmdldChjb3VjaFNlcnZlci5teSgnYXBwX21haW4nKSkudGhlbigoYSkgPT4ge1xuXG5cbiAgICBpbnF1aXJlci5wcm9tcHQoW1xuICAgICAge1xuICAgICAgICB0eXBlOiAnbGlzdCcsXG4gICAgICAgIG5hbWU6ICd0b2RvJyxcbiAgICAgICAgbWVzc2FnZTogJ1doYXQgZG8geW91IHdhbnQgdG8gZG8/JyxcbiAgICAgICAgY2hvaWNlczogW1xuICAgICAgICAgICdhZGQgbmV3IHNlcnZpY2UnLFxuICAgICAgICAgICdhZGQgbmV3IHVzZXInXG4gICAgICAgIF0sXG4gICAgICAgIGZpbHRlcjogZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgIHJldHVybiB2YWwucmVwbGFjZSgvIC9nLCAnJykudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgfVxuICAgICAgfV0pLnRoZW4oZnVuY3Rpb24gKGFuc3dlcikge1xuXG4gICAgICAgIHN3aXRjaCAoYW5zd2VyLnRvZG8pIHtcblxuICAgICAgICAgIGNhc2UgJ2FkZG5ld3VzZXInOlxuXG4gICAgICAgICAgICBwcm9tcHRmb3JfbmV3dXNlcigpXG5cbiAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgfVxuXG4gICAgICB9KVxuXG5cbiAgfSkuY2F0Y2goKGVycikgPT4ge1xuXG4gICAgY29uc29sZS5lcnJvcignaW52YWxpZCBob3N0IGNyZWRlbnRpYWxzJylcbiAgICBzdGFydCgpXG5cbiAgfSlcblxuXG59XG5cblxuZnVuY3Rpb24gc3RhcnQoKSB7XG5cblxuICBpbnF1aXJlci5wcm9tcHQoW1xuICAgIHtcbiAgICAgIHR5cGU6ICdpbnB1dCcsXG4gICAgICBuYW1lOiAnaG9zdCcsXG4gICAgICBtZXNzYWdlOiAnSW5zZXJ0IHNlcnZlciBob3N0J1xuICAgIH0sXG4gICAge1xuICAgICAgdHlwZTogJ2lucHV0JyxcbiAgICAgIG5hbWU6ICd1c2VybmFtZScsXG4gICAgICBtZXNzYWdlOiAnSW5zZXJ0IHVzZXJuYW1lJ1xuICAgIH0sXG4gICAge1xuICAgICAgdHlwZTogJ3Bhc3N3b3JkJyxcbiAgICAgIG1lc3NhZ2U6ICdFbnRlciB0aGUgbmV3IHVzZXIgcGFzc3dvcmQnLFxuICAgICAgbmFtZTogJ3Bhc3N3b3JkJ1xuICAgIH0sXG4gICAge1xuICAgICAgdHlwZTogJ2xpc3QnLFxuICAgICAgbmFtZTogJ3BvcnQnLFxuICAgICAgbWVzc2FnZTogJ1doYXQgZG8geW91IHdhbnQgdG8gZG8/JyxcbiAgICAgIGNob2ljZXM6IFtcbiAgICAgICAgJzgwJyxcbiAgICAgICAgJzU5ODQnLFxuICAgICAgICAnNDQzJyxcbiAgICAgICAgJ2N1c3RvbSdcbiAgICAgIF0sXG4gICAgICBmaWx0ZXI6IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgaWYgKHZhbCA9PT0gJ2N1c3RvbScpIHZhbCA9IDBcbiAgICAgICAgcmV0dXJuIHBhcnNlSW50KHZhbClcbiAgICAgIH1cbiAgICB9XSkudGhlbihmdW5jdGlvbiAoc2VydmVyKSB7XG5cblxuICAgICAgaWYgKHNlcnZlciAmJiBzZXJ2ZXIuaG9zdCAmJiBzZXJ2ZXIucGFzc3dvcmQgJiYgc2VydmVyLnVzZXJuYW1lKSB7XG5cblxuXG5cbiAgICAgICAgaWYgKHNlcnZlci5wb3J0KSB7XG4gICAgICAgICAgdGVzdHNlcnZlcmFuZHJ1bihzZXJ2ZXIpXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICBpbnF1aXJlci5wcm9tcHQoW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICB0eXBlOiAnaW5wdXQnLFxuICAgICAgICAgICAgICBuYW1lOiAnY3VzdG9tcG9ydCcsXG4gICAgICAgICAgICAgIG1lc3NhZ2U6ICdJbnNlcnQgc2VydmVyIGN1c3RvbSBwb3J0JyxcbiAgICAgICAgICAgICAgZmlsdGVyOiBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlSW50KHZhbClcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfV0pLnRoZW4oZnVuY3Rpb24gKHBvcnQpIHtcblxuICAgICAgICAgICAgICBpZiAocG9ydCAmJiBwb3J0LmN1c3RvbXBvcnQgJiYgcG9ydC5jdXN0b21wb3J0ID4gMCAmJiBwb3J0LmN1c3RvbXBvcnQgPCA3MDAwMCkge1xuICAgICAgICAgICAgICAgIHNlcnZlci5wb3J0ID0gcG9ydC5jdXN0b21wb3J0XG4gICAgICAgICAgICAgICAgdGVzdHNlcnZlcmFuZHJ1bihzZXJ2ZXIpXG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignaW52YWxpZCBjdXN0b20gcG9ydCcpXG4gICAgICAgICAgICAgICAgc3RhcnQoKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ2luY29tcGxldGUgaG9zdCBjcmVkZW50aWFscycpXG4gICAgICAgIHN0YXJ0KClcbiAgICAgIH1cblxuXG4gICAgfSlcblxuXG59XG5cbnN0YXJ0KCkiXX0=
