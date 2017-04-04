"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai = require("chai");
var index_1 = require("../index");
var rpj = require('request-promise-json');
var spawnPouchdbServer = require('spawn-pouchdb-server');
var testport = 8742;
var user0 = {
    user: 'testuser0',
    password: 'testpassw0',
    email: 'testuser0@test.tst'
};
var user1 = {
    user: 'testuser1',
    password: 'testpassw1',
    email: 'testuser1@test.tst'
};
var expect = chai.expect;
var Server;
var CouchAuth;
before(function (done) {
    this.timeout(20000);
    spawnPouchdbServer({
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
        }
        else {
            Server = server;
            CouchAuth = new index_1.default({
                hostname: 'localhost',
                protocol: 'http',
                port: testport,
                user: 'adminuser',
                password: 'adminpass'
            });
            setTimeout(function () {
                done();
            }, 1000);
        }
    });
});
describe("create an user", function () {
    this.timeout(20000);
    it("add a common user with no db", function (done) {
        CouchAuth.createUser('user0', 'password0', 'email0@email.aa').then(function (d) {
            expect(d).to.be.ok;
            done();
        }).catch(function (err) {
            console.log(err);
            done(Error(err));
        });
    });
});
describe("test app_main", function () {
    this.timeout(20000);
    it("verificate presence of app_main db", function (done) {
        rpj.get(CouchAuth.my('app_main')).then(function (d) {
            rpj.put(CouchAuth.my('app_main') + '/testdoctobepresent0', { _id: 'testdoctobepresent0', ee: true }).then(function (d) {
                expect(d).to.be.ok;
                expect(d).to.be.an('object');
                done();
            }).catch(function (err) {
                console.log(err);
                done(Error(err));
            });
        }).catch(function (err) {
            done(Error(err));
        });
    });
    it("verificate that app_main db is not public", function (done) {
        rpj.put(CouchAuth.publink + '/app_main/testdocnotbepresent0', { _id: 'testdocnotbepresent0', ee: true }).then(function (d) {
            done(Error(d));
        }).catch(function (err) {
            expect(err).to.be.ok;
            done();
        });
    });
    it("verificate that app_main db is not open to other users", function (done) {
        rpj.put(CouchAuth.for('user0', 'password0') + '/app_main/testdocnotbepresent0', { _id: 'testdocnotbepresent0', ee: true }).then(function (d) {
            done(Error(d));
        }).catch(function (err) {
            expect(err).to.be.ok;
            done();
        });
    });
    it("verificate admin user", function (done) {
        rpj.get(CouchAuth.my('_users/org.couchdb.user:' + 'adminuser')).then(function (d) {
            expect(d).to.be.ok;
            expect(d).to.have.property('name').that.eq('adminuser');
            expect(d).to.have.property('email');
            expect(d).to.have.property('roles').that.is.an('array');
            expect(d).to.have.property('db').that.is.an('array');
            done();
        }).catch(function (err) {
            done(Error(err));
        });
    });
});
describe("create a new closed app", function () {
    it("main admin add first app", function (done) {
        this.timeout(20000);
        CouchAuth.createClosedApp('testapp').then(function (d) {
            expect(d).to.be.ok;
            done();
        }).catch(function (err) {
            done(Error(err));
        });
    });
    it("unregistered users can't access", function (done) {
        this.timeout(20000);
        rpj.get(CouchAuth.publink + '/testapp/testdoctobepresent0').then(function (d) {
            done(Error(d));
        }).catch(function (err) {
            expect(err).to.be.ok;
            done();
        });
    });
    it("other users can't access", function (done) {
        this.timeout(20000);
        rpj.get(CouchAuth.for('user0', 'password0') + '/testapp/testdoctobepresent0').then(function (d) {
            done(Error(d));
        }).catch(function (err) {
            expect(err).to.be.ok;
            done();
        });
    });
});
describe("create a new ro app", function () {
    it("main admin add ro app", function (done) {
        this.timeout(20000);
        CouchAuth.createRoApp('testapp2').then(function (d) {
            rpj.put(CouchAuth.my('testapp2') + '/testdoctobepresent0', { _id: 'testdoctobepresent0', ee: true }).then(function (d) {
                expect(d).to.be.ok;
                expect(d).to.be.an('object');
                done();
            }).catch(function (err) {
                console.log(err);
                done(Error(err));
            });
        }).catch(function (err) {
            done(Error(err));
        });
    });
    it("unregistered users can access", function (done) {
        this.timeout(20000);
        rpj.get(CouchAuth.publink + '/testapp2/testdoctobepresent0').then(function (d) {
            expect(d).to.be.ok;
            done();
        }).catch(function (err) {
            console.log(err);
            done(Error(err));
        });
    });
    it("registered users can access", function (done) {
        this.timeout(20000);
        rpj.get(CouchAuth.for('user0', 'password0') + '/testapp2/testdoctobepresent0').then(function (d) {
            expect(d).to.be.ok;
            done();
        }).catch(function (err) {
            console.log(err);
            done(Error(err));
        });
    });
    it("unregistered users can't add docs", function (done) {
        this.timeout(20000);
        rpj.put(CouchAuth.publink + '/testapp2/cccn', { _id: 'cccn', aa: true }).then(function (d) {
            console.log(d);
            done(Error(d));
        }).catch(function (err) {
            expect(err).to.be.ok;
            done();
        });
    });
    it("registered users can't add docs", function (done) {
        this.timeout(20000);
        rpj.put(CouchAuth.for('user0', 'password0') + '/testapp2/cccb', { _id: 'cccb', aa: true }).then(function (d) {
            done(Error(d));
        }).catch(function (err) {
            expect(err).to.be.ok;
            done();
        });
    });
});
describe("users", function () {
    it("unregistered users can't add dbs", function (done) {
        this.timeout(20000);
        rpj.put(CouchAuth.publink + '/testapp3');
        setTimeout(function () {
            rpj.get(CouchAuth.my('testapp3')).then(function (d) {
                console.log('ee');
                done(new Error(d));
            }).catch(function (err) {
                expect(err).to.be.ok;
                done();
            });
        }, 5000);
    });
    it("registered users can't add dbs", function (done) {
        this.timeout(20000);
        rpj.put(CouchAuth.for('user0', 'password0') + '/testapp3');
        setTimeout(function () {
            rpj.get(CouchAuth.my('testapp3')).then(function (d) {
                console.log('ee');
                done(new Error(d));
            }).catch(function (err) {
                expect(err).to.be.ok;
                done();
            });
        }, 5000);
    });
});
after(function (done) {
    Server.stop(function () {
        done();
    });
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUNyQixJQUFJLEVBQUUsQ0FBQztZQUNYLENBQUMsQ0FBQyxDQUFBO1FBQ04sQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFBO0lBRVosQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsZ0NBQWdDLEVBQUUsVUFBVSxJQUFJO1FBQy9DLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFcEIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxXQUFXLENBQUMsR0FBRyxXQUFXLENBQUMsQ0FBQTtRQUUxRCxVQUFVLENBQUM7WUFDUCxHQUFHLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO2dCQUM5QyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFBO2dCQUNqQixJQUFJLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2QixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBQyxHQUFHO2dCQUNULE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFDckIsSUFBSSxFQUFFLENBQUM7WUFDWCxDQUFDLENBQUMsQ0FBQTtRQUNOLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUVaLENBQUMsQ0FBQyxDQUFBO0FBR04sQ0FBQyxDQUFDLENBQUE7QUFJRixLQUFLLENBQUMsVUFBVSxJQUFJO0lBQ2hCLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDUixJQUFJLEVBQUUsQ0FBQTtJQUNWLENBQUMsQ0FBQyxDQUFBO0FBRU4sQ0FBQyxDQUFDLENBQUMiLCJmaWxlIjoidGVzdC9tYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgbW9jaGEgZnJvbSBcIm1vY2hhXCI7XG5pbXBvcnQgKiBhcyBjaGFpIGZyb20gXCJjaGFpXCI7XG5cbmltcG9ydCBjb3VjaGF1dGggZnJvbSBcIi4uL2luZGV4XCI7XG5cbmNvbnN0IHJwaiA9IHJlcXVpcmUoJ3JlcXVlc3QtcHJvbWlzZS1qc29uJyk7XG5jb25zdCBzcGF3blBvdWNoZGJTZXJ2ZXIgPSByZXF1aXJlKCdzcGF3bi1wb3VjaGRiLXNlcnZlcicpO1xuXG5jb25zdCB0ZXN0cG9ydCA9IDg3NDI7XG5cbmNvbnN0IHVzZXIwID0ge1xuICAgIHVzZXI6ICd0ZXN0dXNlcjAnLFxuICAgIHBhc3N3b3JkOiAndGVzdHBhc3N3MCcsXG4gICAgZW1haWw6ICd0ZXN0dXNlcjBAdGVzdC50c3QnXG59XG5cbmNvbnN0IHVzZXIxID0ge1xuICAgIHVzZXI6ICd0ZXN0dXNlcjEnLFxuICAgIHBhc3N3b3JkOiAndGVzdHBhc3N3MScsXG4gICAgZW1haWw6ICd0ZXN0dXNlcjFAdGVzdC50c3QnXG59XG5cbmxldCBleHBlY3QgPSBjaGFpLmV4cGVjdDtcblxuXG5sZXQgU2VydmVyO1xuXG5cblxubGV0IENvdWNoQXV0aDogY291Y2hhdXRoO1xuXG5cblxuYmVmb3JlKGZ1bmN0aW9uIChkb25lKSB7XG4gICAgdGhpcy50aW1lb3V0KDIwMDAwKTtcbiAgICBzcGF3blBvdWNoZGJTZXJ2ZXIoXG4gICAgICAgIHtcbiAgICAgICAgICAgIHBvcnQ6IHRlc3Rwb3J0LFxuICAgICAgICAgICAgYmFja2VuZDogZmFsc2UsXG4gICAgICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICAgICAgICBhZG1pbnM6IHsgXCJhZG1pbnVzZXJcIjogXCJhZG1pbnBhc3NcIiB9LFxuICAgICAgICAgICAgICAgIGZpbGU6IGZhbHNlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbG9nOiB7XG4gICAgICAgICAgICAgICAgZmlsZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgbGV2ZWw6ICdpbmZvJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3IsIHNlcnZlcikge1xuICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgU2VydmVyID0gc2VydmVyXG5cblxuICAgICAgICAgICAgICAgIENvdWNoQXV0aCA9IG5ldyBjb3VjaGF1dGgoe1xuICAgICAgICAgICAgICAgICAgICBob3N0bmFtZTogJ2xvY2FsaG9zdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3RvY29sOiAnaHR0cCcsXG4gICAgICAgICAgICAgICAgICAgIHBvcnQ6IHRlc3Rwb3J0LFxuICAgICAgICAgICAgICAgICAgICB1c2VyOiAnYWRtaW51c2VyJyxcbiAgICAgICAgICAgICAgICAgICAgcGFzc3dvcmQ6ICdhZG1pbnBhc3MnXG4gICAgICAgICAgICAgICAgfSk7XG5cblxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBkb25lKClcbiAgICAgICAgICAgICAgICB9LCAxMDAwKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuXG5cblxuXG5cblxuXG59KTtcblxuZGVzY3JpYmUoXCJjcmVhdGUgYW4gdXNlclwiLCBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy50aW1lb3V0KDIwMDAwKTtcbiAgICBpdChcImFkZCBhIGNvbW1vbiB1c2VyIHdpdGggbm8gZGJcIiwgZnVuY3Rpb24gKGRvbmUpIHtcbiAgICAgICAgQ291Y2hBdXRoLmNyZWF0ZVVzZXIoJ3VzZXIwJywgJ3Bhc3N3b3JkMCcsICdlbWFpbDBAZW1haWwuYWEnKS50aGVuKChkKSA9PiB7XG4gICAgICAgICAgICBleHBlY3QoZCkudG8uYmUub2s7XG4gICAgICAgICAgICBkb25lKClcbiAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgICAgICAgICAgZG9uZShFcnJvcihlcnIpKTtcbiAgICAgICAgfSlcbiAgICB9KVxufSlcblxuZGVzY3JpYmUoXCJ0ZXN0IGFwcF9tYWluXCIsIGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnRpbWVvdXQoMjAwMDApO1xuXG4gICAgaXQoXCJ2ZXJpZmljYXRlIHByZXNlbmNlIG9mIGFwcF9tYWluIGRiXCIsIGZ1bmN0aW9uIChkb25lKSB7XG5cblxuICAgICAgICBycGouZ2V0KENvdWNoQXV0aC5teSgnYXBwX21haW4nKSkudGhlbihmdW5jdGlvbiAoZCkge1xuXG4gICAgICAgICAgICBycGoucHV0KENvdWNoQXV0aC5teSgnYXBwX21haW4nKSArICcvdGVzdGRvY3RvYmVwcmVzZW50MCcsIHsgX2lkOiAndGVzdGRvY3RvYmVwcmVzZW50MCcsIGVlOiB0cnVlIH0pLnRoZW4oZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICBleHBlY3QoZCkudG8uYmUub2s7XG4gICAgICAgICAgICAgICAgZXhwZWN0KGQpLnRvLmJlLmFuKCdvYmplY3QnKTtcbiAgICAgICAgICAgICAgICBkb25lKCk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgICAgICAgICAgICAgIGRvbmUoRXJyb3IoZXJyKSk7XG4gICAgICAgICAgICB9KVxuXG5cbiAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgZG9uZShFcnJvcihlcnIpKTtcbiAgICAgICAgfSlcbiAgICB9KTtcblxuICAgIGl0KFwidmVyaWZpY2F0ZSB0aGF0IGFwcF9tYWluIGRiIGlzIG5vdCBwdWJsaWNcIiwgZnVuY3Rpb24gKGRvbmUpIHtcbiAgICAgICAgLy8gICAgY29uc29sZS5sb2coQ291Y2hBdXRoLm15KCdhcHBfbWFpbicpKVxuICAgICAgICBycGoucHV0KENvdWNoQXV0aC5wdWJsaW5rICsgJy9hcHBfbWFpbi90ZXN0ZG9jbm90YmVwcmVzZW50MCcsIHsgX2lkOiAndGVzdGRvY25vdGJlcHJlc2VudDAnLCBlZTogdHJ1ZSB9KS50aGVuKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICBkb25lKEVycm9yKGQpKTtcbiAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgZXhwZWN0KGVycikudG8uYmUub2s7XG4gICAgICAgICAgICBkb25lKCk7XG4gICAgICAgIH0pXG5cbiAgICB9KTtcblxuICAgIGl0KFwidmVyaWZpY2F0ZSB0aGF0IGFwcF9tYWluIGRiIGlzIG5vdCBvcGVuIHRvIG90aGVyIHVzZXJzXCIsIGZ1bmN0aW9uIChkb25lKSB7XG4gICAgICAgIHJwai5wdXQoQ291Y2hBdXRoLmZvcigndXNlcjAnLCAncGFzc3dvcmQwJykgKyAnL2FwcF9tYWluL3Rlc3Rkb2Nub3RiZXByZXNlbnQwJywgeyBfaWQ6ICd0ZXN0ZG9jbm90YmVwcmVzZW50MCcsIGVlOiB0cnVlIH0pLnRoZW4oZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIGRvbmUoRXJyb3IoZCkpO1xuICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICBleHBlY3QoZXJyKS50by5iZS5vaztcbiAgICAgICAgICAgIGRvbmUoKTtcbiAgICAgICAgfSlcblxuICAgIH0pO1xuXG4gICAgaXQoXCJ2ZXJpZmljYXRlIGFkbWluIHVzZXJcIiwgZnVuY3Rpb24gKGRvbmUpIHtcbiAgICAgICAgLy8gICAgY29uc29sZS5sb2coQ291Y2hBdXRoLm15KCdhcHBfbWFpbicpKVxuICAgICAgICBycGouZ2V0KENvdWNoQXV0aC5teSgnX3VzZXJzL29yZy5jb3VjaGRiLnVzZXI6JyArICdhZG1pbnVzZXInKSkudGhlbihmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgZXhwZWN0KGQpLnRvLmJlLm9rO1xuICAgICAgICAgICAgZXhwZWN0KGQpLnRvLmhhdmUucHJvcGVydHkoJ25hbWUnKS50aGF0LmVxKCdhZG1pbnVzZXInKTtcbiAgICAgICAgICAgIGV4cGVjdChkKS50by5oYXZlLnByb3BlcnR5KCdlbWFpbCcpO1xuICAgICAgICAgICAgZXhwZWN0KGQpLnRvLmhhdmUucHJvcGVydHkoJ3JvbGVzJykudGhhdC5pcy5hbignYXJyYXknKTtcbiAgICAgICAgICAgIGV4cGVjdChkKS50by5oYXZlLnByb3BlcnR5KCdkYicpLnRoYXQuaXMuYW4oJ2FycmF5Jyk7XG4gICAgICAgICAgICBkb25lKCk7XG4gICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgIGRvbmUoRXJyb3IoZXJyKSk7XG4gICAgICAgIH0pXG5cbiAgICB9KTtcblxuXG59KTtcbmRlc2NyaWJlKFwiY3JlYXRlIGEgbmV3IGNsb3NlZCBhcHBcIiwgZnVuY3Rpb24gKCkge1xuICAgIGl0KFwibWFpbiBhZG1pbiBhZGQgZmlyc3QgYXBwXCIsIGZ1bmN0aW9uIChkb25lKSB7XG4gICAgICAgIHRoaXMudGltZW91dCgyMDAwMCk7XG5cbiAgICAgICAgQ291Y2hBdXRoLmNyZWF0ZUNsb3NlZEFwcCgndGVzdGFwcCcpLnRoZW4oZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIGV4cGVjdChkKS50by5iZS5vaztcblxuICAgICAgICAgICAgZG9uZSgpXG4gICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgIGRvbmUoRXJyb3IoZXJyKSk7XG4gICAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KFwidW5yZWdpc3RlcmVkIHVzZXJzIGNhbid0IGFjY2Vzc1wiLCBmdW5jdGlvbiAoZG9uZSkge1xuICAgICAgICB0aGlzLnRpbWVvdXQoMjAwMDApO1xuXG4gICAgICAgIHJwai5nZXQoQ291Y2hBdXRoLnB1YmxpbmsgKyAnL3Rlc3RhcHAvdGVzdGRvY3RvYmVwcmVzZW50MCcpLnRoZW4oZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIGRvbmUoRXJyb3IoZCkpO1xuICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICBleHBlY3QoZXJyKS50by5iZS5vaztcbiAgICAgICAgICAgIGRvbmUoKTtcbiAgICAgICAgfSlcbiAgICB9KVxuXG4gICAgaXQoXCJvdGhlciB1c2VycyBjYW4ndCBhY2Nlc3NcIiwgZnVuY3Rpb24gKGRvbmUpIHtcbiAgICAgICAgdGhpcy50aW1lb3V0KDIwMDAwKTtcblxuICAgICAgICBycGouZ2V0KENvdWNoQXV0aC5mb3IoJ3VzZXIwJywgJ3Bhc3N3b3JkMCcpICsgJy90ZXN0YXBwL3Rlc3Rkb2N0b2JlcHJlc2VudDAnKS50aGVuKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICBkb25lKEVycm9yKGQpKTtcbiAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgZXhwZWN0KGVycikudG8uYmUub2s7XG4gICAgICAgICAgICBkb25lKCk7XG4gICAgICAgIH0pXG4gICAgfSlcblxuXG59KVxuXG5kZXNjcmliZShcImNyZWF0ZSBhIG5ldyBybyBhcHBcIiwgZnVuY3Rpb24gKCkge1xuICAgIGl0KFwibWFpbiBhZG1pbiBhZGQgcm8gYXBwXCIsIGZ1bmN0aW9uIChkb25lKSB7XG4gICAgICAgIHRoaXMudGltZW91dCgyMDAwMCk7XG5cbiAgICAgICAgQ291Y2hBdXRoLmNyZWF0ZVJvQXBwKCd0ZXN0YXBwMicpLnRoZW4oZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIHJwai5wdXQoQ291Y2hBdXRoLm15KCd0ZXN0YXBwMicpICsgJy90ZXN0ZG9jdG9iZXByZXNlbnQwJywgeyBfaWQ6ICd0ZXN0ZG9jdG9iZXByZXNlbnQwJywgZWU6IHRydWUgfSkudGhlbihmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIGV4cGVjdChkKS50by5iZS5vaztcbiAgICAgICAgICAgICAgICBleHBlY3QoZCkudG8uYmUuYW4oJ29iamVjdCcpO1xuICAgICAgICAgICAgICAgIGRvbmUoKTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpXG4gICAgICAgICAgICAgICAgZG9uZShFcnJvcihlcnIpKTtcbiAgICAgICAgICAgIH0pXG5cblxuICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICBkb25lKEVycm9yKGVycikpO1xuICAgICAgICB9KVxuICAgIH0pXG5cbiAgICBpdChcInVucmVnaXN0ZXJlZCB1c2VycyBjYW4gYWNjZXNzXCIsIGZ1bmN0aW9uIChkb25lKSB7XG4gICAgICAgIHRoaXMudGltZW91dCgyMDAwMCk7XG5cbiAgICAgICAgcnBqLmdldChDb3VjaEF1dGgucHVibGluayArICcvdGVzdGFwcDIvdGVzdGRvY3RvYmVwcmVzZW50MCcpLnRoZW4oZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIGV4cGVjdChkKS50by5iZS5vaztcbiAgICAgICAgICAgIGRvbmUoKTtcblxuICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpXG4gICAgICAgICAgICBkb25lKEVycm9yKGVycikpO1xuICAgICAgICB9KVxuICAgIH0pXG4gICAgaXQoXCJyZWdpc3RlcmVkIHVzZXJzIGNhbiBhY2Nlc3NcIiwgZnVuY3Rpb24gKGRvbmUpIHtcbiAgICAgICAgdGhpcy50aW1lb3V0KDIwMDAwKTtcblxuICAgICAgICBycGouZ2V0KENvdWNoQXV0aC5mb3IoJ3VzZXIwJywgJ3Bhc3N3b3JkMCcpICsgJy90ZXN0YXBwMi90ZXN0ZG9jdG9iZXByZXNlbnQwJykudGhlbihmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgZXhwZWN0KGQpLnRvLmJlLm9rO1xuICAgICAgICAgICAgZG9uZSgpO1xuXG4gICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycilcbiAgICAgICAgICAgIGRvbmUoRXJyb3IoZXJyKSk7XG4gICAgICAgIH0pXG4gICAgfSlcbiAgICBpdChcInVucmVnaXN0ZXJlZCB1c2VycyBjYW4ndCBhZGQgZG9jc1wiLCBmdW5jdGlvbiAoZG9uZSkge1xuICAgICAgICB0aGlzLnRpbWVvdXQoMjAwMDApO1xuXG4gICAgICAgIHJwai5wdXQoQ291Y2hBdXRoLnB1YmxpbmsgKyAnL3Rlc3RhcHAyL2NjY24nLCB7IF9pZDogJ2NjY24nLCBhYTogdHJ1ZSB9KS50aGVuKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhkKVxuICAgICAgICAgICAgZG9uZShFcnJvcihkKSk7XG4gICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgIGV4cGVjdChlcnIpLnRvLmJlLm9rO1xuICAgICAgICAgICAgZG9uZSgpO1xuICAgICAgICB9KVxuICAgIH0pXG5cbiAgICBpdChcInJlZ2lzdGVyZWQgdXNlcnMgY2FuJ3QgYWRkIGRvY3NcIiwgZnVuY3Rpb24gKGRvbmUpIHtcbiAgICAgICAgdGhpcy50aW1lb3V0KDIwMDAwKTtcblxuICAgICAgICBycGoucHV0KENvdWNoQXV0aC5mb3IoJ3VzZXIwJywgJ3Bhc3N3b3JkMCcpICsgJy90ZXN0YXBwMi9jY2NiJywgeyBfaWQ6ICdjY2NiJywgYWE6IHRydWUgfSkudGhlbihmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgZG9uZShFcnJvcihkKSk7XG4gICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgIGV4cGVjdChlcnIpLnRvLmJlLm9rO1xuICAgICAgICAgICAgZG9uZSgpO1xuICAgICAgICB9KVxuICAgIH0pXG5cblxufSlcblxuXG5kZXNjcmliZShcInVzZXJzXCIsIGZ1bmN0aW9uICgpIHtcblxuXG4gICAgaXQoXCJ1bnJlZ2lzdGVyZWQgdXNlcnMgY2FuJ3QgYWRkIGRic1wiLCBmdW5jdGlvbiAoZG9uZSkge1xuICAgICAgICB0aGlzLnRpbWVvdXQoMjAwMDApO1xuXG4gICAgICAgIHJwai5wdXQoQ291Y2hBdXRoLnB1YmxpbmsgKyAnL3Rlc3RhcHAzJylcblxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHJwai5nZXQoQ291Y2hBdXRoLm15KCd0ZXN0YXBwMycpKS50aGVuKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2VlJylcbiAgICAgICAgICAgICAgICBkb25lKG5ldyBFcnJvcihkKSk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgZXhwZWN0KGVycikudG8uYmUub2s7XG4gICAgICAgICAgICAgICAgZG9uZSgpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfSwgNTAwMClcblxuICAgIH0pXG5cbiAgICBpdChcInJlZ2lzdGVyZWQgdXNlcnMgY2FuJ3QgYWRkIGRic1wiLCBmdW5jdGlvbiAoZG9uZSkge1xuICAgICAgICB0aGlzLnRpbWVvdXQoMjAwMDApO1xuXG4gICAgICAgIHJwai5wdXQoQ291Y2hBdXRoLmZvcigndXNlcjAnLCAncGFzc3dvcmQwJykgKyAnL3Rlc3RhcHAzJylcblxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHJwai5nZXQoQ291Y2hBdXRoLm15KCd0ZXN0YXBwMycpKS50aGVuKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2VlJylcbiAgICAgICAgICAgICAgICBkb25lKG5ldyBFcnJvcihkKSk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgZXhwZWN0KGVycikudG8uYmUub2s7XG4gICAgICAgICAgICAgICAgZG9uZSgpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfSwgNTAwMClcblxuICAgIH0pXG5cblxufSlcblxuXG5cbmFmdGVyKGZ1bmN0aW9uIChkb25lKSB7XG4gICAgU2VydmVyLnN0b3AoZnVuY3Rpb24gKCkge1xuICAgICAgICBkb25lKClcbiAgICB9KVxuXG59KTsiXX0=
