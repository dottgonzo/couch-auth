import * as mocha from "mocha"
import * as chai from "chai"

import { couchAccess } from "../index"

const spawnPouchdbServer = require('spawn-pouchdb-server')

import * as axios from 'axios'

const testport = 8742



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


let CouchAuth: couchAccess



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
                level: 'none'
            },
            verbose: false
        }, function (error, server) {
            if (error) {
                throw error

            } else {
                Server = server


                CouchAuth = new couchAccess({
                    hostname: 'localhost',
                    protocol: 'http',
                    port: testport,
                    user: adminUser.user,
                    password: adminUser.password
                })


                setTimeout(function () {
                    done()
                }, 2000)
            }
        })







})
describe("modules", function () {


    describe("test app_main", function () {
        this.timeout(20000)

        it("verificate presence of app_main db", function (done) {


            axios.get(CouchAuth.my('app_main')).then(function (d) {

                axios.put(CouchAuth.my('app_main') + '/testdoctobepresent0', { _id: 'testdoctobepresent0', ee: true }).then(function (d) {
                    expect(d).to.be.ok
                    expect(d).to.be.an('object')
                    done()
                }).catch((err) => {
                    console.error(err)
                    done(Error(err))
                })


            }).catch((err) => {
                done(Error(err))
            })
        })
        it("verificate presence of service doc", function (done) {


            axios.get(CouchAuth.my('app_main') + '/services').then(function (d) {

                expect(d).to.be.ok
                expect(d).to.be.an('object')
                done()


            }).catch((err) => {
                done(Error(err))
            })
        })
        it("verificate that app_main db is not public", function (done) {
            //    console.log(CouchAuth.my('app_main'))
            axios.get(CouchAuth.publink + '/app_main/testdocnotbepresent0').then(function (d) {
                done(Error(JSON.stringify(d)))
            }).catch((err) => {
                expect(err).to.be.ok
                done()
            })

        })

        it("verificate admin user", function (done) {
            //    console.log(CouchAuth.my('app_main'))
            axios.get(CouchAuth.my('_users/org.couchdb.user:' + adminUser.user)).then(function (resp) {
                const d = resp.data
                expect(d).to.be.ok
                expect(d).to.have.property('name').that.eq(adminUser.user)
                expect(d).to.have.property('roles').that.is.an('array')
                expect(d).to.have.property('db').that.is.an('array')
                done()
            }).catch((err) => {
                done(Error(err))
            })

        })


    })


    describe("user managment", function () {
        this.timeout(20000)
        it("an admin can add a common user with no db that can login by themselves", function (done) {
            CouchAuth.createUser(adminUser, user0).then(() => {
                CouchAuth.login(user0).then((d) => {
                    expect(d).to.be.ok
                    done()
                }).catch((err) => {
                    console.error(err)
                    done(Error(err))
                })
            }).catch((err) => {
                console.error(err)
                done(Error(err))
            })
        })


        it("verificate that app_main db is not readable to other users", function (done) {
            axios.get(CouchAuth.for(user0.user, user0.password) + '/app_main/testdocnotbepresent0').then(function (d) {
                done(Error(JSON.stringify(d)))
            }).catch((err) => {
                expect(err).to.be.ok
                done()
            })

        })


    })

    describe("create a new service app", function () {
        it("main admin add first app for a slave user", function (done) {
            this.timeout(20000)

            CouchAuth.createServiceApp(adminUser, 'testapp', slaveuser).then(function () {

                axios.get(CouchAuth.my('service_testapp') + '/_security').then(function (d) {
                    expect(d).to.be.ok
                    expect(d).to.be.an('object')
                    done()
                }).catch((err) => {
                    console.error(err)
                    done(Error(err))

                })

            }).catch((err) => {
                done(Error(err))
            })

        })
        it("check the service list", function (done) {
            this.timeout(20000)

            CouchAuth.getServices(adminUser).then(function (d) {
                expect(d).to.be.ok
                expect(d).to.be.an('Array')
                expect(d.length).to.be.eq(1)

                done()
            }).catch((err) => {
                done(Error(err))
            })

        })
        it("check that slave user can put a document", function (done) {
            this.timeout(20000)

            axios.put(CouchAuth.for(slaveuser.user, slaveuser.password) + '/service_testapp/testnewdoc0', { _id: 'testnewdoc0', ee: true }).then(function (d) {
                expect(d).to.be.ok
                expect(d).to.be.an('object')
                done()
            }).catch((err) => {
                console.error(err)
                done(Error(err))

            })

        })

        it("unregistered users can't access", function (done) {
            this.timeout(20000)

            axios.get(CouchAuth.publink + '/service_testapp/testdoctobepresent0').then(function (d) {
                done(Error(JSON.stringify(d)))
            }).catch((err) => {
                expect(err).to.be.ok
                done()
            })
        })

        it("other users can't access", function (done) {
            this.timeout(20000)

            axios.get(CouchAuth.for(user0.user, user0.password) + '/service_testapp/testdoctobepresent0').then(function (d) {
                done(new Error(JSON.stringify(d)))
            }).catch((err) => {
                expect(err).to.be.ok
                done()
            })
        })


    })

    describe("create a new public app (an app read only)", function () {
        it("main admin add ro app", function (done) {
            this.timeout(20000)

            CouchAuth.createPubApp(adminUser, 'testapp2').then(function (d) {
                axios.put(CouchAuth.my('pub_testapp2') + '/testdoctobepresent0', { _id: 'testdoctobepresent0', ee: true }).then(function (d) {
                    expect(d).to.be.ok
                    expect(d).to.be.an('object')
                    done()
                }).catch((err) => {
                    console.error(err)
                    done(new Error(err))
                })


            }).catch((err) => {
                done(new Error(err))
            })
        })

        it("unregistered users can read from a public app", function (done) {
            this.timeout(20000)

            axios.get(CouchAuth.publink + '/pub_testapp2/testdoctobepresent0').then(function (d) {
                expect(d).to.be.ok
                done()

            }).catch((err) => {
                console.error(err)
                done(new Error(err))
            })
        })
        it("registered users can read from a public app", function (done) {
            this.timeout(20000)

            axios.get(CouchAuth.for(user0.user, user0.password) + '/pub_testapp2/testdoctobepresent0').then(function (d) {
                expect(d).to.be.ok
                done()

            }).catch((err) => {
                console.error(err)
                done(new Error(err))
            })
        })
        it("unregistered users can't add docs to a public app", function (done) {
            this.timeout(20000)

            axios.put(CouchAuth.publink + '/pub_testapp2/cccn', { _id: 'cccn', aa: true }).then(function (d) {
                console.error(d)
                done(new Error(JSON.stringify(d)))
            }).catch((err) => {
                expect(err).to.be.ok
                done()
            })
        })

        it("registered users can't add docs", function (done) {
            this.timeout(20000)

            axios.put(CouchAuth.for(user0.user, user0.password) + '/pub_testapp2/cccb', { _id: 'cccb', aa: true }).then(function (d) {
                done(new Error(JSON.stringify(d)))
            }).catch((err) => {
                expect(err).to.be.ok
                done()
            })
        })


    })


    describe("users", function () {


        it("unregistered users can't add dbs", function (done) {
            this.timeout(20000)

            axios.put(CouchAuth.publink + '/testapp3')




            setTimeout(() => {
                axios.get(CouchAuth.my('testapp3')).then(function (d) {
                    done(new Error(JSON.stringify(d)))
                }).catch((err) => {
                    expect(err).to.be.ok
                    done()
                })
            }, 5000)

        })

        it("registered users can't add dbs", function (done) {
            this.timeout(20000)

            axios.put(CouchAuth.for(user0.user, user0.password) + '/testapp3')

            setTimeout(() => {
                axios.get(CouchAuth.my('testapp3')).then(function (d) {
                    done(new Error(JSON.stringify(d)))
                }).catch((err) => {
                    expect(err).to.be.ok
                    done()
                })
            }, 5000)

        })
    })

})

after(function (done) {
    Server.stop(function () {
        done()
    })

})