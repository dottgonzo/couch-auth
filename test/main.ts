import * as mocha from "mocha";
import * as chai from "chai";

import couchauth from "../index";

const rpj = require('request-promise-json');
const spawnPouchdbServer = require('spawn-pouchdb-server');

const testport = 8742;

const user0 = {
    user: 'testuser0',
    password: 'testpassw0',
    email: 'testuser0@test.tst'
}

const user1 = {
    user: 'testuser1',
    password: 'testpassw1',
    email: 'testuser1@test.tst'
}

let expect = chai.expect;


let Server;



let CouchAuth: couchauth;



before(function (done) {
    this.timeout(20000);
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
                throw error;

            } else {
                Server = server


                CouchAuth = new couchauth({
                    hostname: 'localhost',
                    protocol: 'http',
                    port: testport,
                    user: 'adminuser',
                    password: 'adminpass'
                });


                setTimeout(function () {
                    done()
                }, 1000)
            }
        })







});

describe("create an user", function () {
    this.timeout(20000);
    it("add a common user with no db", function (done) {
        CouchAuth.createUser('user0', 'password0', 'email0@email.aa').then((d) => {
            expect(d).to.be.ok;
            done()
        }).catch((err) => {
            console.log(err)
            done(Error(err));
        })
    })
})

describe("test app_main", function () {
    this.timeout(20000);

    it("verificate presence of app_main db", function (done) {


        rpj.get(CouchAuth.my('app_main')).then(function (d) {

            rpj.put(CouchAuth.my('app_main') + '/testdoctobepresent0', { _id: 'testdoctobepresent0', ee: true }).then(function (d) {
                expect(d).to.be.ok;
                expect(d).to.be.an('object');
                done();
            }).catch((err) => {
                console.log(err)
                done(Error(err));
            })


        }).catch((err) => {
            done(Error(err));
        })
    });

    it("verificate that app_main db is not public", function (done) {
        //    console.log(CouchAuth.my('app_main'))
        rpj.put(CouchAuth.publink + '/app_main/testdocnotbepresent0', { _id: 'testdocnotbepresent0', ee: true }).then(function (d) {
            done(Error(d));
        }).catch((err) => {
            expect(err).to.be.ok;
            done();
        })

    });

    it("verificate that app_main db is not open to other users", function (done) {
        rpj.put(CouchAuth.for('user0', 'password0') + '/app_main/testdocnotbepresent0', { _id: 'testdocnotbepresent0', ee: true }).then(function (d) {
            done(Error(d));
        }).catch((err) => {
            expect(err).to.be.ok;
            done();
        })

    });

    it("verificate admin user", function (done) {
        //    console.log(CouchAuth.my('app_main'))
        rpj.get(CouchAuth.my('_users/org.couchdb.user:' + 'adminuser')).then(function (d) {
            expect(d).to.be.ok;
            expect(d).to.have.property('name').that.eq('adminuser');
            expect(d).to.have.property('email');
            expect(d).to.have.property('roles').that.is.an('array');
            expect(d).to.have.property('db').that.is.an('array');
            done();
        }).catch((err) => {
            done(Error(err));
        })

    });


});
describe("create a new closed app", function () {
    it("main admin add first app", function (done) {
        this.timeout(20000);

        CouchAuth.createClosedApp('testapp').then(function (d) {
            expect(d).to.be.ok;

            done()
        }).catch((err) => {
            done(Error(err));
        })
    })

    it("unregistered users can't access", function (done) {
        this.timeout(20000);

        rpj.get(CouchAuth.publink + '/testapp/testdoctobepresent0').then(function (d) {
            done(Error(d));
        }).catch((err) => {
            expect(err).to.be.ok;
            done();
        })
    })

    it("other users can't access", function (done) {
        this.timeout(20000);

        rpj.get(CouchAuth.for('user0', 'password0') + '/testapp/testdoctobepresent0').then(function (d) {
            done(Error(d));
        }).catch((err) => {
            expect(err).to.be.ok;
            done();
        })
    })


})

describe("create a new ro app", function () {
    it("main admin add ro app", function (done) {
        this.timeout(20000);

        CouchAuth.createRoApp('testapp2').then(function (d) {
            rpj.put(CouchAuth.my('testapp2') + '/testdoctobepresent0', { _id: 'testdoctobepresent0', ee: true }).then(function (d) {
                expect(d).to.be.ok;
                expect(d).to.be.an('object');
                done();
            }).catch((err) => {
                console.log(err)
                done(Error(err));
            })


        }).catch((err) => {
            done(Error(err));
        })
    })

    it("unregistered users can access", function (done) {
        this.timeout(20000);

        rpj.get(CouchAuth.publink + '/testapp2/testdoctobepresent0').then(function (d) {
            expect(d).to.be.ok;
            done();

        }).catch((err) => {
            console.log(err)
            done(Error(err));
        })
    })
    it("registered users can access", function (done) {
        this.timeout(20000);

        rpj.get(CouchAuth.for('user0', 'password0') + '/testapp2/testdoctobepresent0').then(function (d) {
            expect(d).to.be.ok;
            done();

        }).catch((err) => {
            console.log(err)
            done(Error(err));
        })
    })
    it("unregistered users can't add docs", function (done) {
        this.timeout(20000);

        rpj.put(CouchAuth.publink + '/testapp2/cccn', { _id: 'cccn', aa: true }).then(function (d) {
            console.log(d)
            done(Error(d));
        }).catch((err) => {
            expect(err).to.be.ok;
            done();
        })
    })

    it("registered users can't add docs", function (done) {
        this.timeout(20000);

        rpj.put(CouchAuth.for('user0', 'password0') + '/testapp2/cccb', { _id: 'cccb', aa: true }).then(function (d) {
            done(Error(d));
        }).catch((err) => {
            expect(err).to.be.ok;
            done();
        })
    })


})


describe("users", function () {


    it("unregistered users can't add dbs", function (done) {
        this.timeout(20000);

        rpj.put(CouchAuth.publink + '/testapp3')

        setTimeout(() => {
            rpj.get(CouchAuth.my('testapp3')).then(function (d) {
                console.log('ee')
                done(new Error(d));
            }).catch((err) => {
                expect(err).to.be.ok;
                done();
            })
        }, 5000)

    })

    it("registered users can't add dbs", function (done) {
        this.timeout(20000);

        rpj.put(CouchAuth.for('user0', 'password0') + '/testapp3')

        setTimeout(() => {
            rpj.get(CouchAuth.my('testapp3')).then(function (d) {
                console.log('ee')
                done(new Error(d));
            }).catch((err) => {
                expect(err).to.be.ok;
                done();
            })
        }, 5000)

    })


    it("a registered users can subscribe a db and access to it (rw)", function (done) {
        this.timeout(20000);

                done(new Error('todo'));


    })

    it("other registered users can't access to the previous database subscribed by other users", function (done) {
        this.timeout(20000);

                done(new Error('todo'));


    })

    it("an unregistered users can't subscribe a db", function (done) {
        this.timeout(20000);

                done(new Error('todo'));


    })

    it("an unregistered users can't access to the previous database subscribed by other users", function (done) {
        this.timeout(20000);

                done(new Error('todo'));


    })

})



after(function (done) {
    Server.stop(function () {
        done()
    })

});