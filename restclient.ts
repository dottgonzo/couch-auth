import * as rpj from "request-promise-json"

import * as inquirer from "inquirer"

import couchJsonConf from "couchjsonconf"


let couchServer


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

        rpj.post(server.uri + '/access/testadmin', { admin: server.admin }).then((a) => {


          console.log('create user ' + user.user + ' with password ' + user.password)


        }).catch((err) => {

          console.error('error', err)

        })


      } else {
        console.log('exit')
      }

    })


  })



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

        console.log(server.uri + '/access/services/create', { admin: server.admin, newuser: user, app_id: user.app_id })

        rpj.post(server.uri + '/access/services/create', { admin: server.admin, newuser: user, app_id: user.app_id }).then((a) => {


          console.log('created', a)


        }).catch((err) => {

          console.error('error', err)

        })


      } else {
        console.log('exit')
      }

    })


  })



}



function testserverandrun(server) {

  let appli

  if (server.port === 443) {
    appli = 'https://' + server.host
  } else if (server.port === 80) {
    appli = 'http://' + server.host
  } else {
    appli = 'http://' + server.host + ':' + server.port
  }

  server.uri = appli
  server.admin = { user: server.user, password: server.password }

  console.log(server.uri + '/access/testadmin', server.admin)
  rpj.post(server.uri + '/access/testadmin', { admin: server.admin }).then((a) => {


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
        }]).then(function (answer) {

          switch (answer.todo) {

            case 'addnewuser':

              promptfor_newuser(server)

              break
            case 'addnewservice':

              promptfor_newservice(server)

              break
          }

        })

    } else if (a && a.error) {
      console.error(a.error)

    } else {
      console.error('invalid host credentials', a)

    }

  }).catch((err) => {

    console.error('invalid host credentials', err)
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
        if (val === 'custom') val = 0
        return parseInt(val)
      }
    }]).then(function (server) {


      if (server && server.host && server.password && server.user) {




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