"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rpj = require("request-promise-json");
var inquirer = require("inquirer");
var couchServer;
function promptfor_newuser(server) {
    inquirer.prompt([{
            type: 'input',
            name: 'user',
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
                message: 'Do you want to add the user ' + user.user + ' with password ' + user.password
            }]).then(function (answer) {
            if (answer.confirm) {
                rpj.post(server.uri + '/access/testadmin', { admin: server.admin }).then(function (a) {
                    console.log('create user ' + user.user + ' with password ' + user.password);
                }).catch(function (err) {
                    console.error('error', err);
                });
            }
            else {
                console.log('exit');
            }
        });
    });
}
function promptfor_newservice(server) {
    inquirer.prompt([{
            type: 'input',
            name: 'app_id',
            message: 'Insert app_id'
        },
        {
            type: 'input',
            name: 'user',
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
                message: 'Do you want to add the user ' + user.user + ' with password ' + user.password
            }]).then(function (answer) {
            if (answer.confirm) {
                console.log(server.uri + '/access/services/create', { admin: server.admin, newuser: user, app_id: user.app_id });
                rpj.post(server.uri + '/access/services/create', { admin: server.admin, newuser: user, app_id: user.app_id }).then(function (a) {
                    console.log('created', a);
                }).catch(function (err) {
                    console.error('error', err);
                });
            }
            else {
                console.log('exit');
            }
        });
    });
}
function testserverandrun(server) {
    var appli;
    if (server.port === 443) {
        appli = 'https://' + server.host;
    }
    else if (server.port === 80) {
        appli = 'http://' + server.host;
    }
    else {
        appli = 'http://' + server.host + ':' + server.port;
    }
    server.uri = appli;
    server.admin = { user: server.user, password: server.password };
    console.log(server.uri + '/access/testadmin', server.admin);
    rpj.post(server.uri + '/access/testadmin', { admin: server.admin }).then(function (a) {
        if (a && a.ok) {
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
                        promptfor_newuser(server);
                        break;
                    case 'addnewservice':
                        promptfor_newservice(server);
                        break;
                }
            });
        }
        else if (a && a.error) {
            console.error(a.error);
        }
        else {
            console.error('invalid host credentials', a);
        }
    }).catch(function (err) {
        console.error('invalid host credentials', err);
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
            name: 'user',
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
            message: 'Which port?',
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
        if (server && server.host && server.password && server.user) {
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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cyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHJwaiBmcm9tIFwicmVxdWVzdC1wcm9taXNlLWpzb25cIlxuXG5pbXBvcnQgKiBhcyBpbnF1aXJlciBmcm9tIFwiaW5xdWlyZXJcIlxuXG5pbXBvcnQgY291Y2hKc29uQ29uZiBmcm9tIFwiY291Y2hqc29uY29uZlwiXG5cblxubGV0IGNvdWNoU2VydmVyXG5cblxuZnVuY3Rpb24gcHJvbXB0Zm9yX25ld3VzZXIoc2VydmVyKSB7XG5cblxuICBpbnF1aXJlci5wcm9tcHQoW3tcbiAgICB0eXBlOiAnaW5wdXQnLFxuICAgIG5hbWU6ICd1c2VyJyxcbiAgICBtZXNzYWdlOiAnSW5zZXJ0IHVzZXJuYW1lJ1xuICB9LFxuICB7XG4gICAgdHlwZTogJ3Bhc3N3b3JkJyxcbiAgICBtZXNzYWdlOiAnRW50ZXIgdGhlIG5ldyB1c2VyIHBhc3N3b3JkJyxcbiAgICBuYW1lOiAncGFzc3dvcmQnXG4gIH1dKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG5cblxuICAgIGlucXVpcmVyLnByb21wdChbe1xuICAgICAgdHlwZTogJ2NvbmZpcm0nLFxuICAgICAgbmFtZTogJ2NvbmZpcm0nLFxuICAgICAgbWVzc2FnZTogJ0RvIHlvdSB3YW50IHRvIGFkZCB0aGUgdXNlciAnICsgdXNlci51c2VyICsgJyB3aXRoIHBhc3N3b3JkICcgKyB1c2VyLnBhc3N3b3JkXG4gICAgfV0pLnRoZW4oZnVuY3Rpb24gKGFuc3dlcikge1xuXG4gICAgICBpZiAoYW5zd2VyLmNvbmZpcm0pIHtcblxuICAgICAgICBycGoucG9zdChzZXJ2ZXIudXJpICsgJy9hY2Nlc3MvdGVzdGFkbWluJywgeyBhZG1pbjogc2VydmVyLmFkbWluIH0pLnRoZW4oKGEpID0+IHtcblxuXG4gICAgICAgICAgY29uc29sZS5sb2coJ2NyZWF0ZSB1c2VyICcgKyB1c2VyLnVzZXIgKyAnIHdpdGggcGFzc3dvcmQgJyArIHVzZXIucGFzc3dvcmQpXG5cblxuICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG5cbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdlcnJvcicsIGVycilcblxuICAgICAgICB9KVxuXG5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdleGl0JylcbiAgICAgIH1cblxuICAgIH0pXG5cblxuICB9KVxuXG5cblxufVxuXG5cblxuZnVuY3Rpb24gcHJvbXB0Zm9yX25ld3NlcnZpY2Uoc2VydmVyKSB7XG5cblxuICBpbnF1aXJlci5wcm9tcHQoW3tcbiAgICB0eXBlOiAnaW5wdXQnLFxuICAgIG5hbWU6ICdhcHBfaWQnLFxuICAgIG1lc3NhZ2U6ICdJbnNlcnQgYXBwX2lkJ1xuICB9LFxuICB7XG4gICAgdHlwZTogJ2lucHV0JyxcbiAgICBuYW1lOiAndXNlcicsXG4gICAgbWVzc2FnZTogJ0luc2VydCB1c2VybmFtZSdcbiAgfSxcbiAge1xuICAgIHR5cGU6ICdwYXNzd29yZCcsXG4gICAgbWVzc2FnZTogJ0VudGVyIHRoZSBuZXcgdXNlciBwYXNzd29yZCcsXG4gICAgbmFtZTogJ3Bhc3N3b3JkJ1xuICB9XSkudGhlbihmdW5jdGlvbiAodXNlcikge1xuXG5cbiAgICBpbnF1aXJlci5wcm9tcHQoW3tcbiAgICAgIHR5cGU6ICdjb25maXJtJyxcbiAgICAgIG5hbWU6ICdjb25maXJtJyxcbiAgICAgIG1lc3NhZ2U6ICdEbyB5b3Ugd2FudCB0byBhZGQgdGhlIHVzZXIgJyArIHVzZXIudXNlciArICcgd2l0aCBwYXNzd29yZCAnICsgdXNlci5wYXNzd29yZFxuICAgIH1dKS50aGVuKGZ1bmN0aW9uIChhbnN3ZXIpIHtcblxuICAgICAgaWYgKGFuc3dlci5jb25maXJtKSB7XG5cbiAgICAgICAgY29uc29sZS5sb2coc2VydmVyLnVyaSArICcvYWNjZXNzL3NlcnZpY2VzL2NyZWF0ZScsIHsgYWRtaW46IHNlcnZlci5hZG1pbiwgbmV3dXNlcjogdXNlciwgYXBwX2lkOiB1c2VyLmFwcF9pZCB9KVxuXG4gICAgICAgIHJwai5wb3N0KHNlcnZlci51cmkgKyAnL2FjY2Vzcy9zZXJ2aWNlcy9jcmVhdGUnLCB7IGFkbWluOiBzZXJ2ZXIuYWRtaW4sIG5ld3VzZXI6IHVzZXIsIGFwcF9pZDogdXNlci5hcHBfaWQgfSkudGhlbigoYSkgPT4ge1xuXG5cbiAgICAgICAgICBjb25zb2xlLmxvZygnY3JlYXRlZCcsIGEpXG5cblxuICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG5cbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdlcnJvcicsIGVycilcblxuICAgICAgICB9KVxuXG5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdleGl0JylcbiAgICAgIH1cblxuICAgIH0pXG5cblxuICB9KVxuXG5cblxufVxuXG5cblxuZnVuY3Rpb24gdGVzdHNlcnZlcmFuZHJ1bihzZXJ2ZXIpIHtcblxuICBsZXQgYXBwbGlcblxuICBpZiAoc2VydmVyLnBvcnQgPT09IDQ0Mykge1xuICAgIGFwcGxpID0gJ2h0dHBzOi8vJyArIHNlcnZlci5ob3N0XG4gIH0gZWxzZSBpZiAoc2VydmVyLnBvcnQgPT09IDgwKSB7XG4gICAgYXBwbGkgPSAnaHR0cDovLycgKyBzZXJ2ZXIuaG9zdFxuICB9IGVsc2Uge1xuICAgIGFwcGxpID0gJ2h0dHA6Ly8nICsgc2VydmVyLmhvc3QgKyAnOicgKyBzZXJ2ZXIucG9ydFxuICB9XG5cbiAgc2VydmVyLnVyaSA9IGFwcGxpXG4gIHNlcnZlci5hZG1pbiA9IHsgdXNlcjogc2VydmVyLnVzZXIsIHBhc3N3b3JkOiBzZXJ2ZXIucGFzc3dvcmQgfVxuXG4gIGNvbnNvbGUubG9nKHNlcnZlci51cmkgKyAnL2FjY2Vzcy90ZXN0YWRtaW4nLCBzZXJ2ZXIuYWRtaW4pXG4gIHJwai5wb3N0KHNlcnZlci51cmkgKyAnL2FjY2Vzcy90ZXN0YWRtaW4nLCB7IGFkbWluOiBzZXJ2ZXIuYWRtaW4gfSkudGhlbigoYSkgPT4ge1xuXG5cbiAgICBpZiAoYSAmJiBhLm9rKSB7XG5cblxuICAgICAgaW5xdWlyZXIucHJvbXB0KFtcbiAgICAgICAge1xuICAgICAgICAgIHR5cGU6ICdsaXN0JyxcbiAgICAgICAgICBuYW1lOiAndG9kbycsXG4gICAgICAgICAgbWVzc2FnZTogJ1doYXQgZG8geW91IHdhbnQgdG8gZG8/JyxcbiAgICAgICAgICBjaG9pY2VzOiBbXG4gICAgICAgICAgICAnYWRkIG5ldyBzZXJ2aWNlJyxcbiAgICAgICAgICAgICdhZGQgbmV3IHVzZXInXG4gICAgICAgICAgXSxcbiAgICAgICAgICBmaWx0ZXI6IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWwucmVwbGFjZSgvIC9nLCAnJykudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1dKS50aGVuKGZ1bmN0aW9uIChhbnN3ZXIpIHtcblxuICAgICAgICAgIHN3aXRjaCAoYW5zd2VyLnRvZG8pIHtcblxuICAgICAgICAgICAgY2FzZSAnYWRkbmV3dXNlcic6XG5cbiAgICAgICAgICAgICAgcHJvbXB0Zm9yX25ld3VzZXIoc2VydmVyKVxuXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBjYXNlICdhZGRuZXdzZXJ2aWNlJzpcblxuICAgICAgICAgICAgICBwcm9tcHRmb3JfbmV3c2VydmljZShzZXJ2ZXIpXG5cbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG5cbiAgICAgICAgfSlcblxuICAgIH0gZWxzZSBpZiAoYSAmJiBhLmVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGEuZXJyb3IpXG5cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5lcnJvcignaW52YWxpZCBob3N0IGNyZWRlbnRpYWxzJywgYSlcblxuICAgIH1cblxuICB9KS5jYXRjaCgoZXJyKSA9PiB7XG5cbiAgICBjb25zb2xlLmVycm9yKCdpbnZhbGlkIGhvc3QgY3JlZGVudGlhbHMnLCBlcnIpXG4gICAgc3RhcnQoKVxuXG4gIH0pXG5cblxufVxuXG5cbmZ1bmN0aW9uIHN0YXJ0KCkge1xuXG5cbiAgaW5xdWlyZXIucHJvbXB0KFtcbiAgICB7XG4gICAgICB0eXBlOiAnaW5wdXQnLFxuICAgICAgbmFtZTogJ2hvc3QnLFxuICAgICAgbWVzc2FnZTogJ0luc2VydCBzZXJ2ZXIgaG9zdCdcbiAgICB9LFxuICAgIHtcbiAgICAgIHR5cGU6ICdpbnB1dCcsXG4gICAgICBuYW1lOiAndXNlcicsXG4gICAgICBtZXNzYWdlOiAnSW5zZXJ0IHVzZXJuYW1lJ1xuICAgIH0sXG4gICAge1xuICAgICAgdHlwZTogJ3Bhc3N3b3JkJyxcbiAgICAgIG1lc3NhZ2U6ICdFbnRlciB0aGUgbmV3IHVzZXIgcGFzc3dvcmQnLFxuICAgICAgbmFtZTogJ3Bhc3N3b3JkJ1xuICAgIH0sXG4gICAge1xuICAgICAgdHlwZTogJ2xpc3QnLFxuICAgICAgbmFtZTogJ3BvcnQnLFxuICAgICAgbWVzc2FnZTogJ1doaWNoIHBvcnQ/JyxcbiAgICAgIGNob2ljZXM6IFtcbiAgICAgICAgJzgwJyxcbiAgICAgICAgJzU5ODQnLFxuICAgICAgICAnNDQzJyxcbiAgICAgICAgJ2N1c3RvbSdcbiAgICAgIF0sXG4gICAgICBmaWx0ZXI6IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgaWYgKHZhbCA9PT0gJ2N1c3RvbScpIHZhbCA9IDBcbiAgICAgICAgcmV0dXJuIHBhcnNlSW50KHZhbClcbiAgICAgIH1cbiAgICB9XSkudGhlbihmdW5jdGlvbiAoc2VydmVyKSB7XG5cblxuICAgICAgaWYgKHNlcnZlciAmJiBzZXJ2ZXIuaG9zdCAmJiBzZXJ2ZXIucGFzc3dvcmQgJiYgc2VydmVyLnVzZXIpIHtcblxuXG5cblxuICAgICAgICBpZiAoc2VydmVyLnBvcnQpIHtcblxuXG4gICAgICAgICAgdGVzdHNlcnZlcmFuZHJ1bihzZXJ2ZXIpXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICBpbnF1aXJlci5wcm9tcHQoW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICB0eXBlOiAnaW5wdXQnLFxuICAgICAgICAgICAgICBuYW1lOiAnY3VzdG9tcG9ydCcsXG4gICAgICAgICAgICAgIG1lc3NhZ2U6ICdJbnNlcnQgc2VydmVyIGN1c3RvbSBwb3J0JyxcbiAgICAgICAgICAgICAgZmlsdGVyOiBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlSW50KHZhbClcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfV0pLnRoZW4oZnVuY3Rpb24gKHBvcnQpIHtcblxuICAgICAgICAgICAgICBpZiAocG9ydCAmJiBwb3J0LmN1c3RvbXBvcnQgJiYgcG9ydC5jdXN0b21wb3J0ID4gMCAmJiBwb3J0LmN1c3RvbXBvcnQgPCA3MDAwMCkge1xuICAgICAgICAgICAgICAgIHNlcnZlci5wb3J0ID0gcG9ydC5jdXN0b21wb3J0XG4gICAgICAgICAgICAgICAgdGVzdHNlcnZlcmFuZHJ1bihzZXJ2ZXIpXG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignaW52YWxpZCBjdXN0b20gcG9ydCcpXG4gICAgICAgICAgICAgICAgc3RhcnQoKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ2luY29tcGxldGUgaG9zdCBjcmVkZW50aWFscycpXG4gICAgICAgIHN0YXJ0KClcbiAgICAgIH1cblxuXG4gICAgfSlcblxuXG59XG5cbnN0YXJ0KCkiXX0=
