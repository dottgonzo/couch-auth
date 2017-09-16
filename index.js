"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Promise = require("bluebird");
var async = require("async");
var couchjsonconf_1 = require("couchjsonconf");
var express = require("express");
var uid = require("uid");
var rpj = require("request-promise-json");
function getuserdb(internal_couchdb, adminAuth, username) {
    return new Promise(function (resolve, reject) {
        if (adminAuth && internal_couchdb.checkAdmin(adminAuth)) {
            rpj.get(internal_couchdb.my('_users/org.couchdb.user:' + username)).then(function (doc) {
                resolve(doc);
            }).catch(function (err) {
                if (err.statusCode !== 404) {
                    console.error("ERROR!!! " + err);
                }
                reject(err);
            });
        }
        else {
            reject({ error: 'unauthorized' });
        }
    });
}
var couchAccess = (function (_super) {
    __extends(couchAccess, _super);
    function couchAccess(rootaccessdb) {
        var _this = _super.call(this, rootaccessdb) || this;
        var that = _this;
        function addAdminRole() {
            that.addAppRole({ user: that.user, password: that.password }, that.user, 'app_main');
        }
        rpj.get(that.my('app_main')).then(function () {
            getuserdb(that, { user: that.user, password: that.password }, that.user).then(function (u) {
                if (u.roles.indexOf('app_main') !== -1) {
                    addAdminRole();
                }
                else {
                    return true;
                }
            }).catch(function (err) {
                that.createUser({ user: that.user, password: that.password }, { user: that.user, password: that.password }).then(function () {
                    addAdminRole();
                }).catch(function (err) {
                    console.error('graverror 325');
                    throw new Error(err);
                });
            });
        }).catch(function (err) {
            that.createClosedApp({ user: that.user, password: that.password }, 'app_main').then(function () {
                var services = {
                    _id: 'services',
                    services: []
                };
                rpj.put(that.my('app_main') + '/services', services).then(function () {
                    getuserdb(that, { user: that.user, password: that.password }, that.user).then(function (u) {
                        if (u.roles.indexOf('app_main') !== -1) {
                            addAdminRole();
                        }
                        else {
                            return true;
                        }
                    }).catch(function (err) {
                        that.createUser({ user: that.user, password: that.password }, { user: that.user, password: that.password }).then(function () {
                            addAdminRole();
                        }).catch(function (err) {
                            console.error('terrible error 54745');
                            throw new Error(err);
                        });
                    });
                }).catch(function (err) {
                    console.error('terrible error 4545');
                    throw new Error(err);
                });
            }).catch(function (err) {
                console.error('terrible error 423545');
                throw new Error(err);
            });
        });
        return _this;
    }
    couchAccess.prototype.checkAdmin = function (adminAuth) {
        if (adminAuth && adminAuth.user && adminAuth.password && adminAuth.user === this.user && adminAuth.password === this.password) {
            return true;
        }
        else {
            return false;
        }
    };
    couchAccess.prototype.login = function (auth) {
        var that = this;
        return new Promise(function (resolve, reject) {
            if (auth && auth.user && auth.password) {
                rpj.get(that.my('_users/org.couchdb.user:' + auth.user)).then(function () {
                    rpj.get(that.for(auth.user, auth.password, '_users/org.couchdb.user:' + auth.user)).then(function (doc) {
                        resolve(doc);
                    }).catch(function (err) {
                        if (err.statusCode !== 404) {
                            console.error("ERROR!!! " + err);
                        }
                        reject(err);
                    });
                }).catch(function (err) {
                    if (err.statusCode !== 404) {
                        console.error("ERROR!!! " + err);
                    }
                    reject(err);
                });
            }
            else {
                if (!auth) {
                    reject('no options provided');
                }
                else if (!auth.user) {
                    reject('no username provided');
                }
                else if (!auth.password) {
                    reject('no password provided');
                }
                else {
                    reject('undefined error');
                }
            }
        });
    };
    couchAccess.prototype.addAppRole = function (auth, username, app_id) {
        var that = this;
        return new Promise(function (resolve, reject) {
            getuserdb(that, auth, username).then(function (u) {
                u.roles.push(app_id);
                rpj.put(that.my('_users/org.couchdb.user:' + username), u).then(function () {
                    if (username === auth.user) {
                        resolve(true);
                    }
                    else {
                        rpj.get(that.my(app_id + '/users')).then(function (doc) {
                            doc.users.push({ name: username, role: 'user', createdAt: Date.now() });
                            rpj.put(that.my(app_id + '/users'), doc).then(function (doc) {
                                resolve(true);
                            }).catch(function (err) {
                                reject(err);
                            });
                        }).catch(function (err) {
                            if (err.statusCode !== 404) {
                                reject(err);
                            }
                            else {
                                var doc = {
                                    _id: 'users',
                                    users: [{ name: username, role: 'user', createdAt: Date.now() }],
                                    createdAt: Date.now()
                                };
                                rpj.put(that.my(app_id + '/users'), doc).then(function (doc) {
                                    resolve(true);
                                }).catch(function (err) {
                                    reject(err);
                                });
                            }
                        });
                    }
                }).catch(function (err) {
                    reject(err);
                });
            }).catch(function (err) {
                reject(err);
            });
        });
    };
    couchAccess.prototype.createUser = function (adminauth, user) {
        var that = this;
        return new Promise(function (resolve, reject) {
            getuserdb(that, adminauth, user.user).then(function (u) {
                reject("user " + user.user + " just eixsts");
            }).catch(function (err) {
                var doc = { name: user.user, db: [], "roles": ['user'], "type": "user", password: user.password };
                rpj.put(that.my('_users/org.couchdb.user:' + user.user), doc).then(function () {
                    getuserdb(that, adminauth, user.user).then(function (u) {
                        resolve(u);
                    }).catch(function (err) {
                        reject(err);
                    });
                }).catch(function (err) {
                    reject(err);
                });
            });
        });
    };
    couchAccess.prototype.createClosedApp = function (admin, app_id) {
        var that = this;
        return new Promise(function (resolve, reject) {
            if (admin && that.checkAdmin(admin)) {
                if (app_id !== 'app_main')
                    app_id = 'private_' + app_id;
                rpj.put(that.my(app_id)).then(function () {
                    rpj.put(that.my(app_id + '/_design/auth'), {
                        "language": "javascript",
                        "validate_doc_update": "function(n,o,u){if(n._id&&!n._id.indexOf(\"_local/\"))return;if(!u||!u.roles||(u.roles.indexOf(\"" + app_id + "\")==-1&&u.roles.indexOf(\"_admin\")==-1)){throw({forbidden:'Denied.'})}}"
                    }).then(function () {
                        resolve(true);
                    }).catch(function (err) {
                        if (err.statusCode !== 404) {
                            console.error("ERROR!!! " + err);
                        }
                        reject(err);
                    });
                }).catch(function (err) {
                    if (err.statusCode !== 404) {
                        console.error("ERROR!!! " + err);
                    }
                    else {
                        reject(err);
                    }
                });
            }
            else {
                reject({ error: 'unauthorized' });
            }
        });
    };
    couchAccess.prototype.createServiceApp = function (admin, app_id, slaveuser) {
        var that = this;
        return new Promise(function (resolve, reject) {
            if (admin && that.checkAdmin(admin) && app_id && slaveuser && slaveuser.user && slaveuser.password) {
                app_id = 'service_' + app_id;
                rpj.put(that.my(app_id)).then(function () {
                    rpj.put(that.my(app_id + '/_design/auth'), {
                        "language": "javascript",
                        "validate_doc_update": "function(n,o,u){if(n._id&&!n._id.indexOf(\"_local/\"))return;if(!u||!u.roles||(u.roles.indexOf(\"" + app_id + "\")==-1&&u.roles.indexOf(\"_admin\")==-1)){throw({forbidden:'Denied.'})}}"
                    }).then(function () {
                        that.createUser(admin, slaveuser).then(function () {
                            that.addAppRole(admin, slaveuser.user, app_id).then(function () {
                                var devicesdoc = {
                                    _id: 'devices',
                                    devices: [],
                                    createdAt: Date.now()
                                };
                                rpj.put(that.my(app_id + '/devices'), devicesdoc).then(function () {
                                    rpj.get(that.my('app_main') + '/services').then(function (servicesdoc) {
                                        servicesdoc.services.push({
                                            db: app_id,
                                            createdAt: Date.now()
                                        });
                                        rpj.put(that.my('app_main') + '/services', servicesdoc).then(function () {
                                            resolve(true);
                                        }).catch(function (err) {
                                            reject(err);
                                        });
                                    }).catch(function (err) {
                                        reject(err);
                                    });
                                }).catch(function (err) {
                                    reject(err);
                                });
                            }).catch(function (err) {
                                reject(err);
                            });
                        }).catch(function (err) {
                            reject(err);
                        });
                    }).catch(function (err) {
                        reject(err);
                    });
                }).catch(function (err) {
                    reject(err);
                });
            }
            else {
                reject({ error: 'wrong params for service app creation' });
            }
        });
    };
    couchAccess.prototype.getServices = function (admin) {
        var that = this;
        return new Promise(function (resolve, reject) {
            if (admin && that.checkAdmin(admin)) {
                rpj.get(that.my('app_main/services')).then(function (doc) {
                    resolve(doc.services);
                }).catch(function (err) {
                    reject(err);
                });
            }
            else {
                reject({ error: 'unauthorized' });
            }
        });
    };
    couchAccess.prototype.Setup = function (admin, services) {
        var that = this;
        return new Promise(function (resolve, reject) {
            if (admin && that.checkAdmin(admin)) {
                async.eachSeries(services, function (service, cb) {
                    console.log('todo');
                    console.log(service);
                    cb();
                }, function (err) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(true);
                    }
                });
            }
            else {
                reject({ error: 'unauthorized' });
            }
        });
    };
    couchAccess.prototype.createPubApp = function (admin, app_id) {
        var that = this;
        return new Promise(function (resolve, reject) {
            if (admin && that.checkAdmin(admin)) {
                app_id = 'pub_' + app_id;
                rpj.put(that.my(app_id)).then(function () {
                    rpj.put(that.my(app_id + '/_design/auth'), {
                        "language": "javascript",
                        "validate_doc_update": "function(n, o, u) { if (u.roles.length == 0 || u.roles.indexOf('_admin') == -1) { throw({ forbidden: 'You must be an admin in to save data' }); } }"
                    }).then(function () {
                        resolve(true);
                    }).catch(function (err) {
                        reject(err);
                    });
                }).catch(function (err) {
                    if (err.statusCode !== 404) {
                        console.error("ERROR!!! " + err);
                    }
                    reject(err);
                });
            }
            else {
                reject({ error: 'unauthorized' });
            }
        });
    };
    return couchAccess;
}(couchjsonconf_1.default));
exports.couchAccess = couchAccess;
var router = express.Router();
function accessRouter(rootaccessdb) {
    var CouchAuth = new couchAccess(rootaccessdb);
    router.get('/', function (req, res) {
        res.send('need access');
    });
    router.post('/testadmin', function (req, res) {
        if (req.body && req.body.admin && CouchAuth.checkAdmin(req.body.admin)) {
            res.send({ ok: true });
        }
        else {
            res.send({ error: 'wrong admin credentials' });
        }
    });
    router.post('/users/create', function (req, res) {
        if (req.body && req.body.admin && CouchAuth.checkAdmin(req.body.admin)) {
            if (req.body.newuser && req.body.newuser.user && req.body.newuser.password) {
                CouchAuth.createUser(req.body.admin, req.body.newuser).then(function () {
                    res.send({ ok: true });
                }).catch(function (err) {
                    res.send({ error: err });
                });
            }
            else {
                res.send({ error: 'wrong user credentials' });
            }
        }
        else {
            res.send({ error: 'wrong admin credentials' });
        }
    });
    router.post('/users/:user/login', function (req, res) {
        if (req.body && req.body.password) {
            CouchAuth.login({ user: req.params.user, password: req.body.password }).then(function () {
                res.send({ ok: true });
            }).catch(function (err) {
                res.send({ error: err });
            });
        }
        else {
            res.send({ error: 'wrong admin credentials' });
        }
    });
    router.post('/services/create', function (req, res) {
        if (req.body && req.body.admin && CouchAuth.checkAdmin(req.body.admin)) {
            if (req.body.newuser && req.body.newuser.user && req.body.newuser.password) {
                if (req.body.app_id) {
                    CouchAuth.createServiceApp(req.body.admin, req.body.app_id, req.body.newuser).then(function () {
                        res.send({ ok: true });
                    }).catch(function (err) {
                        res.send({ error: err });
                    });
                }
                else {
                    res.send({ error: 'wrong app_id' });
                }
            }
            else {
                res.send({ error: 'wrong user credentials' });
            }
        }
        else {
            res.send({ error: 'wrong admin credentials' });
        }
    });
    return router;
}
exports.accessRouter = accessRouter;
