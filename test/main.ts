import * as mocha from "mocha"
import * as chai from "chai"

import couchauth from "../index"

const rpj = require('request-promise-json')
const spawnPouchdbServer = require('spawn-pouchdb-server')

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


let CouchAuth: couchauth



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
                Server = server


                CouchAuth = new couchauth({
                    hostname: 'localhost',
                    protocol: 'http',
                    port: testport,
                    user: adminUser.user,
                    password: adminUser.password
                })


                setTimeout(function () {
                    done()
                }, 1000)
            }
        })







})


describe("test app_main", function () {
    this.timeout(20000)

    it("verificate presence of app_main db", function (done) {


        rpj.get(CouchAuth.my('app_main')).then(function (d) {

            rpj.put(CouchAuth.my('app_main') + '/testdoctobepresent0', { _id: 'testdoctobepresent0', ee: true }).then(function (d) {
                expect(d).to.be.ok
                expect(d).to.be.an('object')
                done()
            }).catch((err) => {
                console.log(err)
                done(Error(err))
            })


        }).catch((err) => {
            done(Error(err))
        })
    })

    it("verificate that app_main db is not public", function (done) {
        //    console.log(CouchAuth.my('app_main'))
        rpj.put(CouchAuth.publink + '/app_main/testdocnotbepresent0', { _id: 'testdocnotbepresent0', ee: true }).then(function (d) {
            done(Error(d))
        }).catch((err) => {
            expect(err).to.be.ok
            done()
        })

    })

    it("verificate admin user", function (done) {
        //    console.log(CouchAuth.my('app_main'))
        rpj.get(CouchAuth.my('_users/org.couchdb.user:' + adminUser.user)).then(function (d) {
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
                console.log(err)
                done(Error(err))
            })
        }).catch((err) => {
            console.log(err)
            done(Error(err))
        })
    })

    it("verificate that app_main db is not open to other users", function (done) {
        rpj.put(CouchAuth.for(user0.user, user0.password) + '/app_main/testdocnotbepresent0', { _id: 'testdocnotbepresent0', ee: true }).then(function (d) {
            done(Error(d))
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

        rpj.get(CouchAuth.my('service_testapp') + '/_security', { _id: 'testnewdoc0', ee: true }).then(function (d) {
            console.log(d)
            expect(d).to.be.ok
            expect(d).to.be.an('object')
            done()
        }).catch((err) => {
            console.log(err)
            done(Error(err))

        })

        }).catch((err) => {
            done(Error(err))
        })

    })
    it("check that slave user can put a document", function (done) {
        this.timeout(20000)

        rpj.put(CouchAuth.for(slaveuser.user, slaveuser.password) + '/service_testapp/testnewdoc0', { _id: 'testnewdoc0', ee: true }).then(function (d) {
            console.log(d)
            expect(d).to.be.ok
            expect(d).to.be.an('object')
            done()
        }).catch((err) => {
            console.log(err)
            done(Error(err))

        })

    })

    it("unregistered users can't access", function (done) {
        this.timeout(20000)

        rpj.get(CouchAuth.publink + '/service_testapp/testdoctobepresent0').then(function (d) {
            done(Error(d))
        }).catch((err) => {
            expect(err).to.be.ok
            done()
        })
    })

    it("other users can't access", function (done) {
        this.timeout(20000)

        rpj.get(CouchAuth.for(user0.user, user0.password) + '/service_testapp/testdoctobepresent0').then(function (d) {
            done(Error(d))
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
            rpj.put(CouchAuth.my('pub_testapp2') + '/testdoctobepresent0', { _id: 'testdoctobepresent0', ee: true }).then(function (d) {
                expect(d).to.be.ok
                expect(d).to.be.an('object')
                done()
            }).catch((err) => {
                console.log(err)
                done(Error(err))
            })


        }).catch((err) => {
            done(Error(err))
        })
    })

    it("unregistered users can read from a public app", function (done) {
        this.timeout(20000)

        rpj.get(CouchAuth.publink + '/pub_testapp2/testdoctobepresent0').then(function (d) {
            expect(d).to.be.ok
            done()

        }).catch((err) => {
            console.log(err)
            done(Error(err))
        })
    })
    it("registered users can read from a public app", function (done) {
        this.timeout(20000)

        rpj.get(CouchAuth.for(user0.user, user0.password) + '/pub_testapp2/testdoctobepresent0').then(function (d) {
            expect(d).to.be.ok
            done()

        }).catch((err) => {
            console.log(err)
            done(Error(err))
        })
    })
    it("unregistered users can't add docs to a public app", function (done) {
        this.timeout(20000)

        rpj.put(CouchAuth.publink + '/pub_testapp2/cccn', { _id: 'cccn', aa: true }).then(function (d) {
            console.log(d)
            done(Error(d))
        }).catch((err) => {
            expect(err).to.be.ok
            done()
        })
    })

    it("registered users can't add docs", function (done) {
        this.timeout(20000)

        rpj.put(CouchAuth.for(user0.user, user0.password) + '/pub_testapp2/cccb', { _id: 'cccb', aa: true }).then(function (d) {
            done(Error(d))
        }).catch((err) => {
            expect(err).to.be.ok
            done()
        })
    })


})


describe("users", function () {


    it("unregistered users can't add dbs", function (done) {
        this.timeout(20000)

        rpj.put(CouchAuth.publink + '/testapp3')

        setTimeout(() => {
            rpj.get(CouchAuth.my('testapp3')).then(function (d) {
                done(new Error(d))
            }).catch((err) => {
                expect(err).to.be.ok
                done()
            })
        }, 5000)

    })

    it("registered users can't add dbs", function (done) {
        this.timeout(20000)

        rpj.put(CouchAuth.for(user0.user, user0.password) + '/testapp3')

        setTimeout(() => {
            rpj.get(CouchAuth.my('testapp3')).then(function (d) {
                done(new Error(d))
            }).catch((err) => {
                expect(err).to.be.ok
                done()
            })
        }, 5000)

    })
})

describe("db access for users", function () {

    it("an admin can create a closed db and delegate an user to rw it", function (done) {
        this.timeout(20000)

        done(new Error('todo'))


    })

    it("a delegated rw user for a db can access and write on it", function (done) {
        this.timeout(20000)

        done(new Error('todo'))


    })

    it("a common user can't read or write it", function (done) {
        this.timeout(20000)

        done(new Error('todo'))


    })


    it("a registered users can subscribe a db and access to it (ro), it need admin crdentials", function (done) {
        this.timeout(20000)

        done(new Error('todo'))


    })
    it("a registered users have a list of accessible dbs (ro or rw)", function (done) {
        this.timeout(20000)

        done(new Error('todo'))


    })
    it("can access read all subscribed apps", function (done) {
        this.timeout(20000)

        done(new Error('todo'))


    })

    it("can't write on ro subscribed apps", function (done) {
        this.timeout(20000)

        done(new Error('todo'))


    })
    it("can unsubscribed apps", function (done) {
        this.timeout(20000)

        done(new Error('todo'))


    })

    it("can't read on unsubscribed apps", function (done) {
        this.timeout(20000)

        done(new Error('todo'))


    })

    it("an unregistered users can't subscribe a db", function (done) {
        this.timeout(20000)

        done(new Error('todo'))


    })



})



after(function (done) {
    Server.stop(function () {
        done()
    })

})