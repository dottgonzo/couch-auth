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
function getuserdb(internal_couchdb, username) {
    return new Promise(function (resolve, reject) {
        rpj.get(internal_couchdb.my('_users/org.couchdb.user:' + username)).then(function (doc) {
            resolve(doc);
        }).catch(function (err) {
            if (err.statusCode !== 404) {
                throw Error("ERROR!!!" + err);
            }
            reject(err);
        });
    });
}
var couchAccess = (function (_super) {
    __extends(couchAccess, _super);
    function couchAccess(rootaccessdb) {
        var _this = _super.call(this, rootaccessdb) || this;
        var that = _this;
        function addAdminRole() {
            that.addAppRole(that.user, 'app_main').then(function () {
                console.log("created!");
                return true;
            }).catch(function (err) {
                console.log("errRRR " + err);
            });
        }
        rpj.get(that.my('app_main')).then(function () {
            getuserdb(that, that.user).then(function (u) {
                if (u.roles.indexOf('app_main') !== -1) {
                    addAdminRole();
                }
                else {
                    console.log("created!");
                    return true;
                }
            }).catch(function (err) {
                that.createUser(that.user, that.password, '').then(function () {
                    addAdminRole();
                }).catch(function (err) {
                    console.error("err " + err);
                });
            });
        }).catch(function (err) {
            that.createClosedApp('app_main').then(function () {
                getuserdb(that, that.user).then(function (u) {
                    if (u.roles.indexOf('app_main') !== -1) {
                        addAdminRole();
                    }
                    else {
                        console.log("created!");
                        return true;
                    }
                }).catch(function (err) {
                    that.createUser(that.user, that.password, '').then(function () {
                        addAdminRole();
                    }).catch(function (err) {
                        console.error("err " + err);
                    });
                });
            }).catch(function (err) {
                console.error("err " + err);
            });
        });
        return _this;
    }
    couchAccess.prototype.login = function (o) {
        var that = this;
        return new Promise(function (resolve, reject) {
            if (o && o.username && o.password && o.app_id) {
                testauth(that, o.username, o.password, o.app_id).then(function () {
                    resolve(true);
                }).catch(function (err) {
                    reject(err);
                });
            }
            else {
                if (!o) {
                    reject('no options provided');
                }
                else if (!o.username) {
                    reject('no username provided');
                }
                else if (!o.password) {
                    reject('no password provided');
                }
                else if (!o.app_id) {
                    reject('no app_id provided');
                }
            }
        });
    };
    couchAccess.prototype.register = function (o) {
        var that = this;
        return new Promise(function (resolve, reject) {
            if (o && o.username && o.password && o.email && o.app_id) {
                that.createUser(o.username, o.password, o.email).then(function () {
                    that.subscribeapp(o.app_id, o.username).then(function () {
                        resolve(true);
                    }).catch(function (err) {
                        reject(err);
                    });
                }).catch(function (err) {
                    reject(err);
                });
            }
            else {
                if (!o) {
                    reject('no options provided');
                }
                else if (!o.username) {
                    reject('no username provided');
                }
                else if (!o.password) {
                    reject('no password provided');
                }
                else if (!o.email) {
                    reject('no email provided');
                }
                else if (!o.app_id) {
                    reject('no app_id provided');
                }
            }
        });
    };
    couchAccess.prototype.createappforuser = function (app_id, username) {
        var internal_couchdb = this;
        return new Promise(function (resolve, reject) {
            internal_couchdb.createClosedApp(app_id).then(function () {
                internal_couchdb.subscribeapp(app_id, username, true).then(function () {
                    resolve(true);
                }).catch(function (err) {
                    reject(err);
                });
            }).catch(function (err) {
                reject(err);
            });
        });
    };
    couchAccess.prototype.addAppRole = function (username, app_id) {
        var that = this;
        return new Promise(function (resolve, reject) {
            getuserdb(that, username).then(function (u) {
                u.roles.push(app_id);
                rpj.put(that.my('_users/org.couchdb.user:' + username), u).then(function () {
                    resolve(true);
                }).catch(function (err) {
                    reject(err);
                });
            }).catch(function (err) {
                reject(err);
            });
        });
    };
    couchAccess.prototype.createUser = function (username, password, email) {
        var that = this;
        return new Promise(function (resolve, reject) {
            getuserdb(that, username).then(function (u) {
                reject("user " + username + " just eixsts");
            }).catch(function (err) {
                var doc = { name: username, email: email, db: [], "roles": ['user'], "type": "user", password: password };
                rpj.put(that.my('_users/org.couchdb.user:' + username), doc).then(function () {
                    getuserdb(that, username).then(function (u) {
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
    couchAccess.prototype.testlogin = function (user, password, db) {
        return testlogin(this, user, password, db);
    };
    couchAccess.prototype.testapp_id = function (app_id) {
        return testapp_id(this, app_id);
    };
    couchAccess.prototype.getuserdbs = function (username) {
        return getuserdbs(this, username);
    };
    couchAccess.prototype.getuserapp = function (username, app_id) {
        return getuserapp(this, username, app_id);
    };
    couchAccess.prototype.getmymachine = function (app_id, username, label) {
        return getmymachine(this, app_id, username, label);
    };
    couchAccess.prototype.getmymachines = function (app_id, username) {
        return getmymachines(this, app_id, username);
    };
    couchAccess.prototype.create_slave_userapp = function (username, userdb) {
        return create_slave_userapp(this, username, userdb);
    };
    couchAccess.prototype.subscribeapp = function (app_id, username, owner) {
        var internal_couchdb = this;
        return new Promise(function (resolve, reject) {
            function sub(doc) {
                var newuserdb = gen_db('member', { username: username, app_id: app_id });
                create_slave_userapp(internal_couchdb, username, newuserdb).then(function (slave) {
                    var newdb = { app_id: app_id, dbname: newuserdb, slave: { username: slave.user, password: slave.password }, dbtype: "mine", roles: ['owner'] };
                    doc.db.push(newdb);
                    if (owner) {
                        doc.roles.push('app_' + app_id);
                        var startapp = { app_id: app_id, dbname: 'app_' + app_id, dbtype: "application", roles: ['owner'] };
                        doc.db.push(startapp);
                    }
                    rpj.put(internal_couchdb.my('_users/org.couchdb.user:' + username), doc).then(function () {
                        rpj.put(internal_couchdb.my(newuserdb), doc).then(function () {
                            rpj.put(internal_couchdb.my(newuserdb + '/_security'), { "members": { "names": [username, slave.user], "roles": [] } }).then(function () {
                                resolve(true);
                            }).catch(function (err) {
                                if (err.statusCode !== 404) {
                                    throw Error("ERROR!!!" + err);
                                }
                                reject(err);
                            });
                        }).catch(function (err) {
                            if (err.statusCode !== 404) {
                                throw Error("ERROR!!!" + err);
                            }
                            reject(err);
                        });
                    }).catch(function (err) {
                        if (err.statusCode !== 404) {
                            throw Error("ERROR!!!" + err);
                        }
                        reject(err);
                    });
                }).catch(function (err) {
                    if (err.statusCode !== 404) {
                        throw Error("ERROR!!!" + err);
                    }
                    reject(err);
                });
            }
            getuserdb(internal_couchdb, username).then(function (doc) {
                testapp_id(internal_couchdb, app_id).then(function () {
                    sub(doc);
                }).catch(function (err) {
                    reject(err);
                });
            }).catch(function (err) {
                reject(err);
            });
        });
    };
    couchAccess.prototype.createClosedApp = function (app_id) {
        var internal_couchdb = this;
        return new Promise(function (resolve, reject) {
            rpj.put(internal_couchdb.my(app_id)).then(function () {
                rpj.put(internal_couchdb.my(app_id + '/_design/auth'), {
                    "language": "javascript",
                    "validate_doc_update": "function(n,o,u){if(n._id&&!n._id.indexOf(\"_local/\"))return;if(!u||!u.roles||(u.roles.indexOf(\"" + app_id + "\")==-1&&u.roles.indexOf(\"_admin\")==-1)){throw({forbidden:'Denied.'})}}"
                }).then(function () {
                    resolve(true);
                }).catch(function (err) {
                    if (err.statusCode !== 404) {
                        throw Error("ERROR!!!" + err);
                    }
                    reject(err);
                });
            }).catch(function (err) {
                if (err.statusCode !== 404) {
                    throw Error("ERROR!!!" + err);
                }
                else {
                    reject(err);
                }
            });
        });
    };
    couchAccess.prototype.createRoApp = function (app_id) {
        var internal_couchdb = this;
        return new Promise(function (resolve, reject) {
            rpj.put(internal_couchdb.my(app_id)).then(function () {
                rpj.put(internal_couchdb.my(app_id + '/_design/auth'), {
                    "language": "javascript",
                    "validate_doc_update": "function(n, o, u) { if (u.roles.length == 0 || u.roles.indexOf('_admin') == -1) { throw({ forbidden: 'You must be an admin in to save data' }); } }"
                }).then(function () {
                    resolve(true);
                }).catch(function (err) {
                    reject(err);
                });
            }).catch(function (err) {
                if (err.statusCode !== 404) {
                    throw Error("ERROR!!!" + err);
                }
                reject(err);
            });
        });
    };
    couchAccess.prototype.sharemach = function (app_id, user, label, friend) {
        return sharemach(this, app_id, user, label, friend);
    };
    return couchAccess;
}(couchjsonconf_1.default));
function gen_db(kind, data) {
    switch (kind) {
        case 'member':
            return 'mem_' + uid(3) + '_' + data.app_id + '_' + data.username;
        case 'machine':
            return 'mach_' + uid(6) + '_' + data.app_id;
    }
}
function random_slave(username) {
    return {
        password: uid(12),
        user: 'sl_' + username + '_' + uid(6)
    };
}
exports.default = couchAccess;

//# sourceMappingURL=data:application/json;charset=utf8;base64,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dEIsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNYLEtBQUssUUFBUTtZQUNULE1BQU0sQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFBO1FBQ3BFLEtBQUssU0FBUztZQUNWLE1BQU0sQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFBO0lBRW5ELENBQUM7QUFDTCxDQUFDO0FBQ0Qsc0JBQXNCLFFBQVE7SUFFMUIsTUFBTSxDQUFDO1FBQ0gsUUFBUSxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDakIsSUFBSSxFQUFFLEtBQUssR0FBRyxRQUFRLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7S0FDeEMsQ0FBQTtBQUVMLENBQUM7QUFHRCxrQkFBZSxXQUFXLENBQUEiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBQcm9taXNlIGZyb20gXCJibHVlYmlyZFwiXG5pbXBvcnQgKiBhcyBfIGZyb20gXCJsb2Rhc2hcIlxuXG5pbXBvcnQgY291Y2hKc29uQ29uZiBmcm9tIFwiY291Y2hqc29uY29uZlwiXG5cbmltcG9ydCB7IElDbGFzc0NvbmYsIElVc2VyREIsIEljb21tb25EQiB9IGZyb20gXCIuL2ludGVyZmFjZVwiXG5cbmNvbnN0IHVpZCA9IHJlcXVpcmUoXCJ1aWRcIilcbmNvbnN0IHJwaiA9IHJlcXVpcmUoXCJyZXF1ZXN0LXByb21pc2UtanNvblwiKVxuXG5cblxuXG5mdW5jdGlvbiBnZXR1c2VyZGIoaW50ZXJuYWxfY291Y2hkYiwgdXNlcm5hbWUpIHtcblxuICAgIC8vIHJldHVybiBhbGwgdGhlIHVzZXIgZG9jIGluIF91c2Vyc1xuXG5cbiAgICByZXR1cm4gbmV3IFByb21pc2U8SVVzZXJEQj4oZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBycGouZ2V0KGludGVybmFsX2NvdWNoZGIubXkoJ191c2Vycy9vcmcuY291Y2hkYi51c2VyOicgKyB1c2VybmFtZSkpLnRoZW4oZnVuY3Rpb24gKGRvYykge1xuICAgICAgICAgICAgcmVzb2x2ZShkb2MpXG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGlmIChlcnIuc3RhdHVzQ29kZSAhPT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJFUlJPUiEhIVwiICsgZXJyKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICB9KVxuICAgIH0pXG59XG5cblxuXG5jbGFzcyBjb3VjaEFjY2VzcyBleHRlbmRzIGNvdWNoSnNvbkNvbmYge1xuXG4gICAgY29uc3RydWN0b3Iocm9vdGFjY2Vzc2RiOiBJQ2xhc3NDb25mKSB7XG4gICAgICAgIHN1cGVyKHJvb3RhY2Nlc3NkYilcblxuICAgICAgICBsZXQgdGhhdCA9IHRoaXNcblxuICAgICAgICBmdW5jdGlvbiBhZGRBZG1pblJvbGUoKSB7XG4gICAgICAgICAgICB0aGF0LmFkZEFwcFJvbGUodGhhdC51c2VyLCAnYXBwX21haW4nKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImNyZWF0ZWQhXCIpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImVyclJSUiBcIiArIGVycilcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuXG5cblxuICAgICAgICBycGouZ2V0KHRoYXQubXkoJ2FwcF9tYWluJykpLnRoZW4oZnVuY3Rpb24gKCkge1xuXG5cbiAgICAgICAgICAgIGdldHVzZXJkYih0aGF0LCB0aGF0LnVzZXIpLnRoZW4oKHUpID0+IHtcblxuICAgICAgICAgICAgICAgIGlmICh1LnJvbGVzLmluZGV4T2YoJ2FwcF9tYWluJykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZEFkbWluUm9sZSgpXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJjcmVhdGVkIVwiKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgIHRoYXQuY3JlYXRlVXNlcih0aGF0LnVzZXIsIHRoYXQucGFzc3dvcmQsICcnKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgYWRkQWRtaW5Sb2xlKClcbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJlcnIgXCIgKyBlcnIpXG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgfSlcblxuXG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcblxuXG4gICAgICAgICAgICB0aGF0LmNyZWF0ZUNsb3NlZEFwcCgnYXBwX21haW4nKS50aGVuKCgpID0+IHtcblxuICAgICAgICAgICAgICAgIGdldHVzZXJkYih0aGF0LCB0aGF0LnVzZXIpLnRoZW4oKHUpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICBpZiAodS5yb2xlcy5pbmRleE9mKCdhcHBfbWFpbicpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWRkQWRtaW5Sb2xlKClcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiY3JlYXRlZCFcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICB0aGF0LmNyZWF0ZVVzZXIodGhhdC51c2VyLCB0aGF0LnBhc3N3b3JkLCAnJykudGhlbigoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZEFkbWluUm9sZSgpXG5cblxuICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiZXJyIFwiICsgZXJyKVxuICAgICAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgfSlcblxuXG5cbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcblxuXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcImVyciBcIiArIGVycilcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG5cblxuICAgIH1cblxuICAgIGxvZ2luKG86IHsgdXNlcm5hbWU6IHN0cmluZywgcGFzc3dvcmQ6IHN0cmluZywgYXBwX2lkOiBzdHJpbmcgfSkge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpc1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxib29sZWFuPihmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cbiAgICAgICAgICAgIGlmIChvICYmIG8udXNlcm5hbWUgJiYgby5wYXNzd29yZCAmJiBvLmFwcF9pZCkge1xuICAgICAgICAgICAgICAgIHRlc3RhdXRoKHRoYXQsIG8udXNlcm5hbWUsIG8ucGFzc3dvcmQsIG8uYXBwX2lkKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKVxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICghbykge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoJ25vIG9wdGlvbnMgcHJvdmlkZWQnKVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIW8udXNlcm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KCdubyB1c2VybmFtZSBwcm92aWRlZCcpXG5cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFvLnBhc3N3b3JkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdCgnbm8gcGFzc3dvcmQgcHJvdmlkZWQnKVxuXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghby5hcHBfaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KCdubyBhcHBfaWQgcHJvdmlkZWQnKVxuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgcmVnaXN0ZXIobzogeyB1c2VybmFtZTogc3RyaW5nLCBwYXNzd29yZDogc3RyaW5nLCBlbWFpbDogc3RyaW5nLCBhcHBfaWQ6IHN0cmluZyB9KTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzXG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPGJvb2xlYW4+KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgIGlmIChvICYmIG8udXNlcm5hbWUgJiYgby5wYXNzd29yZCAmJiBvLmVtYWlsICYmIG8uYXBwX2lkKSB7XG4gICAgICAgICAgICAgICAgdGhhdC5jcmVhdGVVc2VyKG8udXNlcm5hbWUsIG8ucGFzc3dvcmQsIG8uZW1haWwpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGF0LnN1YnNjcmliZWFwcChvLmFwcF9pZCwgby51c2VybmFtZSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRydWUpXG4gICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICghbykge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoJ25vIG9wdGlvbnMgcHJvdmlkZWQnKVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIW8udXNlcm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KCdubyB1c2VybmFtZSBwcm92aWRlZCcpXG5cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFvLnBhc3N3b3JkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdCgnbm8gcGFzc3dvcmQgcHJvdmlkZWQnKVxuXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghby5lbWFpbCkge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoJ25vIGVtYWlsIHByb3ZpZGVkJylcblxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIW8uYXBwX2lkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdCgnbm8gYXBwX2lkIHByb3ZpZGVkJylcblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KVxuXG4gICAgfVxuXG4gICAgY3JlYXRlYXBwZm9ydXNlcihhcHBfaWQsIHVzZXJuYW1lKSB7IC8vIGNyZWF0ZSBhIG5ldyBhcHBsaWNhdGlvblxuXG4gICAgICAgIGNvbnN0IGludGVybmFsX2NvdWNoZGIgPSB0aGlzXG5cblxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxib29sZWFuPihmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cblxuICAgICAgICAgICAgaW50ZXJuYWxfY291Y2hkYi5jcmVhdGVDbG9zZWRBcHAoYXBwX2lkKS50aGVuKGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgICAgIGludGVybmFsX2NvdWNoZGIuc3Vic2NyaWJlYXBwKGFwcF9pZCwgdXNlcm5hbWUsIHRydWUpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRydWUpXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuXG5cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG5cblxuICAgICAgICAgICAgfSlcblxuXG5cblxuICAgICAgICB9KVxuICAgIH1cblxuXG4gICAgYWRkQXBwUm9sZSh1c2VybmFtZTogc3RyaW5nLCBhcHBfaWQ6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpc1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8Ym9vbGVhbj4oZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXG4gICAgICAgICAgICBnZXR1c2VyZGIodGhhdCwgdXNlcm5hbWUpLnRoZW4oKHUpID0+IHtcbiAgICAgICAgICAgICAgICB1LnJvbGVzLnB1c2goYXBwX2lkKVxuXG4gICAgICAgICAgICAgICAgcnBqLnB1dCh0aGF0Lm15KCdfdXNlcnMvb3JnLmNvdWNoZGIudXNlcjonICsgdXNlcm5hbWUpLCB1KS50aGVuKCgpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRydWUpXG5cbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgfSlcblxuICAgICAgICB9KVxuXG4gICAgfVxuXG5cblxuICAgIGNyZWF0ZVVzZXIodXNlcm5hbWU6IHN0cmluZywgcGFzc3dvcmQ6IHN0cmluZywgZW1haWw6IHN0cmluZyk6IFByb21pc2U8SVVzZXJEQj4ge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpc1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8SVVzZXJEQj4oZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXG4gICAgICAgICAgICBnZXR1c2VyZGIodGhhdCwgdXNlcm5hbWUpLnRoZW4oKHUpID0+IHtcbiAgICAgICAgICAgICAgICByZWplY3QoXCJ1c2VyIFwiICsgdXNlcm5hbWUgKyBcIiBqdXN0IGVpeHN0c1wiKVxuXG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBkb2MgPSB7IG5hbWU6IHVzZXJuYW1lLCBlbWFpbDogZW1haWwsIGRiOiBbXSwgXCJyb2xlc1wiOiBbJ3VzZXInXSwgXCJ0eXBlXCI6IFwidXNlclwiLCBwYXNzd29yZDogcGFzc3dvcmQgfVxuXG4gICAgICAgICAgICAgICAgcnBqLnB1dCh0aGF0Lm15KCdfdXNlcnMvb3JnLmNvdWNoZGIudXNlcjonICsgdXNlcm5hbWUpLCBkb2MpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBnZXR1c2VyZGIodGhhdCwgdXNlcm5hbWUpLnRoZW4oKHUpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh1KVxuXG4gICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgIH0pXG5cblxuXG5cbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICB0ZXN0bG9naW4odXNlciwgcGFzc3dvcmQsIGRiKSB7XG5cblxuICAgICAgICByZXR1cm4gdGVzdGxvZ2luKHRoaXMsIHVzZXIsIHBhc3N3b3JkLCBkYilcbiAgICB9XG5cblxuICAgIHRlc3RhcHBfaWQoYXBwX2lkKSB7XG5cblxuICAgICAgICByZXR1cm4gdGVzdGFwcF9pZCh0aGlzLCBhcHBfaWQpXG4gICAgfVxuXG5cbiAgICBnZXR1c2VyZGJzKHVzZXJuYW1lKSB7XG5cbiAgICAgICAgcmV0dXJuIGdldHVzZXJkYnModGhpcywgdXNlcm5hbWUpXG4gICAgfVxuXG5cblxuICAgIGdldHVzZXJhcHAodXNlcm5hbWUsIGFwcF9pZCkge1xuXG4gICAgICAgIHJldHVybiBnZXR1c2VyYXBwKHRoaXMsIHVzZXJuYW1lLCBhcHBfaWQpXG4gICAgfVxuXG5cblxuICAgIGdldG15bWFjaGluZShhcHBfaWQsIHVzZXJuYW1lLCBsYWJlbCkge1xuXG4gICAgICAgIHJldHVybiBnZXRteW1hY2hpbmUodGhpcywgYXBwX2lkLCB1c2VybmFtZSwgbGFiZWwpXG4gICAgfVxuXG4gICAgZ2V0bXltYWNoaW5lcyhhcHBfaWQsIHVzZXJuYW1lKSB7XG5cbiAgICAgICAgcmV0dXJuIGdldG15bWFjaGluZXModGhpcywgYXBwX2lkLCB1c2VybmFtZSlcbiAgICB9XG5cblxuICAgIGNyZWF0ZV9zbGF2ZV91c2VyYXBwKHVzZXJuYW1lOiBzdHJpbmcsIHVzZXJkYjogc3RyaW5nKSB7XG5cblxuICAgICAgICByZXR1cm4gY3JlYXRlX3NsYXZlX3VzZXJhcHAodGhpcywgdXNlcm5hbWUsIHVzZXJkYilcbiAgICB9XG5cbiAgICBzdWJzY3JpYmVhcHAoYXBwX2lkOiBzdHJpbmcsIHVzZXJuYW1lOiBzdHJpbmcsIG93bmVyPzogYm9vbGVhbikge1xuXG5cblxuICAgICAgICAvLyBldmVyeSB1c2VyIG11c3QgaGF2ZSBhIHBlcnNvbmFsIGRiIGZvciBldmVyeSBhcHBsaWNhdGlvbiB0aGF0IHRoZXkgaGF2ZSBhY2Nlc3NcbiAgICAgICAgLy8gd2hlbiBhbiB1c2VyIHN1YnNjcmliZSBhbiBhcHAsIGEgZGIgYW5kIGl0J3Mgc2xhdmUgdXNlciAgd2lsbCBiZSBjcmVhdGVkIGZvciBoaW0sIGFuZCB0aGUgdXNlciBkb2MgaW4gX3VzZXJzIHJlZ2lzdGVyIHRoZSBuZXcgY3JlZGVudGlhbHMgZ2VuZXJhdGVkIFxuXG5cblxuXG4gICAgICAgIGNvbnN0IGludGVybmFsX2NvdWNoZGIgPSB0aGlzXG5cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8Ym9vbGVhbj4oZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXG5cblxuICAgICAgICAgICAgZnVuY3Rpb24gc3ViKGRvYykge1xuXG5cbiAgICAgICAgICAgICAgICB2YXIgbmV3dXNlcmRiID0gZ2VuX2RiKCdtZW1iZXInLCB7IHVzZXJuYW1lOiB1c2VybmFtZSwgYXBwX2lkOiBhcHBfaWQgfSlcblxuICAgICAgICAgICAgICAgIGNyZWF0ZV9zbGF2ZV91c2VyYXBwKGludGVybmFsX2NvdWNoZGIsIHVzZXJuYW1lLCBuZXd1c2VyZGIpLnRoZW4oZnVuY3Rpb24gKHNsYXZlKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld2RiID0geyBhcHBfaWQ6IGFwcF9pZCwgZGJuYW1lOiBuZXd1c2VyZGIsIHNsYXZlOiB7IHVzZXJuYW1lOiBzbGF2ZS51c2VyLCBwYXNzd29yZDogc2xhdmUucGFzc3dvcmQgfSwgZGJ0eXBlOiBcIm1pbmVcIiwgcm9sZXM6IFsnb3duZXInXSB9XG4gICAgICAgICAgICAgICAgICAgIGRvYy5kYi5wdXNoKG5ld2RiKVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChvd25lcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9jLnJvbGVzLnB1c2goJ2FwcF8nICsgYXBwX2lkKVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHN0YXJ0YXBwID0geyBhcHBfaWQ6IGFwcF9pZCwgZGJuYW1lOiAnYXBwXycgKyBhcHBfaWQsIGRidHlwZTogXCJhcHBsaWNhdGlvblwiLCByb2xlczogWydvd25lciddIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGRvYy5kYi5wdXNoKHN0YXJ0YXBwKVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcnBqLnB1dChpbnRlcm5hbF9jb3VjaGRiLm15KCdfdXNlcnMvb3JnLmNvdWNoZGIudXNlcjonICsgdXNlcm5hbWUpLCBkb2MpLnRoZW4oZnVuY3Rpb24gKCkgeyAvLyBwdXNoIG5ldyB1c2VyIHNldHRpbmdzXG4gICAgICAgICAgICAgICAgICAgICAgICBycGoucHV0KGludGVybmFsX2NvdWNoZGIubXkobmV3dXNlcmRiKSwgZG9jKS50aGVuKGZ1bmN0aW9uICgpIHsgIC8vIGNyZWF0ZSBhbiBlbXB0eSBkYlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJwai5wdXQoaW50ZXJuYWxfY291Y2hkYi5teShuZXd1c2VyZGIgKyAnL19zZWN1cml0eScpLCB7IFwibWVtYmVyc1wiOiB7IFwibmFtZXNcIjogW3VzZXJuYW1lLCBzbGF2ZS51c2VyXSwgXCJyb2xlc1wiOiBbXSB9IH0pLnRoZW4oZnVuY3Rpb24gKCkgeyAvLyBwdXNoIHNlY3VyaXR5IGNoYW5nZXMgdG8gYXBwIGRiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUodHJ1ZSlcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25maXJtREIucG9zdCh7Y29uZmlybTpmYWxzZX0pLnRoZW4oZnVuY3Rpb24oZG9jKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAvLyAgcmVnaXN0ZXJNYWlsKCdkYXJpb3l6ZkBnbWFpbC5jb20nLGRvYy5pZCkgLy8gVE8gQkUgQUxJVkVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gfSkuY2F0Y2goZnVuY3Rpb24oZXJyKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB9KVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT09IDQwNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJFUlJPUiEhIVwiICsgZXJyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIuc3RhdHVzQ29kZSAhPT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiRVJST1IhISFcIiArIGVycilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVyci5zdGF0dXNDb2RlICE9PSA0MDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIkVSUk9SISEhXCIgKyBlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT09IDQwNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJFUlJPUiEhIVwiICsgZXJyKVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuXG5cblxuXG4gICAgICAgICAgICBnZXR1c2VyZGIoaW50ZXJuYWxfY291Y2hkYiwgdXNlcm5hbWUpLnRoZW4oZnVuY3Rpb24gKGRvYykge1xuXG4gICAgICAgICAgICAgICAgdGVzdGFwcF9pZChpbnRlcm5hbF9jb3VjaGRiLCBhcHBfaWQpLnRoZW4oZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICAgICAgICAgIHN1Yihkb2MpXG5cblxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycilcblxuXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuXG5cbiAgICB9XG5cbiAgICBjcmVhdGVDbG9zZWRBcHAoYXBwX2lkKSB7XG4gICAgICAgIGNvbnN0IGludGVybmFsX2NvdWNoZGIgPSB0aGlzXG5cbiAgICAgICAgLy8gY3JlYXRlIGFuIGFwcGxpY2F0aW9uIChpbXBlcmF0aXZlKVxuICAgICAgICAvLyByZXR1cm4gdHJ1ZSBvbmx5XG5cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8Ym9vbGVhbj4oZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXG4gICAgICAgICAgICBycGoucHV0KGludGVybmFsX2NvdWNoZGIubXkoYXBwX2lkKSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcnBqLnB1dChpbnRlcm5hbF9jb3VjaGRiLm15KGFwcF9pZCArICcvX2Rlc2lnbi9hdXRoJyksIHtcbiAgICAgICAgICAgICAgICAgICAgXCJsYW5ndWFnZVwiOiBcImphdmFzY3JpcHRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ2YWxpZGF0ZV9kb2NfdXBkYXRlXCI6IFwiZnVuY3Rpb24obixvLHUpe2lmKG4uX2lkJiYhbi5faWQuaW5kZXhPZihcXFwiX2xvY2FsL1xcXCIpKXJldHVybjtpZighdXx8IXUucm9sZXN8fCh1LnJvbGVzLmluZGV4T2YoXFxcIlwiICsgYXBwX2lkICsgXCJcXFwiKT09LTEmJnUucm9sZXMuaW5kZXhPZihcXFwiX2FkbWluXFxcIik9PS0xKSl7dGhyb3coe2ZvcmJpZGRlbjonRGVuaWVkLid9KX19XCJcbiAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKVxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVyci5zdGF0dXNDb2RlICE9PSA0MDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiRVJST1IhISFcIiArIGVycilcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT09IDQwNCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIkVSUk9SISEhXCIgKyBlcnIpXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgfSlcbiAgICB9XG5cblxuICAgIGNyZWF0ZVJvQXBwKGFwcF9pZCkge1xuICAgICAgICBjb25zdCBpbnRlcm5hbF9jb3VjaGRiID0gdGhpc1xuXG4gICAgICAgIC8vIGNyZWF0ZSBhbiBhcHBsaWNhdGlvbiAoaW1wZXJhdGl2ZSlcbiAgICAgICAgLy8gcmV0dXJuIHRydWUgb25seVxuXG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPGJvb2xlYW4+KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblxuICAgICAgICAgICAgcnBqLnB1dChpbnRlcm5hbF9jb3VjaGRiLm15KGFwcF9pZCkpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJwai5wdXQoaW50ZXJuYWxfY291Y2hkYi5teShhcHBfaWQgKyAnL19kZXNpZ24vYXV0aCcpLCB7XG4gICAgICAgICAgICAgICAgICAgIFwibGFuZ3VhZ2VcIjogXCJqYXZhc2NyaXB0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwidmFsaWRhdGVfZG9jX3VwZGF0ZVwiOiBcImZ1bmN0aW9uKG4sIG8sIHUpIHsgaWYgKHUucm9sZXMubGVuZ3RoID09IDAgfHwgdS5yb2xlcy5pbmRleE9mKCdfYWRtaW4nKSA9PSAtMSkgeyB0aHJvdyh7IGZvcmJpZGRlbjogJ1lvdSBtdXN0IGJlIGFuIGFkbWluIGluIHRvIHNhdmUgZGF0YScgfSk7IH0gfVwiXG4gICAgICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodHJ1ZSlcbiAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG5cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGlmIChlcnIuc3RhdHVzQ29kZSAhPT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiRVJST1IhISFcIiArIGVycilcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgfSlcblxuICAgICAgICB9KVxuICAgIH1cblxuXG4gICAgc2hhcmVtYWNoKGFwcF9pZCwgdXNlciwgbGFiZWwsIGZyaWVuZCkgeyAvLyBjcmVhdGUgb3Igc3Vic2NyaWJlIG5ldyBhcHBsaWNhdGlvblxuXG5cblxuICAgICAgICByZXR1cm4gc2hhcmVtYWNoKHRoaXMsIGFwcF9pZCwgdXNlciwgbGFiZWwsIGZyaWVuZClcbiAgICB9XG5cblxuXG5cblxuXG59XG5cblxuZnVuY3Rpb24gZ2VuX2RiKGtpbmQsIGRhdGEpOiBzdHJpbmcge1xuICAgIHN3aXRjaCAoa2luZCkge1xuICAgICAgICBjYXNlICdtZW1iZXInOlxuICAgICAgICAgICAgcmV0dXJuICdtZW1fJyArIHVpZCgzKSArICdfJyArIGRhdGEuYXBwX2lkICsgJ18nICsgZGF0YS51c2VybmFtZVxuICAgICAgICBjYXNlICdtYWNoaW5lJzpcbiAgICAgICAgICAgIHJldHVybiAnbWFjaF8nICsgdWlkKDYpICsgJ18nICsgZGF0YS5hcHBfaWRcblxuICAgIH1cbn1cbmZ1bmN0aW9uIHJhbmRvbV9zbGF2ZSh1c2VybmFtZSk6IHsgcGFzc3dvcmQ6IHN0cmluZzsgdXNlcjogc3RyaW5nIH0ge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcGFzc3dvcmQ6IHVpZCgxMiksXG4gICAgICAgIHVzZXI6ICdzbF8nICsgdXNlcm5hbWUgKyAnXycgKyB1aWQoNilcbiAgICB9XG5cbn1cblxuXG5leHBvcnQgZGVmYXVsdCBjb3VjaEFjY2Vzc1xuIl19
