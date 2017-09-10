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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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aW1wb3J0ICogYXMgUHJvbWlzZSBmcm9tIFwiYmx1ZWJpcmRcIlxuaW1wb3J0ICogYXMgXyBmcm9tIFwibG9kYXNoXCJcbmltcG9ydCAqIGFzIGFzeW5jIGZyb20gXCJhc3luY1wiXG5cbmltcG9ydCBjb3VjaEpzb25Db25mIGZyb20gXCJjb3VjaGpzb25jb25mXCJcblxuaW1wb3J0ICogYXMgZXhwcmVzcyBmcm9tIFwiZXhwcmVzc1wiXG5cblxuaW1wb3J0ICogYXMgSSBmcm9tIFwiLi9pbnRlcmZhY2VcIlxuXG5jb25zdCB1aWQgPSByZXF1aXJlKFwidWlkXCIpXG5jb25zdCBycGogPSByZXF1aXJlKFwicmVxdWVzdC1wcm9taXNlLWpzb25cIilcblxuXG5cblxuXG5mdW5jdGlvbiBnZXR1c2VyZGIoaW50ZXJuYWxfY291Y2hkYiwgYWRtaW5BdXRoOiBJLklBdXRoLCB1c2VybmFtZTogc3RyaW5nKTogUHJvbWlzZTxJLklVc2VyREI+IHtcblxuICAgIC8vIHJldHVybiBhbGwgdGhlIHVzZXIgZG9jIGluIF91c2Vyc1xuXG5cbiAgICByZXR1cm4gbmV3IFByb21pc2U8SS5JVXNlckRCPihmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGlmIChhZG1pbkF1dGggJiYgaW50ZXJuYWxfY291Y2hkYi5jaGVja0FkbWluKGFkbWluQXV0aCkpIHtcblxuICAgICAgICAgICAgcnBqLmdldChpbnRlcm5hbF9jb3VjaGRiLm15KCdfdXNlcnMvb3JnLmNvdWNoZGIudXNlcjonICsgdXNlcm5hbWUpKS50aGVuKGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKGRvYylcbiAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT09IDQwNCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRVJST1IhISEgXCIgKyBlcnIpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVqZWN0KHsgZXJyb3I6ICd1bmF1dGhvcml6ZWQnIH0pXG4gICAgICAgIH1cbiAgICB9KVxufVxuXG5cblxuZXhwb3J0IGNsYXNzIGNvdWNoQWNjZXNzIGV4dGVuZHMgY291Y2hKc29uQ29uZiB7XG5cbiAgICBjb25zdHJ1Y3Rvcihyb290YWNjZXNzZGI6IEkuSUNsYXNzQ29uZikge1xuICAgICAgICBzdXBlcihyb290YWNjZXNzZGIpXG5cbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXNcblxuXG5cbiAgICAgICAgZnVuY3Rpb24gYWRkQWRtaW5Sb2xlKCkge1xuICAgICAgICAgICAgdGhhdC5hZGRBcHBSb2xlKHsgdXNlcjogdGhhdC51c2VyLCBwYXNzd29yZDogdGhhdC5wYXNzd29yZCB9LCB0aGF0LnVzZXIsICdhcHBfbWFpbicpXG4gICAgICAgIH1cblxuICAgICAgICBycGouZ2V0KHRoYXQubXkoJ2FwcF9tYWluJykpLnRoZW4oZnVuY3Rpb24gKCkge1xuXG5cbiAgICAgICAgICAgIGdldHVzZXJkYih0aGF0LCB7IHVzZXI6IHRoYXQudXNlciwgcGFzc3dvcmQ6IHRoYXQucGFzc3dvcmQgfSwgdGhhdC51c2VyKS50aGVuKCh1KSA9PiB7XG5cbiAgICAgICAgICAgICAgICBpZiAodS5yb2xlcy5pbmRleE9mKCdhcHBfbWFpbicpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBhZGRBZG1pblJvbGUoKVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgIHRoYXQuY3JlYXRlVXNlcih7IHVzZXI6IHRoYXQudXNlciwgcGFzc3dvcmQ6IHRoYXQucGFzc3dvcmQgfSwgeyB1c2VyOiB0aGF0LnVzZXIsIHBhc3N3b3JkOiB0aGF0LnBhc3N3b3JkIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBhZGRBZG1pblJvbGUoKVxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignZ3JhdmVycm9yIDMyNScpXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnIpXG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgfSlcblxuXG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcblxuICAgICAgICAgICAgdGhhdC5jcmVhdGVDbG9zZWRBcHAoeyB1c2VyOiB0aGF0LnVzZXIsIHBhc3N3b3JkOiB0aGF0LnBhc3N3b3JkIH0sICdhcHBfbWFpbicpLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgY29uc3Qgc2VydmljZXM6IEkuSVNlcnZpY2VzRG9jID0ge1xuICAgICAgICAgICAgICAgICAgICBfaWQ6ICdzZXJ2aWNlcycsXG4gICAgICAgICAgICAgICAgICAgIHNlcnZpY2VzOiBbXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBycGoucHV0KHRoYXQubXkoJ2FwcF9tYWluJykgKyAnL3NlcnZpY2VzJywgc2VydmljZXMpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBnZXR1c2VyZGIodGhhdCwgeyB1c2VyOiB0aGF0LnVzZXIsIHBhc3N3b3JkOiB0aGF0LnBhc3N3b3JkIH0sIHRoYXQudXNlcikudGhlbigodSkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodS5yb2xlcy5pbmRleE9mKCdhcHBfbWFpbicpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZEFkbWluUm9sZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmNyZWF0ZVVzZXIoeyB1c2VyOiB0aGF0LnVzZXIsIHBhc3N3b3JkOiB0aGF0LnBhc3N3b3JkIH0sIHsgdXNlcjogdGhhdC51c2VyLCBwYXNzd29yZDogdGhhdC5wYXNzd29yZCB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRBZG1pblJvbGUoKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ3RlcnJpYmxlIGVycm9yIDU0NzQ1JylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcigndGVycmlibGUgZXJyb3IgNDU0NScpXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnIpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCd0ZXJyaWJsZSBlcnJvciA0MjM1NDUnKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnIpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGNoZWNrQWRtaW4oYWRtaW5BdXRoOiBJLklBdXRoKSB7XG4gICAgICAgIGlmIChhZG1pbkF1dGggJiYgYWRtaW5BdXRoLnVzZXIgJiYgYWRtaW5BdXRoLnBhc3N3b3JkICYmIGFkbWluQXV0aC51c2VyID09PSB0aGlzLnVzZXIgJiYgYWRtaW5BdXRoLnBhc3N3b3JkID09PSB0aGlzLnBhc3N3b3JkKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBsb2dpbihhdXRoOiBJLklBdXRoKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzXG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPEkuSVVzZXJEQj4oZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXG4gICAgICAgICAgICBpZiAoYXV0aCAmJiBhdXRoLnVzZXIgJiYgYXV0aC5wYXNzd29yZCkge1xuICAgICAgICAgICAgICAgIHJwai5nZXQodGhhdC5teSgnX3VzZXJzL29yZy5jb3VjaGRiLnVzZXI6JyArIGF1dGgudXNlcikpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBycGouZ2V0KHRoYXQuZm9yKGF1dGgudXNlciwgYXV0aC5wYXNzd29yZCwgJ191c2Vycy9vcmcuY291Y2hkYi51c2VyOicgKyBhdXRoLnVzZXIpKS50aGVuKGZ1bmN0aW9uIChkb2M6IEkuSVVzZXJEQikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShkb2MpXG4gICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIuc3RhdHVzQ29kZSAhPT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkVSUk9SISEhIFwiICsgZXJyKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVyci5zdGF0dXNDb2RlICE9PSA0MDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFUlJPUiEhISBcIiArIGVycilcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCFhdXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdCgnbm8gb3B0aW9ucyBwcm92aWRlZCcpXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghYXV0aC51c2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdCgnbm8gdXNlcm5hbWUgcHJvdmlkZWQnKVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWF1dGgucGFzc3dvcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KCdubyBwYXNzd29yZCBwcm92aWRlZCcpXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KCd1bmRlZmluZWQgZXJyb3InKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KVxuICAgIH1cblxuXG5cblxuICAgIGFkZEFwcFJvbGUoYXV0aDogSS5JQXV0aCwgdXNlcm5hbWU6IHN0cmluZywgYXBwX2lkOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXNcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPGJvb2xlYW4+KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblxuICAgICAgICAgICAgZ2V0dXNlcmRiKHRoYXQsIGF1dGgsIHVzZXJuYW1lKS50aGVuKCh1KSA9PiB7XG4gICAgICAgICAgICAgICAgdS5yb2xlcy5wdXNoKGFwcF9pZClcblxuICAgICAgICAgICAgICAgIHJwai5wdXQodGhhdC5teSgnX3VzZXJzL29yZy5jb3VjaGRiLnVzZXI6JyArIHVzZXJuYW1lKSwgdSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh1c2VybmFtZSA9PT0gYXV0aC51c2VyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRydWUpXG5cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJwai5nZXQodGhhdC5teShhcHBfaWQgKyAnL3VzZXJzJykpLnRoZW4oKGRvYzogSS5JVXNlcnNEb2MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb2MudXNlcnMucHVzaCh7IG5hbWU6IHVzZXJuYW1lLCByb2xlOiAndXNlcicsIGNyZWF0ZWRBdDogRGF0ZS5ub3coKSB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJwai5wdXQodGhhdC5teShhcHBfaWQgKyAnL3VzZXJzJyksIGRvYykudGhlbigoZG9jKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUodHJ1ZSlcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT09IDQwNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRvYzogSS5JVXNlcnNEb2MgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfaWQ6ICd1c2VycycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VyczogW3sgbmFtZTogdXNlcm5hbWUsIHJvbGU6ICd1c2VyJywgY3JlYXRlZEF0OiBEYXRlLm5vdygpIH1dLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlZEF0OiBEYXRlLm5vdygpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcnBqLnB1dCh0aGF0Lm15KGFwcF9pZCArICcvdXNlcnMnKSwgZG9jKS50aGVuKChkb2MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUodHJ1ZSlcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcblxuXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICB9KVxuXG4gICAgICAgIH0pXG5cbiAgICB9XG5cblxuXG4gICAgY3JlYXRlVXNlcihhZG1pbmF1dGg6IEkuSUF1dGgsIHVzZXI6IEkuSUF1dGgpOiBQcm9taXNlPEkuSVVzZXJEQj4ge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpc1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8SS5JVXNlckRCPihmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cbiAgICAgICAgICAgIGdldHVzZXJkYih0aGF0LCBhZG1pbmF1dGgsIHVzZXIudXNlcikudGhlbigodSkgPT4ge1xuICAgICAgICAgICAgICAgIHJlamVjdChcInVzZXIgXCIgKyB1c2VyLnVzZXIgKyBcIiBqdXN0IGVpeHN0c1wiKVxuXG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBkb2MgPSB7IG5hbWU6IHVzZXIudXNlciwgZGI6IFtdLCBcInJvbGVzXCI6IFsndXNlciddLCBcInR5cGVcIjogXCJ1c2VyXCIsIHBhc3N3b3JkOiB1c2VyLnBhc3N3b3JkIH1cblxuICAgICAgICAgICAgICAgIHJwai5wdXQodGhhdC5teSgnX3VzZXJzL29yZy5jb3VjaGRiLnVzZXI6JyArIHVzZXIudXNlciksIGRvYykudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGdldHVzZXJkYih0aGF0LCBhZG1pbmF1dGgsIHVzZXIudXNlcikudGhlbigodSkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHUpXG5cbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgfSlcblxuXG5cblxuICAgICAgICAgICAgfSlcblxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGNyZWF0ZUNsb3NlZEFwcChhZG1pbjogSS5JQXV0aCwgYXBwX2lkKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzXG5cbiAgICAgICAgLy8gY3JlYXRlIGFuIGFwcGxpY2F0aW9uIChpbXBlcmF0aXZlKVxuICAgICAgICAvLyByZXR1cm4gdHJ1ZSBvbmx5XG5cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8Ym9vbGVhbj4oZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgaWYgKGFkbWluICYmIHRoYXQuY2hlY2tBZG1pbihhZG1pbikpIHtcblxuXG4gICAgICAgICAgICAgICAgaWYgKGFwcF9pZCAhPT0gJ2FwcF9tYWluJykgYXBwX2lkID0gJ3ByaXZhdGVfJyArIGFwcF9pZFxuICAgICAgICAgICAgICAgIHJwai5wdXQodGhhdC5teShhcHBfaWQpKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcnBqLnB1dCh0aGF0Lm15KGFwcF9pZCArICcvX2Rlc2lnbi9hdXRoJyksIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibGFuZ3VhZ2VcIjogXCJqYXZhc2NyaXB0XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInZhbGlkYXRlX2RvY191cGRhdGVcIjogXCJmdW5jdGlvbihuLG8sdSl7aWYobi5faWQmJiFuLl9pZC5pbmRleE9mKFxcXCJfbG9jYWwvXFxcIikpcmV0dXJuO2lmKCF1fHwhdS5yb2xlc3x8KHUucm9sZXMuaW5kZXhPZihcXFwiXCIgKyBhcHBfaWQgKyBcIlxcXCIpPT0tMSYmdS5yb2xlcy5pbmRleE9mKFxcXCJfYWRtaW5cXFwiKT09LTEpKXt0aHJvdyh7Zm9yYmlkZGVuOidEZW5pZWQuJ30pfX1cIlxuICAgICAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUodHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVyci5zdGF0dXNDb2RlICE9PSA0MDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRVJST1IhISEgXCIgKyBlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT09IDQwNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkVSUk9SISEhIFwiICsgZXJyKVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcblxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KHsgZXJyb3I6ICd1bmF1dGhvcml6ZWQnIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxuICAgIGNyZWF0ZVNlcnZpY2VBcHAoYWRtaW46IEkuSUF1dGgsIGFwcF9pZCwgc2xhdmV1c2VyOiBJLklBdXRoKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzXG5cbiAgICAgICAgLy8gY3JlYXRlIGFuIGFwcGxpY2F0aW9uIChpbXBlcmF0aXZlKVxuICAgICAgICAvLyByZXR1cm4gdHJ1ZSBvbmx5XG5cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8Ym9vbGVhbj4oZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXG4gICAgICAgICAgICBpZiAoYWRtaW4gJiYgdGhhdC5jaGVja0FkbWluKGFkbWluKSAmJiBhcHBfaWQgJiYgc2xhdmV1c2VyICYmIHNsYXZldXNlci51c2VyICYmIHNsYXZldXNlci5wYXNzd29yZCkge1xuXG4gICAgICAgICAgICAgICAgYXBwX2lkID0gJ3NlcnZpY2VfJyArIGFwcF9pZFxuICAgICAgICAgICAgICAgIHJwai5wdXQodGhhdC5teShhcHBfaWQpKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcnBqLnB1dCh0aGF0Lm15KGFwcF9pZCArICcvX2Rlc2lnbi9hdXRoJyksIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibGFuZ3VhZ2VcIjogXCJqYXZhc2NyaXB0XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInZhbGlkYXRlX2RvY191cGRhdGVcIjogXCJmdW5jdGlvbihuLG8sdSl7aWYobi5faWQmJiFuLl9pZC5pbmRleE9mKFxcXCJfbG9jYWwvXFxcIikpcmV0dXJuO2lmKCF1fHwhdS5yb2xlc3x8KHUucm9sZXMuaW5kZXhPZihcXFwiXCIgKyBhcHBfaWQgKyBcIlxcXCIpPT0tMSYmdS5yb2xlcy5pbmRleE9mKFxcXCJfYWRtaW5cXFwiKT09LTEpKXt0aHJvdyh7Zm9yYmlkZGVuOidEZW5pZWQuJ30pfX1cIlxuICAgICAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuY3JlYXRlVXNlcihhZG1pbiwgc2xhdmV1c2VyKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmFkZEFwcFJvbGUoYWRtaW4sIHNsYXZldXNlci51c2VyLCBhcHBfaWQpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkZXZpY2VzZG9jOiBJLklEZXZpY2VzRG9jID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX2lkOiAnZGV2aWNlcycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXZpY2VzOiBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZWRBdDogRGF0ZS5ub3coKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJwai5wdXQodGhhdC5teShhcHBfaWQgKyAnL2RldmljZXMnKSwgZGV2aWNlc2RvYykudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBycGouZ2V0KHRoYXQubXkoJ2FwcF9tYWluJykgKyAnL3NlcnZpY2VzJykudGhlbigoc2VydmljZXNkb2M6IEkuSVNlcnZpY2VzRG9jKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXJ2aWNlc2RvYy5zZXJ2aWNlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGI6IGFwcF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlZEF0OiBEYXRlLm5vdygpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJwai5wdXQodGhhdC5teSgnYXBwX21haW4nKSArICcvc2VydmljZXMnLCBzZXJ2aWNlc2RvYykudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUodHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZWplY3QoeyBlcnJvcjogJ3dyb25nIHBhcmFtcyBmb3Igc2VydmljZSBhcHAgY3JlYXRpb24nIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgZ2V0U2VydmljZXMoYWRtaW46IEkuSUF1dGgpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXNcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8SS5JU2VydmljZVtdPihmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICBpZiAoYWRtaW4gJiYgdGhhdC5jaGVja0FkbWluKGFkbWluKSkge1xuXG4gICAgICAgICAgICAgICAgcnBqLmdldCh0aGF0Lm15KCdhcHBfbWFpbi9zZXJ2aWNlcycpKS50aGVuKChkb2M6IEkuSVNlcnZpY2VzRG9jKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZG9jLnNlcnZpY2VzKVxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlamVjdCh7IGVycm9yOiAndW5hdXRob3JpemVkJyB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cbiAgICBTZXR1cChhZG1pbiwgc2VydmljZXM6IEkuSVNlcnZpY2VTZXR1cFtdKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzXG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPGJvb2xlYW4+KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgIGlmIChhZG1pbiAmJiB0aGF0LmNoZWNrQWRtaW4oYWRtaW4pKSB7XG5cbiAgICAgICAgICAgICAgICBhc3luYy5lYWNoU2VyaWVzKHNlcnZpY2VzLCAoc2VydmljZSwgY2IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3RvZG8nKVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhzZXJ2aWNlKVxuICAgICAgICAgICAgICAgICAgICBjYigpXG4gICAgICAgICAgICAgICAgfSwgKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZWplY3QoeyBlcnJvcjogJ3VuYXV0aG9yaXplZCcgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG4gICAgY3JlYXRlUHViQXBwKGFkbWluOiBJLklBdXRoLCBhcHBfaWQpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXNcblxuICAgICAgICAvLyBjcmVhdGUgYW4gYXBwbGljYXRpb24gKGltcGVyYXRpdmUpXG4gICAgICAgIC8vIHJldHVybiB0cnVlIG9ubHlcblxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxib29sZWFuPihmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICBpZiAoYWRtaW4gJiYgdGhhdC5jaGVja0FkbWluKGFkbWluKSkge1xuXG4gICAgICAgICAgICAgICAgYXBwX2lkID0gJ3B1Yl8nICsgYXBwX2lkXG4gICAgICAgICAgICAgICAgcnBqLnB1dCh0aGF0Lm15KGFwcF9pZCkpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBycGoucHV0KHRoYXQubXkoYXBwX2lkICsgJy9fZGVzaWduL2F1dGgnKSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJsYW5ndWFnZVwiOiBcImphdmFzY3JpcHRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidmFsaWRhdGVfZG9jX3VwZGF0ZVwiOiBcImZ1bmN0aW9uKG4sIG8sIHUpIHsgaWYgKHUucm9sZXMubGVuZ3RoID09IDAgfHwgdS5yb2xlcy5pbmRleE9mKCdfYWRtaW4nKSA9PSAtMSkgeyB0aHJvdyh7IGZvcmJpZGRlbjogJ1lvdSBtdXN0IGJlIGFuIGFkbWluIGluIHRvIHNhdmUgZGF0YScgfSk7IH0gfVwiXG4gICAgICAgICAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKVxuICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT09IDQwNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkVSUk9SISEhIFwiICsgZXJyKVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZWplY3QoeyBlcnJvcjogJ3VuYXV0aG9yaXplZCcgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG5cblxufVxuXG5cbmNvbnN0IHJvdXRlciA9IGV4cHJlc3MuUm91dGVyKClcblxuZXhwb3J0IGZ1bmN0aW9uIGFjY2Vzc1JvdXRlcihyb290YWNjZXNzZGI6IEkuSUNsYXNzQ29uZikge1xuXG4gICAgY29uc3QgQ291Y2hBdXRoID0gbmV3IGNvdWNoQWNjZXNzKHJvb3RhY2Nlc3NkYilcblxuXG5cblxuICAgIHJvdXRlci5nZXQoJy8nLCAocmVxLCByZXMpID0+IHtcbiAgICAgICAgcmVzLnNlbmQoJ25lZWQgYWNjZXNzJyk7XG4gICAgfSlcblxuICAgIHJvdXRlci5wb3N0KCcvdGVzdGFkbWluJywgKHJlcSwgcmVzKSA9PiB7XG4gICAgICAgIGlmIChyZXEuYm9keSAmJiByZXEuYm9keS5hZG1pbiAmJiBDb3VjaEF1dGguY2hlY2tBZG1pbihyZXEuYm9keS5hZG1pbikpIHtcbiAgICAgICAgICAgIHJlcy5zZW5kKHsgb2s6IHRydWUgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXMuc2VuZCh7IGVycm9yOiAnd3JvbmcgYWRtaW4gY3JlZGVudGlhbHMnIH0pO1xuICAgICAgICB9XG5cbiAgICB9KVxuXG5cbiAgICByb3V0ZXIucG9zdCgnL3VzZXJzL2NyZWF0ZScsIChyZXEsIHJlcykgPT4ge1xuXG4gICAgICAgIGlmIChyZXEuYm9keSAmJiByZXEuYm9keS5hZG1pbiAmJiBDb3VjaEF1dGguY2hlY2tBZG1pbihyZXEuYm9keS5hZG1pbikpIHtcbiAgICAgICAgICAgIGlmIChyZXEuYm9keS5uZXd1c2VyICYmIHJlcS5ib2R5Lm5ld3VzZXIudXNlciAmJiByZXEuYm9keS5uZXd1c2VyLnBhc3N3b3JkKSB7XG4gICAgICAgICAgICAgICAgQ291Y2hBdXRoLmNyZWF0ZVVzZXIocmVxLmJvZHkuYWRtaW4sIHJlcS5ib2R5Lm5ld3VzZXIpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXMuc2VuZCh7IG9rOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzLnNlbmQoeyBlcnJvcjogZXJyIH0pO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlcy5zZW5kKHsgZXJyb3I6ICd3cm9uZyB1c2VyIGNyZWRlbnRpYWxzJyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlcy5zZW5kKHsgZXJyb3I6ICd3cm9uZyBhZG1pbiBjcmVkZW50aWFscycgfSk7XG4gICAgICAgIH1cblxuICAgIH0pXG5cblxuICAgIHJvdXRlci5wb3N0KCcvdXNlcnMvOnVzZXIvbG9naW4nLCAocmVxLCByZXMpID0+IHtcblxuICAgICAgICBpZiAocmVxLmJvZHkgJiYgcmVxLmJvZHkucGFzc3dvcmQpIHtcbiAgICAgICAgICAgIENvdWNoQXV0aC5sb2dpbih7IHVzZXI6IHJlcS5wYXJhbXMudXNlciwgcGFzc3dvcmQ6IHJlcS5ib2R5LnBhc3N3b3JkIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlcy5zZW5kKHsgb2s6IHRydWUgfSk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzLnNlbmQoeyBlcnJvcjogZXJyIH0pO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlcy5zZW5kKHsgZXJyb3I6ICd3cm9uZyBhZG1pbiBjcmVkZW50aWFscycgfSk7XG4gICAgICAgIH1cblxuXG4gICAgfSlcblxuXG5cbiAgICByb3V0ZXIucG9zdCgnL3NlcnZpY2VzL2NyZWF0ZScsIChyZXEsIHJlcykgPT4ge1xuICAgICAgICBpZiAocmVxLmJvZHkgJiYgcmVxLmJvZHkuYWRtaW4gJiYgQ291Y2hBdXRoLmNoZWNrQWRtaW4ocmVxLmJvZHkuYWRtaW4pKSB7XG4gICAgICAgICAgICBpZiAocmVxLmJvZHkubmV3dXNlciAmJiByZXEuYm9keS5uZXd1c2VyLnVzZXIgJiYgcmVxLmJvZHkubmV3dXNlci5wYXNzd29yZCkge1xuICAgICAgICAgICAgICAgIGlmIChyZXEuYm9keS5hcHBfaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgQ291Y2hBdXRoLmNyZWF0ZVNlcnZpY2VBcHAocmVxLmJvZHkuYWRtaW4sIHJlcS5ib2R5LmFwcF9pZCwgcmVxLmJvZHkubmV3dXNlcikudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXMuc2VuZCh7IG9rOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXMuc2VuZCh7IGVycm9yOiBlcnIgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzLnNlbmQoeyBlcnJvcjogJ3dyb25nIGFwcF9pZCcgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXMuc2VuZCh7IGVycm9yOiAnd3JvbmcgdXNlciBjcmVkZW50aWFscycgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXMuc2VuZCh7IGVycm9yOiAnd3JvbmcgYWRtaW4gY3JlZGVudGlhbHMnIH0pO1xuICAgICAgICB9XG5cbiAgICB9KVxuXG5cbiAgICByZXR1cm4gcm91dGVyXG5cbn1cblxuIl19
