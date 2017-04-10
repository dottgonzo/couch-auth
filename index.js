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
                            throw new Error(err);
                        });
                    });
                }).catch(function (err) {
                    throw new Error(err);
                });
            }).catch(function (err) {
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUM7d0JBQy9FLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztvQkFDM0IsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQUMsR0FBRzt3QkFDVCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7b0JBQzdCLENBQUMsQ0FBQyxDQUFBO2dCQUNOLENBQUM7Z0JBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ0osR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxjQUFjLEVBQUUsQ0FBQyxDQUFDO2dCQUN4QyxDQUFDO1lBQ0wsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNKLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsd0JBQXdCLEVBQUUsQ0FBQyxDQUFDO1lBQ2xELENBQUM7UUFDTCxDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDSixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLHlCQUF5QixFQUFFLENBQUMsQ0FBQztRQUNuRCxDQUFDO0lBRUwsQ0FBQyxDQUFDLENBQUE7SUFHRixNQUFNLENBQUMsTUFBTSxDQUFBO0FBRWpCLENBQUM7QUFqRkQsb0NBaUZDIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUHJvbWlzZSBmcm9tIFwiYmx1ZWJpcmRcIlxuaW1wb3J0ICogYXMgXyBmcm9tIFwibG9kYXNoXCJcbmltcG9ydCAqIGFzIGFzeW5jIGZyb20gXCJhc3luY1wiXG5cbmltcG9ydCBjb3VjaEpzb25Db25mIGZyb20gXCJjb3VjaGpzb25jb25mXCJcblxuaW1wb3J0ICogYXMgZXhwcmVzcyBmcm9tIFwiZXhwcmVzc1wiXG5cblxuaW1wb3J0ICogYXMgSSBmcm9tIFwiLi9pbnRlcmZhY2VcIlxuXG5jb25zdCB1aWQgPSByZXF1aXJlKFwidWlkXCIpXG5jb25zdCBycGogPSByZXF1aXJlKFwicmVxdWVzdC1wcm9taXNlLWpzb25cIilcblxuXG5cblxuXG5mdW5jdGlvbiBnZXR1c2VyZGIoaW50ZXJuYWxfY291Y2hkYiwgYWRtaW5BdXRoOiBJLklBdXRoLCB1c2VybmFtZTogc3RyaW5nKTogUHJvbWlzZTxJLklVc2VyREI+IHtcblxuICAgIC8vIHJldHVybiBhbGwgdGhlIHVzZXIgZG9jIGluIF91c2Vyc1xuXG5cbiAgICByZXR1cm4gbmV3IFByb21pc2U8SS5JVXNlckRCPihmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGlmIChhZG1pbkF1dGggJiYgaW50ZXJuYWxfY291Y2hkYi5jaGVja0FkbWluKGFkbWluQXV0aCkpIHtcblxuICAgICAgICAgICAgcnBqLmdldChpbnRlcm5hbF9jb3VjaGRiLm15KCdfdXNlcnMvb3JnLmNvdWNoZGIudXNlcjonICsgdXNlcm5hbWUpKS50aGVuKGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKGRvYylcbiAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT09IDQwNCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRVJST1IhISEgXCIgKyBlcnIpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVqZWN0KHsgZXJyb3I6ICd1bmF1dGhvcml6ZWQnIH0pXG4gICAgICAgIH1cbiAgICB9KVxufVxuXG5cblxuZXhwb3J0IGNsYXNzIGNvdWNoQWNjZXNzIGV4dGVuZHMgY291Y2hKc29uQ29uZiB7XG5cbiAgICBjb25zdHJ1Y3Rvcihyb290YWNjZXNzZGI6IEkuSUNsYXNzQ29uZikge1xuICAgICAgICBzdXBlcihyb290YWNjZXNzZGIpXG5cbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXNcblxuXG5cbiAgICAgICAgZnVuY3Rpb24gYWRkQWRtaW5Sb2xlKCkge1xuICAgICAgICAgICAgdGhhdC5hZGRBcHBSb2xlKHsgdXNlcjogdGhhdC51c2VyLCBwYXNzd29yZDogdGhhdC5wYXNzd29yZCB9LCB0aGF0LnVzZXIsICdhcHBfbWFpbicpXG4gICAgICAgIH1cblxuICAgICAgICBycGouZ2V0KHRoYXQubXkoJ2FwcF9tYWluJykpLnRoZW4oZnVuY3Rpb24gKCkge1xuXG5cbiAgICAgICAgICAgIGdldHVzZXJkYih0aGF0LCB7IHVzZXI6IHRoYXQudXNlciwgcGFzc3dvcmQ6IHRoYXQucGFzc3dvcmQgfSwgdGhhdC51c2VyKS50aGVuKCh1KSA9PiB7XG5cbiAgICAgICAgICAgICAgICBpZiAodS5yb2xlcy5pbmRleE9mKCdhcHBfbWFpbicpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBhZGRBZG1pblJvbGUoKVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgIHRoYXQuY3JlYXRlVXNlcih7IHVzZXI6IHRoYXQudXNlciwgcGFzc3dvcmQ6IHRoYXQucGFzc3dvcmQgfSwgeyB1c2VyOiB0aGF0LnVzZXIsIHBhc3N3b3JkOiB0aGF0LnBhc3N3b3JkIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBhZGRBZG1pblJvbGUoKVxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycilcbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICB9KVxuXG5cbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuXG4gICAgICAgICAgICB0aGF0LmNyZWF0ZUNsb3NlZEFwcCh7IHVzZXI6IHRoYXQudXNlciwgcGFzc3dvcmQ6IHRoYXQucGFzc3dvcmQgfSwgJ2FwcF9tYWluJykudGhlbigoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBzZXJ2aWNlczogSS5JU2VydmljZXNEb2MgPSB7XG4gICAgICAgICAgICAgICAgICAgIF9pZDogJ3NlcnZpY2VzJyxcbiAgICAgICAgICAgICAgICAgICAgc2VydmljZXM6IFtdXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJwai5wdXQodGhhdC5teSgnYXBwX21haW4nKSArICcvc2VydmljZXMnLCBzZXJ2aWNlcykudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGdldHVzZXJkYih0aGF0LCB7IHVzZXI6IHRoYXQudXNlciwgcGFzc3dvcmQ6IHRoYXQucGFzc3dvcmQgfSwgdGhhdC51c2VyKS50aGVuKCh1KSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1LnJvbGVzLmluZGV4T2YoJ2FwcF9tYWluJykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkQWRtaW5Sb2xlKClcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuY3JlYXRlVXNlcih7IHVzZXI6IHRoYXQudXNlciwgcGFzc3dvcmQ6IHRoYXQucGFzc3dvcmQgfSwgeyB1c2VyOiB0aGF0LnVzZXIsIHBhc3N3b3JkOiB0aGF0LnBhc3N3b3JkIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZEFkbWluUm9sZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycilcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnIpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBjaGVja0FkbWluKGFkbWluQXV0aDogSS5JQXV0aCkge1xuICAgICAgICBpZiAoYWRtaW5BdXRoICYmIGFkbWluQXV0aC51c2VyICYmIGFkbWluQXV0aC5wYXNzd29yZCAmJiBhZG1pbkF1dGgudXNlciA9PT0gdGhpcy51c2VyICYmIGFkbWluQXV0aC5wYXNzd29yZCA9PT0gdGhpcy5wYXNzd29yZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgbG9naW4oYXV0aDogSS5JQXV0aCkge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpc1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxJLklVc2VyREI+KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblxuICAgICAgICAgICAgaWYgKGF1dGggJiYgYXV0aC51c2VyICYmIGF1dGgucGFzc3dvcmQpIHtcbiAgICAgICAgICAgICAgICBycGouZ2V0KHRoYXQubXkoJ191c2Vycy9vcmcuY291Y2hkYi51c2VyOicgKyBhdXRoLnVzZXIpKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcnBqLmdldCh0aGF0LmZvcihhdXRoLnVzZXIsIGF1dGgucGFzc3dvcmQsICdfdXNlcnMvb3JnLmNvdWNoZGIudXNlcjonICsgYXV0aC51c2VyKSkudGhlbihmdW5jdGlvbiAoZG9jOiBJLklVc2VyREIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZG9jKVxuICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT09IDQwNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFUlJPUiEhISBcIiArIGVycilcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIuc3RhdHVzQ29kZSAhPT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRVJST1IhISEgXCIgKyBlcnIpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICghYXV0aCkge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoJ25vIG9wdGlvbnMgcHJvdmlkZWQnKVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWF1dGgudXNlcikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoJ25vIHVzZXJuYW1lIHByb3ZpZGVkJylcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFhdXRoLnBhc3N3b3JkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdCgnbm8gcGFzc3dvcmQgcHJvdmlkZWQnKVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdCgndW5kZWZpbmVkIGVycm9yJylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSlcbiAgICB9XG5cblxuXG5cbiAgICBhZGRBcHBSb2xlKGF1dGg6IEkuSUF1dGgsIHVzZXJuYW1lOiBzdHJpbmcsIGFwcF9pZDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxib29sZWFuPihmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cbiAgICAgICAgICAgIGdldHVzZXJkYih0aGF0LCBhdXRoLCB1c2VybmFtZSkudGhlbigodSkgPT4ge1xuICAgICAgICAgICAgICAgIHUucm9sZXMucHVzaChhcHBfaWQpXG5cbiAgICAgICAgICAgICAgICBycGoucHV0KHRoYXQubXkoJ191c2Vycy9vcmcuY291Y2hkYi51c2VyOicgKyB1c2VybmFtZSksIHUpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAodXNlcm5hbWUgPT09IGF1dGgudXNlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKVxuXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBycGouZ2V0KHRoYXQubXkoYXBwX2lkICsgJy91c2VycycpKS50aGVuKChkb2M6IEkuSVVzZXJzRG9jKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9jLnVzZXJzLnB1c2goeyBuYW1lOiB1c2VybmFtZSwgcm9sZTogJ3VzZXInLCBjcmVhdGVkQXQ6IERhdGUubm93KCkgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBycGoucHV0KHRoYXQubXkoYXBwX2lkICsgJy91c2VycycpLCBkb2MpLnRoZW4oKGRvYykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRydWUpXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVyci5zdGF0dXNDb2RlICE9PSA0MDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkb2M6IEkuSVVzZXJzRG9jID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX2lkOiAndXNlcnMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlcnM6IFt7IG5hbWU6IHVzZXJuYW1lLCByb2xlOiAndXNlcicsIGNyZWF0ZWRBdDogRGF0ZS5ub3coKSB9XSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZWRBdDogRGF0ZS5ub3coKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJwai5wdXQodGhhdC5teShhcHBfaWQgKyAnL3VzZXJzJyksIGRvYykudGhlbigoZG9jKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRydWUpXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG5cblxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgfSlcblxuICAgICAgICB9KVxuXG4gICAgfVxuXG5cblxuICAgIGNyZWF0ZVVzZXIoYWRtaW5hdXRoOiBJLklBdXRoLCB1c2VyOiBJLklBdXRoKTogUHJvbWlzZTxJLklVc2VyREI+IHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXNcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPEkuSVVzZXJEQj4oZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXG4gICAgICAgICAgICBnZXR1c2VyZGIodGhhdCwgYWRtaW5hdXRoLCB1c2VyLnVzZXIpLnRoZW4oKHUpID0+IHtcbiAgICAgICAgICAgICAgICByZWplY3QoXCJ1c2VyIFwiICsgdXNlci51c2VyICsgXCIganVzdCBlaXhzdHNcIilcblxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuXG4gICAgICAgICAgICAgICAgY29uc3QgZG9jID0geyBuYW1lOiB1c2VyLnVzZXIsIGRiOiBbXSwgXCJyb2xlc1wiOiBbJ3VzZXInXSwgXCJ0eXBlXCI6IFwidXNlclwiLCBwYXNzd29yZDogdXNlci5wYXNzd29yZCB9XG5cbiAgICAgICAgICAgICAgICBycGoucHV0KHRoYXQubXkoJ191c2Vycy9vcmcuY291Y2hkYi51c2VyOicgKyB1c2VyLnVzZXIpLCBkb2MpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBnZXR1c2VyZGIodGhhdCwgYWRtaW5hdXRoLCB1c2VyLnVzZXIpLnRoZW4oKHUpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh1KVxuXG4gICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgIH0pXG5cblxuXG5cbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBjcmVhdGVDbG9zZWRBcHAoYWRtaW46IEkuSUF1dGgsIGFwcF9pZCkge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpc1xuXG4gICAgICAgIC8vIGNyZWF0ZSBhbiBhcHBsaWNhdGlvbiAoaW1wZXJhdGl2ZSlcbiAgICAgICAgLy8gcmV0dXJuIHRydWUgb25seVxuXG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPGJvb2xlYW4+KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgIGlmIChhZG1pbiAmJiB0aGF0LmNoZWNrQWRtaW4oYWRtaW4pKSB7XG5cblxuICAgICAgICAgICAgICAgIGlmIChhcHBfaWQgIT09ICdhcHBfbWFpbicpIGFwcF9pZCA9ICdwcml2YXRlXycgKyBhcHBfaWRcbiAgICAgICAgICAgICAgICBycGoucHV0KHRoYXQubXkoYXBwX2lkKSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJwai5wdXQodGhhdC5teShhcHBfaWQgKyAnL19kZXNpZ24vYXV0aCcpLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcImxhbmd1YWdlXCI6IFwiamF2YXNjcmlwdFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ2YWxpZGF0ZV9kb2NfdXBkYXRlXCI6IFwiZnVuY3Rpb24obixvLHUpe2lmKG4uX2lkJiYhbi5faWQuaW5kZXhPZihcXFwiX2xvY2FsL1xcXCIpKXJldHVybjtpZighdXx8IXUucm9sZXN8fCh1LnJvbGVzLmluZGV4T2YoXFxcIlwiICsgYXBwX2lkICsgXCJcXFwiKT09LTEmJnUucm9sZXMuaW5kZXhPZihcXFwiX2FkbWluXFxcIik9PS0xKSl7dGhyb3coe2ZvcmJpZGRlbjonRGVuaWVkLid9KX19XCJcbiAgICAgICAgICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRydWUpXG4gICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIuc3RhdHVzQ29kZSAhPT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkVSUk9SISEhIFwiICsgZXJyKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVyci5zdGF0dXNDb2RlICE9PSA0MDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFUlJPUiEhISBcIiArIGVycilcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlamVjdCh7IGVycm9yOiAndW5hdXRob3JpemVkJyB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cbiAgICBjcmVhdGVTZXJ2aWNlQXBwKGFkbWluOiBJLklBdXRoLCBhcHBfaWQsIHNsYXZldXNlcjogSS5JQXV0aCkge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpc1xuXG4gICAgICAgIC8vIGNyZWF0ZSBhbiBhcHBsaWNhdGlvbiAoaW1wZXJhdGl2ZSlcbiAgICAgICAgLy8gcmV0dXJuIHRydWUgb25seVxuXG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPGJvb2xlYW4+KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblxuICAgICAgICAgICAgaWYgKGFkbWluICYmIHRoYXQuY2hlY2tBZG1pbihhZG1pbikgJiYgYXBwX2lkICYmIHNsYXZldXNlciAmJiBzbGF2ZXVzZXIudXNlciAmJiBzbGF2ZXVzZXIucGFzc3dvcmQpIHtcblxuICAgICAgICAgICAgICAgIGFwcF9pZCA9ICdzZXJ2aWNlXycgKyBhcHBfaWRcbiAgICAgICAgICAgICAgICBycGoucHV0KHRoYXQubXkoYXBwX2lkKSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJwai5wdXQodGhhdC5teShhcHBfaWQgKyAnL19kZXNpZ24vYXV0aCcpLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcImxhbmd1YWdlXCI6IFwiamF2YXNjcmlwdFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ2YWxpZGF0ZV9kb2NfdXBkYXRlXCI6IFwiZnVuY3Rpb24obixvLHUpe2lmKG4uX2lkJiYhbi5faWQuaW5kZXhPZihcXFwiX2xvY2FsL1xcXCIpKXJldHVybjtpZighdXx8IXUucm9sZXN8fCh1LnJvbGVzLmluZGV4T2YoXFxcIlwiICsgYXBwX2lkICsgXCJcXFwiKT09LTEmJnUucm9sZXMuaW5kZXhPZihcXFwiX2FkbWluXFxcIik9PS0xKSl7dGhyb3coe2ZvcmJpZGRlbjonRGVuaWVkLid9KX19XCJcbiAgICAgICAgICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmNyZWF0ZVVzZXIoYWRtaW4sIHNsYXZldXNlcikudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5hZGRBcHBSb2xlKGFkbWluLCBzbGF2ZXVzZXIudXNlciwgYXBwX2lkKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGV2aWNlc2RvYzogSS5JRGV2aWNlc0RvYyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9pZDogJ2RldmljZXMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGV2aWNlczogW10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVkQXQ6IERhdGUubm93KClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBycGoucHV0KHRoYXQubXkoYXBwX2lkICsgJy9kZXZpY2VzJyksIGRldmljZXNkb2MpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcnBqLmdldCh0aGF0Lm15KCdhcHBfbWFpbicpICsgJy9zZXJ2aWNlcycpLnRoZW4oKHNlcnZpY2VzZG9jOiBJLklTZXJ2aWNlc0RvYykgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VydmljZXNkb2Muc2VydmljZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRiOiBhcHBfaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZWRBdDogRGF0ZS5ub3coKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBycGoucHV0KHRoYXQubXkoJ2FwcF9tYWluJykgKyAnL3NlcnZpY2VzJywgc2VydmljZXNkb2MpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRydWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KHsgZXJyb3I6ICd3cm9uZyBwYXJhbXMgZm9yIHNlcnZpY2UgYXBwIGNyZWF0aW9uJyB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGdldFNlcnZpY2VzKGFkbWluOiBJLklBdXRoKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzXG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPEkuSVNlcnZpY2VbXT4oZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgaWYgKGFkbWluICYmIHRoYXQuY2hlY2tBZG1pbihhZG1pbikpIHtcblxuICAgICAgICAgICAgICAgIHJwai5nZXQodGhhdC5teSgnYXBwX21haW4vc2VydmljZXMnKSkudGhlbigoZG9jOiBJLklTZXJ2aWNlc0RvYykgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGRvYy5zZXJ2aWNlcylcbiAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZWplY3QoeyBlcnJvcjogJ3VuYXV0aG9yaXplZCcgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG4gICAgU2V0dXAoYWRtaW4sIHNlcnZpY2VzOiBJLklTZXJ2aWNlU2V0dXBbXSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpc1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxib29sZWFuPihmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICBpZiAoYWRtaW4gJiYgdGhhdC5jaGVja0FkbWluKGFkbWluKSkge1xuXG4gICAgICAgICAgICAgICAgYXN5bmMuZWFjaFNlcmllcyhzZXJ2aWNlcywgKHNlcnZpY2UsIGNiKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCd0b2RvJylcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coc2VydmljZSlcbiAgICAgICAgICAgICAgICAgICAgY2IoKVxuICAgICAgICAgICAgICAgIH0sIChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUodHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KHsgZXJyb3I6ICd1bmF1dGhvcml6ZWQnIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxuICAgIGNyZWF0ZVB1YkFwcChhZG1pbjogSS5JQXV0aCwgYXBwX2lkKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzXG5cbiAgICAgICAgLy8gY3JlYXRlIGFuIGFwcGxpY2F0aW9uIChpbXBlcmF0aXZlKVxuICAgICAgICAvLyByZXR1cm4gdHJ1ZSBvbmx5XG5cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8Ym9vbGVhbj4oZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgaWYgKGFkbWluICYmIHRoYXQuY2hlY2tBZG1pbihhZG1pbikpIHtcblxuICAgICAgICAgICAgICAgIGFwcF9pZCA9ICdwdWJfJyArIGFwcF9pZFxuICAgICAgICAgICAgICAgIHJwai5wdXQodGhhdC5teShhcHBfaWQpKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcnBqLnB1dCh0aGF0Lm15KGFwcF9pZCArICcvX2Rlc2lnbi9hdXRoJyksIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibGFuZ3VhZ2VcIjogXCJqYXZhc2NyaXB0XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInZhbGlkYXRlX2RvY191cGRhdGVcIjogXCJmdW5jdGlvbihuLCBvLCB1KSB7IGlmICh1LnJvbGVzLmxlbmd0aCA9PSAwIHx8IHUucm9sZXMuaW5kZXhPZignX2FkbWluJykgPT0gLTEpIHsgdGhyb3coeyBmb3JiaWRkZW46ICdZb3UgbXVzdCBiZSBhbiBhZG1pbiBpbiB0byBzYXZlIGRhdGEnIH0pOyB9IH1cIlxuICAgICAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUodHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcblxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVyci5zdGF0dXNDb2RlICE9PSA0MDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFUlJPUiEhISBcIiArIGVycilcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KHsgZXJyb3I6ICd1bmF1dGhvcml6ZWQnIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxuXG5cbn1cblxuXG5jb25zdCByb3V0ZXIgPSBleHByZXNzLlJvdXRlcigpXG5cbmV4cG9ydCBmdW5jdGlvbiBhY2Nlc3NSb3V0ZXIocm9vdGFjY2Vzc2RiOiBJLklDbGFzc0NvbmYpIHtcblxuICAgIGNvbnN0IENvdWNoQXV0aCA9IG5ldyBjb3VjaEFjY2Vzcyhyb290YWNjZXNzZGIpXG5cblxuXG5cbiAgICByb3V0ZXIuZ2V0KCcvJywgKHJlcSwgcmVzKSA9PiB7XG4gICAgICAgIHJlcy5zZW5kKCduZWVkIGFjY2VzcycpO1xuICAgIH0pXG5cbiAgICByb3V0ZXIucG9zdCgnL3Rlc3RhZG1pbicsIChyZXEsIHJlcykgPT4ge1xuICAgICAgICBpZiAocmVxLmJvZHkgJiYgcmVxLmJvZHkuYWRtaW4gJiYgQ291Y2hBdXRoLmNoZWNrQWRtaW4ocmVxLmJvZHkuYWRtaW4pKSB7XG4gICAgICAgICAgICByZXMuc2VuZCh7IG9rOiB0cnVlIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzLnNlbmQoeyBlcnJvcjogJ3dyb25nIGFkbWluIGNyZWRlbnRpYWxzJyB9KTtcbiAgICAgICAgfVxuXG4gICAgfSlcblxuXG4gICAgcm91dGVyLnBvc3QoJy91c2Vycy9jcmVhdGUnLCAocmVxLCByZXMpID0+IHtcblxuICAgICAgICBpZiAocmVxLmJvZHkgJiYgcmVxLmJvZHkuYWRtaW4gJiYgQ291Y2hBdXRoLmNoZWNrQWRtaW4ocmVxLmJvZHkuYWRtaW4pKSB7XG4gICAgICAgICAgICBpZiAocmVxLmJvZHkubmV3dXNlciAmJiByZXEuYm9keS5uZXd1c2VyLnVzZXIgJiYgcmVxLmJvZHkubmV3dXNlci5wYXNzd29yZCkge1xuICAgICAgICAgICAgICAgIENvdWNoQXV0aC5jcmVhdGVVc2VyKHJlcS5ib2R5LmFkbWluLCByZXEuYm9keS5uZXd1c2VyKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzLnNlbmQoeyBvazogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5zZW5kKHsgZXJyb3I6IGVyciB9KTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXMuc2VuZCh7IGVycm9yOiAnd3JvbmcgdXNlciBjcmVkZW50aWFscycgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXMuc2VuZCh7IGVycm9yOiAnd3JvbmcgYWRtaW4gY3JlZGVudGlhbHMnIH0pO1xuICAgICAgICB9XG5cbiAgICB9KVxuXG5cbiAgICByb3V0ZXIucG9zdCgnL3VzZXJzLzp1c2VyL2xvZ2luJywgKHJlcSwgcmVzKSA9PiB7XG5cbiAgICAgICAgaWYgKHJlcS5ib2R5ICYmIHJlcS5ib2R5LnBhc3N3b3JkKSB7XG4gICAgICAgICAgICBDb3VjaEF1dGgubG9naW4oeyB1c2VyOiByZXEucGFyYW1zLnVzZXIsIHBhc3N3b3JkOiByZXEuYm9keS5wYXNzd29yZCB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICByZXMuc2VuZCh7IG9rOiB0cnVlIH0pO1xuICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgIHJlcy5zZW5kKHsgZXJyb3I6IGVyciB9KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXMuc2VuZCh7IGVycm9yOiAnd3JvbmcgYWRtaW4gY3JlZGVudGlhbHMnIH0pO1xuICAgICAgICB9XG5cblxuICAgIH0pXG5cblxuXG4gICAgcm91dGVyLnBvc3QoJy9zZXJ2aWNlcy9jcmVhdGUnLCAocmVxLCByZXMpID0+IHtcbiAgICAgICAgaWYgKHJlcS5ib2R5ICYmIHJlcS5ib2R5LmFkbWluICYmIENvdWNoQXV0aC5jaGVja0FkbWluKHJlcS5ib2R5LmFkbWluKSkge1xuICAgICAgICAgICAgaWYgKHJlcS5ib2R5Lm5ld3VzZXIgJiYgcmVxLmJvZHkubmV3dXNlci51c2VyICYmIHJlcS5ib2R5Lm5ld3VzZXIucGFzc3dvcmQpIHtcbiAgICAgICAgICAgICAgICBpZiAocmVxLmJvZHkuYXBwX2lkKSB7XG4gICAgICAgICAgICAgICAgICAgIENvdWNoQXV0aC5jcmVhdGVTZXJ2aWNlQXBwKHJlcS5ib2R5LmFkbWluLCByZXEuYm9keS5hcHBfaWQsIHJlcS5ib2R5Lm5ld3VzZXIpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzLnNlbmQoeyBvazogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzLnNlbmQoeyBlcnJvcjogZXJyIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5zZW5kKHsgZXJyb3I6ICd3cm9uZyBhcHBfaWQnIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzLnNlbmQoeyBlcnJvcjogJ3dyb25nIHVzZXIgY3JlZGVudGlhbHMnIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzLnNlbmQoeyBlcnJvcjogJ3dyb25nIGFkbWluIGNyZWRlbnRpYWxzJyB9KTtcbiAgICAgICAgfVxuXG4gICAgfSlcblxuXG4gICAgcmV0dXJuIHJvdXRlclxuXG59XG5cbiJdfQ==
