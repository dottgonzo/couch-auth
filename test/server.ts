import * as mocha from "mocha"
import * as chai from "chai"

import { accessRouter } from "../index"

import * as axios from 'axios'
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


const route = 'http://localhost:' + testexpressport + '/access'



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
    describe("check server", function () {


        it("exists", function (done) {

            axios.get(route).then((a) => {

                expect(a).to.be.ok
                done()
            }).catch((err) => {
                done(new Error(err))
            })
        })



        it("testadmin", function (done) {

            axios.post(route + '/testadmin', { admin: adminUser }).then((a: any) => {

                if (a && a.data && a.data.error) {
                    done(new Error(a.data.error))

                } else {
                    expect(a).to.be.ok
                    expect(a.data).to.have.property('ok').that.eq(true)

                    done()
                }


            }).catch((err) => {

                done(new Error(err))

            })

        })
    })



    describe("services", function () {

        it("administrator create service", function (done) {

            axios.post(route + '/services/create', {
                admin: adminUser,
                newuser: {
                    user: 'gggg',
                    password: 'ddd'
                },
                service_id: 'testssss'
            }).then((a: any) => {

                if (a && a.data && a.data.error) {
                    done(new Error(a.data.error))

                } else {
                    expect(a).to.be.ok
                    expect(a.data).to.be.ok
                    expect(a.data.ok).to.eq(true)
                    done()
                }

            }).catch((err) => {
                done(new Error(err))
            })

        })


        it("administrator list services", function (done) {

            axios.post(route + '/services/list', {
                admin: adminUser
            }).then((a: any) => {

                if (a && a.data && a.data.error) {
                    done(new Error(a.data.error))

                } else {
                    expect(a).to.be.ok
                    expect(a.data).to.be.ok
                    console.log(a.data)
                    done()
                }

            }).catch((err) => {
                done(new Error(err))
            })

        })

    })


})

