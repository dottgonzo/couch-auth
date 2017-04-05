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
var couchjsonconf_1 = require("couchjsonconf");
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
                                rpj.put(that.my(app_id + '/users'), devicesdoc).then(function () {
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
exports.default = couchAccess;

//# sourceMappingURL=data:application/json;charset=utf8;base64,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d0JBQ2xCLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTtvQkFFZixDQUFDLENBQUMsQ0FBQTtnQkFDTixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHO29CQUNsQixFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7d0JBQ3pCLE9BQU8sQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLEdBQUcsQ0FBQyxDQUFBO29CQUNwQyxDQUFDO29CQUVELE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTtnQkFDZixDQUFDLENBQUMsQ0FBQTtZQUNOLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDSixNQUFNLENBQUMsRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQTtZQUNyQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUE7SUFDTixDQUFDO0lBTUwsa0JBQUM7QUFBRCxDQTVXQSxBQTRXQyxDQTVXeUIsdUJBQWEsR0E0V3RDO0FBS0Qsa0JBQWUsV0FBVyxDQUFBIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUHJvbWlzZSBmcm9tIFwiYmx1ZWJpcmRcIlxuaW1wb3J0ICogYXMgXyBmcm9tIFwibG9kYXNoXCJcblxuaW1wb3J0IGNvdWNoSnNvbkNvbmYgZnJvbSBcImNvdWNoanNvbmNvbmZcIlxuXG5pbXBvcnQgKiBhcyBJIGZyb20gXCIuL2ludGVyZmFjZVwiXG5cbmNvbnN0IHVpZCA9IHJlcXVpcmUoXCJ1aWRcIilcbmNvbnN0IHJwaiA9IHJlcXVpcmUoXCJyZXF1ZXN0LXByb21pc2UtanNvblwiKVxuXG5cblxuXG5mdW5jdGlvbiBnZXR1c2VyZGIoaW50ZXJuYWxfY291Y2hkYiwgYWRtaW5BdXRoOiBJLklBdXRoLCB1c2VybmFtZTogc3RyaW5nKTogUHJvbWlzZTxJLklVc2VyREI+IHtcblxuICAgIC8vIHJldHVybiBhbGwgdGhlIHVzZXIgZG9jIGluIF91c2Vyc1xuXG5cbiAgICByZXR1cm4gbmV3IFByb21pc2U8SS5JVXNlckRCPihmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGlmIChhZG1pbkF1dGggJiYgaW50ZXJuYWxfY291Y2hkYi5jaGVja0FkbWluKGFkbWluQXV0aCkpIHtcblxuICAgICAgICAgICAgcnBqLmdldChpbnRlcm5hbF9jb3VjaGRiLm15KCdfdXNlcnMvb3JnLmNvdWNoZGIudXNlcjonICsgdXNlcm5hbWUpKS50aGVuKGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKGRvYylcbiAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT09IDQwNCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRVJST1IhISEgXCIgKyBlcnIpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVqZWN0KHsgZXJyb3I6ICd1bmF1dGhvcml6ZWQnIH0pXG4gICAgICAgIH1cbiAgICB9KVxufVxuXG5cblxuY2xhc3MgY291Y2hBY2Nlc3MgZXh0ZW5kcyBjb3VjaEpzb25Db25mIHtcblxuICAgIGNvbnN0cnVjdG9yKHJvb3RhY2Nlc3NkYjogSS5JQ2xhc3NDb25mKSB7XG4gICAgICAgIHN1cGVyKHJvb3RhY2Nlc3NkYilcblxuICAgICAgICBjb25zdCB0aGF0ID0gdGhpc1xuXG5cblxuICAgICAgICBmdW5jdGlvbiBhZGRBZG1pblJvbGUoKSB7XG4gICAgICAgICAgICB0aGF0LmFkZEFwcFJvbGUoeyB1c2VyOiB0aGF0LnVzZXIsIHBhc3N3b3JkOiB0aGF0LnBhc3N3b3JkIH0sIHRoYXQudXNlciwgJ2FwcF9tYWluJylcbiAgICAgICAgfVxuXG4gICAgICAgIHJwai5nZXQodGhhdC5teSgnYXBwX21haW4nKSkudGhlbihmdW5jdGlvbiAoKSB7XG5cblxuICAgICAgICAgICAgZ2V0dXNlcmRiKHRoYXQsIHsgdXNlcjogdGhhdC51c2VyLCBwYXNzd29yZDogdGhhdC5wYXNzd29yZCB9LCB0aGF0LnVzZXIpLnRoZW4oKHUpID0+IHtcblxuICAgICAgICAgICAgICAgIGlmICh1LnJvbGVzLmluZGV4T2YoJ2FwcF9tYWluJykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZEFkbWluUm9sZSgpXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhhdC5jcmVhdGVVc2VyKHsgdXNlcjogdGhhdC51c2VyLCBwYXNzd29yZDogdGhhdC5wYXNzd29yZCB9LCB7IHVzZXI6IHRoYXQudXNlciwgcGFzc3dvcmQ6IHRoYXQucGFzc3dvcmQgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGFkZEFkbWluUm9sZSgpXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyKVxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIH0pXG5cblxuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG5cbiAgICAgICAgICAgIHRoYXQuY3JlYXRlQ2xvc2VkQXBwKHsgdXNlcjogdGhhdC51c2VyLCBwYXNzd29yZDogdGhhdC5wYXNzd29yZCB9LCAnYXBwX21haW4nKS50aGVuKCgpID0+IHtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHNlcnZpY2VzOiBJLklTZXJ2aWNlc0RvYyA9IHtcbiAgICAgICAgICAgICAgICAgICAgX2lkOiAnc2VydmljZXMnLFxuICAgICAgICAgICAgICAgICAgICBzZXJ2aWNlczogW11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcnBqLnB1dCh0aGF0Lm15KCdhcHBfbWFpbicpICsgJy9zZXJ2aWNlcycsIHNlcnZpY2VzKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZ2V0dXNlcmRiKHRoYXQsIHsgdXNlcjogdGhhdC51c2VyLCBwYXNzd29yZDogdGhhdC5wYXNzd29yZCB9LCB0aGF0LnVzZXIpLnRoZW4oKHUpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHUucm9sZXMuaW5kZXhPZignYXBwX21haW4nKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRBZG1pblJvbGUoKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5jcmVhdGVVc2VyKHsgdXNlcjogdGhhdC51c2VyLCBwYXNzd29yZDogdGhhdC5wYXNzd29yZCB9LCB7IHVzZXI6IHRoYXQudXNlciwgcGFzc3dvcmQ6IHRoYXQucGFzc3dvcmQgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkQWRtaW5Sb2xlKClcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycilcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnIpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGNoZWNrQWRtaW4oYWRtaW5BdXRoOiBJLklBdXRoKSB7XG4gICAgICAgIGlmIChhZG1pbkF1dGggJiYgYWRtaW5BdXRoLnVzZXIgJiYgYWRtaW5BdXRoLnBhc3N3b3JkICYmIGFkbWluQXV0aC51c2VyID09PSB0aGlzLnVzZXIgJiYgYWRtaW5BdXRoLnBhc3N3b3JkID09PSB0aGlzLnBhc3N3b3JkKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBsb2dpbihhdXRoOiBJLklBdXRoKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzXG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPEkuSVVzZXJEQj4oZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXG4gICAgICAgICAgICBpZiAoYXV0aCAmJiBhdXRoLnVzZXIgJiYgYXV0aC5wYXNzd29yZCkge1xuICAgICAgICAgICAgICAgIHJwai5nZXQodGhhdC5teSgnX3VzZXJzL29yZy5jb3VjaGRiLnVzZXI6JyArIGF1dGgudXNlcikpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBycGouZ2V0KHRoYXQuZm9yKGF1dGgudXNlciwgYXV0aC5wYXNzd29yZCwgJ191c2Vycy9vcmcuY291Y2hkYi51c2VyOicgKyBhdXRoLnVzZXIpKS50aGVuKGZ1bmN0aW9uIChkb2M6IEkuSVVzZXJEQikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShkb2MpXG4gICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIuc3RhdHVzQ29kZSAhPT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkVSUk9SISEhIFwiICsgZXJyKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVyci5zdGF0dXNDb2RlICE9PSA0MDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFUlJPUiEhISBcIiArIGVycilcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCFhdXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdCgnbm8gb3B0aW9ucyBwcm92aWRlZCcpXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghYXV0aC51c2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdCgnbm8gdXNlcm5hbWUgcHJvdmlkZWQnKVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWF1dGgucGFzc3dvcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KCdubyBwYXNzd29yZCBwcm92aWRlZCcpXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KCd1bmRlZmluZWQgZXJyb3InKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KVxuICAgIH1cblxuXG5cblxuICAgIGFkZEFwcFJvbGUoYXV0aDogSS5JQXV0aCwgdXNlcm5hbWU6IHN0cmluZywgYXBwX2lkOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXNcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPGJvb2xlYW4+KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblxuICAgICAgICAgICAgZ2V0dXNlcmRiKHRoYXQsIGF1dGgsIHVzZXJuYW1lKS50aGVuKCh1KSA9PiB7XG4gICAgICAgICAgICAgICAgdS5yb2xlcy5wdXNoKGFwcF9pZClcblxuICAgICAgICAgICAgICAgIHJwai5wdXQodGhhdC5teSgnX3VzZXJzL29yZy5jb3VjaGRiLnVzZXI6JyArIHVzZXJuYW1lKSwgdSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh1c2VybmFtZSA9PT0gYXV0aC51c2VyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRydWUpXG5cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJwai5nZXQodGhhdC5teShhcHBfaWQgKyAnL3VzZXJzJykpLnRoZW4oKGRvYzogSS5JVXNlcnNEb2MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb2MudXNlcnMucHVzaCh7IG5hbWU6IHVzZXJuYW1lLCByb2xlOiAndXNlcicsIGNyZWF0ZWRBdDogRGF0ZS5ub3coKSB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJwai5wdXQodGhhdC5teShhcHBfaWQgKyAnL3VzZXJzJyksIGRvYykudGhlbigoZG9jKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUodHJ1ZSlcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT09IDQwNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRvYzogSS5JVXNlcnNEb2MgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfaWQ6ICd1c2VycycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VyczogW3sgbmFtZTogdXNlcm5hbWUsIHJvbGU6ICd1c2VyJywgY3JlYXRlZEF0OiBEYXRlLm5vdygpIH1dLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlZEF0OiBEYXRlLm5vdygpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcnBqLnB1dCh0aGF0Lm15KGFwcF9pZCArICcvdXNlcnMnKSwgZG9jKS50aGVuKChkb2MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUodHJ1ZSlcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcblxuXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICB9KVxuXG4gICAgICAgIH0pXG5cbiAgICB9XG5cblxuXG4gICAgY3JlYXRlVXNlcihhZG1pbmF1dGg6IEkuSUF1dGgsIHVzZXI6IEkuSUF1dGgpOiBQcm9taXNlPEkuSVVzZXJEQj4ge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpc1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8SS5JVXNlckRCPihmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cbiAgICAgICAgICAgIGdldHVzZXJkYih0aGF0LCBhZG1pbmF1dGgsIHVzZXIudXNlcikudGhlbigodSkgPT4ge1xuICAgICAgICAgICAgICAgIHJlamVjdChcInVzZXIgXCIgKyB1c2VyLnVzZXIgKyBcIiBqdXN0IGVpeHN0c1wiKVxuXG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBkb2MgPSB7IG5hbWU6IHVzZXIudXNlciwgZGI6IFtdLCBcInJvbGVzXCI6IFsndXNlciddLCBcInR5cGVcIjogXCJ1c2VyXCIsIHBhc3N3b3JkOiB1c2VyLnBhc3N3b3JkIH1cblxuICAgICAgICAgICAgICAgIHJwai5wdXQodGhhdC5teSgnX3VzZXJzL29yZy5jb3VjaGRiLnVzZXI6JyArIHVzZXIudXNlciksIGRvYykudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGdldHVzZXJkYih0aGF0LCBhZG1pbmF1dGgsIHVzZXIudXNlcikudGhlbigodSkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHUpXG5cbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgfSlcblxuXG5cblxuICAgICAgICAgICAgfSlcblxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGNyZWF0ZUNsb3NlZEFwcChhZG1pbjogSS5JQXV0aCwgYXBwX2lkKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzXG5cbiAgICAgICAgLy8gY3JlYXRlIGFuIGFwcGxpY2F0aW9uIChpbXBlcmF0aXZlKVxuICAgICAgICAvLyByZXR1cm4gdHJ1ZSBvbmx5XG5cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8Ym9vbGVhbj4oZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgaWYgKGFkbWluICYmIHRoYXQuY2hlY2tBZG1pbihhZG1pbikpIHtcblxuXG4gICAgICAgICAgICAgICAgaWYgKGFwcF9pZCAhPT0gJ2FwcF9tYWluJykgYXBwX2lkID0gJ3ByaXZhdGVfJyArIGFwcF9pZFxuICAgICAgICAgICAgICAgIHJwai5wdXQodGhhdC5teShhcHBfaWQpKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcnBqLnB1dCh0aGF0Lm15KGFwcF9pZCArICcvX2Rlc2lnbi9hdXRoJyksIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibGFuZ3VhZ2VcIjogXCJqYXZhc2NyaXB0XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInZhbGlkYXRlX2RvY191cGRhdGVcIjogXCJmdW5jdGlvbihuLG8sdSl7aWYobi5faWQmJiFuLl9pZC5pbmRleE9mKFxcXCJfbG9jYWwvXFxcIikpcmV0dXJuO2lmKCF1fHwhdS5yb2xlc3x8KHUucm9sZXMuaW5kZXhPZihcXFwiXCIgKyBhcHBfaWQgKyBcIlxcXCIpPT0tMSYmdS5yb2xlcy5pbmRleE9mKFxcXCJfYWRtaW5cXFwiKT09LTEpKXt0aHJvdyh7Zm9yYmlkZGVuOidEZW5pZWQuJ30pfX1cIlxuICAgICAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUodHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVyci5zdGF0dXNDb2RlICE9PSA0MDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRVJST1IhISEgXCIgKyBlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT09IDQwNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkVSUk9SISEhIFwiICsgZXJyKVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcblxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KHsgZXJyb3I6ICd1bmF1dGhvcml6ZWQnIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxuICAgIGNyZWF0ZVNlcnZpY2VBcHAoYWRtaW46IEkuSUF1dGgsIGFwcF9pZCwgc2xhdmV1c2VyOiBJLklBdXRoKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzXG5cbiAgICAgICAgLy8gY3JlYXRlIGFuIGFwcGxpY2F0aW9uIChpbXBlcmF0aXZlKVxuICAgICAgICAvLyByZXR1cm4gdHJ1ZSBvbmx5XG5cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8Ym9vbGVhbj4oZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXG4gICAgICAgICAgICBpZiAoYWRtaW4gJiYgdGhhdC5jaGVja0FkbWluKGFkbWluKSAmJiBhcHBfaWQgJiYgc2xhdmV1c2VyICYmIHNsYXZldXNlci51c2VyICYmIHNsYXZldXNlci5wYXNzd29yZCkge1xuXG4gICAgICAgICAgICAgICAgYXBwX2lkID0gJ3NlcnZpY2VfJyArIGFwcF9pZFxuICAgICAgICAgICAgICAgIHJwai5wdXQodGhhdC5teShhcHBfaWQpKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcnBqLnB1dCh0aGF0Lm15KGFwcF9pZCArICcvX2Rlc2lnbi9hdXRoJyksIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibGFuZ3VhZ2VcIjogXCJqYXZhc2NyaXB0XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInZhbGlkYXRlX2RvY191cGRhdGVcIjogXCJmdW5jdGlvbihuLG8sdSl7aWYobi5faWQmJiFuLl9pZC5pbmRleE9mKFxcXCJfbG9jYWwvXFxcIikpcmV0dXJuO2lmKCF1fHwhdS5yb2xlc3x8KHUucm9sZXMuaW5kZXhPZihcXFwiXCIgKyBhcHBfaWQgKyBcIlxcXCIpPT0tMSYmdS5yb2xlcy5pbmRleE9mKFxcXCJfYWRtaW5cXFwiKT09LTEpKXt0aHJvdyh7Zm9yYmlkZGVuOidEZW5pZWQuJ30pfX1cIlxuICAgICAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuY3JlYXRlVXNlcihhZG1pbiwgc2xhdmV1c2VyKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmFkZEFwcFJvbGUoYWRtaW4sIHNsYXZldXNlci51c2VyLCBhcHBfaWQpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkZXZpY2VzZG9jOiBJLklEZXZpY2VzRG9jID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX2lkOiAnZGV2aWNlcycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXZpY2VzOiBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZWRBdDogRGF0ZS5ub3coKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJwai5wdXQodGhhdC5teShhcHBfaWQgKyAnL3VzZXJzJyksIGRldmljZXNkb2MpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcnBqLmdldCh0aGF0Lm15KCdhcHBfbWFpbicpICsgJy9zZXJ2aWNlcycpLnRoZW4oKHNlcnZpY2VzZG9jOiBJLklTZXJ2aWNlc0RvYykgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VydmljZXNkb2Muc2VydmljZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRiOiBhcHBfaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZWRBdDogRGF0ZS5ub3coKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBycGoucHV0KHRoYXQubXkoJ2FwcF9tYWluJykgKyAnL3NlcnZpY2VzJywgc2VydmljZXNkb2MpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRydWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KHsgZXJyb3I6ICd3cm9uZyBwYXJhbXMgZm9yIHNlcnZpY2UgYXBwIGNyZWF0aW9uJyB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGdldFNlcnZpY2VzKGFkbWluOiBJLklBdXRoKSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzXG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPEkuSVNlcnZpY2VbXT4oZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgaWYgKGFkbWluICYmIHRoYXQuY2hlY2tBZG1pbihhZG1pbikpIHtcblxuICAgICAgICAgICAgICAgICAgICBycGouZ2V0KHRoYXQubXkoJ2FwcF9tYWluL3NlcnZpY2VzJykpLnRoZW4oKGRvYzpJLklTZXJ2aWNlc0RvYykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShkb2Muc2VydmljZXMpXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KHsgZXJyb3I6ICd1bmF1dGhvcml6ZWQnIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgY3JlYXRlUHViQXBwKGFkbWluOiBJLklBdXRoLCBhcHBfaWQpIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXNcblxuICAgICAgICAvLyBjcmVhdGUgYW4gYXBwbGljYXRpb24gKGltcGVyYXRpdmUpXG4gICAgICAgIC8vIHJldHVybiB0cnVlIG9ubHlcblxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxib29sZWFuPihmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICBpZiAoYWRtaW4gJiYgdGhhdC5jaGVja0FkbWluKGFkbWluKSkge1xuXG4gICAgICAgICAgICAgICAgYXBwX2lkID0gJ3B1Yl8nICsgYXBwX2lkXG4gICAgICAgICAgICAgICAgcnBqLnB1dCh0aGF0Lm15KGFwcF9pZCkpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBycGoucHV0KHRoYXQubXkoYXBwX2lkICsgJy9fZGVzaWduL2F1dGgnKSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJsYW5ndWFnZVwiOiBcImphdmFzY3JpcHRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidmFsaWRhdGVfZG9jX3VwZGF0ZVwiOiBcImZ1bmN0aW9uKG4sIG8sIHUpIHsgaWYgKHUucm9sZXMubGVuZ3RoID09IDAgfHwgdS5yb2xlcy5pbmRleE9mKCdfYWRtaW4nKSA9PSAtMSkgeyB0aHJvdyh7IGZvcmJpZGRlbjogJ1lvdSBtdXN0IGJlIGFuIGFkbWluIGluIHRvIHNhdmUgZGF0YScgfSk7IH0gfVwiXG4gICAgICAgICAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKVxuICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT09IDQwNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkVSUk9SISEhIFwiICsgZXJyKVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZWplY3QoeyBlcnJvcjogJ3VuYXV0aG9yaXplZCcgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG5cblxuXG5cblxufVxuXG5cblxuXG5leHBvcnQgZGVmYXVsdCBjb3VjaEFjY2Vzc1xuIl19
