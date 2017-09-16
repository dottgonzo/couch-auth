"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai = require("chai");
var index_1 = require("../index");
var axios = require("axios");
var spawnPouchdbServer = require('spawn-pouchdb-server');
var express = require("express");
var bodyParser = require("body-parser");
var testport = 8743;
var testexpressport = 8744;
var adminUser = {
    user: 'adminuser',
    password: 'adminpass'
};
var user0 = {
    user: 'testuser0',
    password: 'testpassw0'
};
var slaveuser = {
    user: 'slaveslave1',
    password: 'slavepassw1'
};
var expect = chai.expect;
var Server;
var aa = 'ss';
var route = 'http://localhost:' + testexpressport + '/access';
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
            var CouchAccess = index_1.accessRouter({
                hostname: 'localhost',
                protocol: 'http',
                port: testport,
                user: adminUser.user,
                password: adminUser.password
            });
            var app = express();
            app.use(bodyParser.urlencoded({ extended: false }));
            app.use(bodyParser.json());
            app.use('/access', CouchAccess);
            app.listen(testexpressport, function () {
                setTimeout(function () {
                    done();
                }, 2000);
            });
        }
    });
});
describe("test express server", function () {
    describe("check server", function () {
        it("exists", function (done) {
            axios.get(route).then(function (a) {
                expect(a).to.be.ok;
                done();
            }).catch(function (err) {
                done(new Error(err));
            });
        });
        it("testadmin", function (done) {
            axios.post(route + '/testadmin', { admin: adminUser }).then(function (a) {
                if (a && a.data && a.data.error) {
                    done(new Error(a.data.error));
                }
                else {
                    expect(a).to.be.ok;
                    expect(a.data).to.have.property('ok').that.eq(true);
                    done();
                }
            }).catch(function (err) {
                done(new Error(err));
            });
        });
    });
    describe("users", function () {
        it("testadmin", function (done) {
            axios.post(route + '/testadmin', { admin: adminUser }).then(function (a) {
                if (a && a.data && a.data.error) {
                    done(new Error(a.data.error));
                }
                else {
                    expect(a).to.be.ok;
                    expect(a.data).to.have.property('ok').that.eq(true);
                    done();
                }
            }).catch(function (err) {
                done(new Error(err));
            });
        });
    });
    describe("services", function () {
        it("testadmin", function (done) {
            axios.post(route + '/testadmin', { admin: adminUser }).then(function (a) {
                if (a && a.data && a.data.error) {
                    done(new Error(a.data.error));
                }
                else {
                    expect(a).to.be.ok;
                    expect(a.data).to.have.property('ok').that.eq(true);
                    done();
                }
            }).catch(function (err) {
                done(new Error(err));
            });
        });
    });
});
