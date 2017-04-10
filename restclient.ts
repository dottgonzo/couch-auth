import * as rpj from "request-promise-json"

import * as inquirer from "inquirer"

import couchJsonConf from "couchjsonconf"


let couchServer


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
        console.log('create user ' + user.username + ' with password ' + user.password)
      } else {
        console.log('exit')
      }

    })


  })



}



function testserverandrun(server) {

  couchServer = new couchJsonConf({
    hostname: server.host,
    user: server.username,
    password: server.password
  })

  rpj.get(couchServer.my('app_main')).then((a) => {


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
      }]).then(function (answer) {

        switch (answer.todo) {

          case 'addnewuser':

            promptfor_newuser()

            break

        }

      })


  }).catch((err) => {

    console.error('invalid host credentials')
    start()

  })


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
        if (val === 'custom') val = 0
        return parseInt(val)
      }
    }]).then(function (server) {


      if (server && server.host && server.password && server.username) {




        if (server.port) {
          testserverandrun(server)
        } else {

          inquirer.prompt([
            {
              type: 'input',
              name: 'customport',
              message: 'Insert server custom port',
              filter: function (val) {
                return parseInt(val)
              }
            }]).then(function (port) {

              if (port && port.customport && port.customport > 0 && port.customport < 70000) {
                server.port = port.customport
                testserverandrun(server)
              } else {
                console.error('invalid custom port')
                start()
              }
            })
        }
      } else {

        console.error('incomplete host credentials')
        start()
      }


    })


}

start()