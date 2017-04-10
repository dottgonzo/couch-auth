import * as mocha from "mocha"
import * as chai from "chai"

import { accessRouter } from "../index"

const rpj = require('request-promise-json')
const spawnPouchdbServer = require('spawn-pouchdb-server')

import * as express from "express"

import * as bodyParser from "body-parser"


const testport = 8743

const testexpressport = 8744



const adminUser = {
    user: 'adminuser',
    password: 'adminpass'
}

const user0 = {
    user: 'testuser0',
    password: 'testpassw0'
}

const slaveuser = {
    user: 'slaveslave1',
    password: 'slavepassw1'
}

let expect = chai.expect


let Server
let aa = 'ss'






before(function (done) {
    this.timeout(20000)
    spawnPouchdbServer(
        {
            port: testport,
            backend: false,
            config: {
                admins: { "adminuser": "adminpass" },
                file: false
            },
            log: {
                file: false,
                level: 'info'
            }
        }, function (error, server) {
            if (error) {
                throw error

            } else {


                const CouchAccess = accessRouter({
                    hostname: 'localhost',
                    protocol: 'http',
                    port: testport,
                    user: adminUser.user,
                    password: adminUser.password
                })


                const app = express();
                // parse application/x-www-form-urlencoded
                app.use(bodyParser.urlencoded({ extended: false }))

                // parse application/json
                app.use(bodyParser.json())


                app.use('/access', CouchAccess);

                app.listen(testexpressport, function () {
                    setTimeout(function () {
                        done()
                    }, 2000)
                });

            }
        })







})

describe("test express server", function () {


    it("exists", function (done) {

        rpj.get('http://localhost:' + testexpressport + '/access').then((a) => {

            expect(a).to.be.ok
            done()
        }).catch((err) => {
            done(new Error(err))
        })
    })



    it("testadmin", function (done) {

        rpj.post('http://localhost:' + testexpressport + '/access/testadmin', { admin: adminUser }).then((a) => {

            if (a && a.error) {
                done(new Error(a.error))

            } else {
                expect(a).to.be.ok
                expect(a).to.have.property('ok').that.eq(true)

                done()
            }


        }).catch((err) => {

            done(new Error(err))

        })

    })

})

