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
var _ = require("lodash");
var couchjsonconf_1 = require("couchjsonconf");
var uid = require("uid");
var rpj = require("request-promise-json");
function testlogin(internal_couchdb, user, password, db) {
    return new Promise(function (resolve, reject) {
        rpj.get(internal_couchdb.for(user, password, db)).then(function () {
            resolve(true);
        }).catch(function (err) {
            if (err.statusCode != 404) {
                throw Error("ERROR!!!" + err);
            }
            reject(err);
        });
    });
}
function testapp_id(internal_couchdb, app_id) {
    return new Promise(function (resolve, reject) {
        rpj.get(internal_couchdb.my('app_' + app_id)).then(function () {
            resolve(true);
        }).catch(function (err) {
            if (err.statusCode != 404) {
                throw Error("ERROR!!!" + err);
            }
            reject(err);
        });
    });
}
function testauth(internal_couchdb, user, password, app_id) {
    return new Promise(function (resolve, reject) {
        getuserapp(internal_couchdb, user, app_id).then(function (db) {
            testlogin(internal_couchdb, user, password, db.dbname).then(function () {
                resolve(true);
            }).catch(function (err) {
                if (err.statusCode != 404) {
                    throw Error("ERROR!!!" + err);
                }
                reject(err);
            });
        }).catch(function (err) {
            if (err.statusCode != 404) {
                throw Error("ERROR!!!" + err);
            }
            reject(err);
        });
    });
}
function getuserdb(internal_couchdb, username) {
    return new Promise(function (resolve, reject) {
        rpj.get(internal_couchdb.my('_users/org.couchdb.user:' + username)).then(function (doc) {
            resolve(doc);
        }).catch(function (err) {
            if (err.statusCode != 404) {
                throw Error("ERROR!!!" + err);
            }
            reject(err);
        });
    });
}
function getuserdbs(internal_couchdb, username) {
    return new Promise(function (resolve, reject) {
        getuserdb(internal_couchdb, username).then(function (doc) {
            resolve(doc.db);
        }).catch(function (err) {
            if (err.statusCode != 404) {
                throw Error("ERROR!!!" + err);
            }
            reject(err);
        });
    });
}
function getuserapp(internal_couchdb, username, app_id) {
    return new Promise(function (resolve, reject) {
        getuserdbs(internal_couchdb, username).then(function (doc) {
            _.map(doc, function (d) {
                if (d.app_id == app_id && d.dbtype == 'mine') {
                    resolve(d);
                }
            });
        }).catch(function (err) {
            if (err.statusCode != 404) {
                throw Error("ERROR!!!" + err);
            }
            reject(err);
        });
    });
}
function getmymachine(internal_couchdb, app_id, username, label) {
    return new Promise(function (resolve, reject) {
        getuserdbs(internal_couchdb, username).then(function (doc) {
            _.map(doc, function (d) {
                if (d.app_id == app_id && d.dbtype == 'machine' && d.label == label) {
                    resolve(d);
                }
            });
        }).catch(function (err) {
            if (err.statusCode != 404) {
                throw Error("ERROR!!!" + err);
            }
            reject(err);
        });
    });
}
function getmymachines(internal_couchdb, app_id, username) {
    return new Promise(function (resolve, reject) {
        getuserdbs(internal_couchdb, username).then(function (doc) {
            var dbs = [];
            _.map(doc, function (d) {
                if (d.app_id == app_id && d.dbtype == 'machine') {
                    dbs.push(d);
                }
            });
            resolve(dbs);
        }).catch(function (err) {
            if (err.statusCode != 404) {
                throw Error("ERROR!!!" + err);
            }
            reject(err);
        });
    });
}
function create_slave_userapp(internal_couchdb, username, userappdb) {
    return new Promise(function (resolve, reject) {
        var slave = random_slave(username);
        rpj.put(internal_couchdb.my('_users/org.couchdb.user:' + slave.user), {
            name: slave.user,
            roles: ['slave'],
            app: { db: userappdb, user: username },
            dbtype: "userslave",
            type: "user",
            password: slave.password
        }).then(function () {
            resolve(slave);
        }).catch(function (err) {
            if (err.statusCode != 404) {
                throw Error("ERROR!!!" + err);
            }
            reject(err);
        });
    });
}
function sharemach(internal_couchdb, app_id, user, label, friend) {
    return new Promise(function (resolve, reject) {
        getmymachine(internal_couchdb, app_id, user, label).then(function (m) {
            getuserapp(internal_couchdb, app_id, friend).then(function () {
                getmymachine(internal_couchdb, app_id, friend, label).then(function () {
                    resolve(true);
                }).catch(function (err) {
                    var newdb = { app_id: app_id, dbname: machinedb, slave: { username: machineuser, password: machinepassw, token: machinetoken }, label: label, dbtype: "machine", roles: ['shared'] };
                    doc.db.push(newdb);
                    rpj.put(internal_couchdb.my('_users/org.couchdb.user:' + friend), doc).then(function () {
                        rpj.get(internal_couchdb.my('_users/org.couchdb.user:' + machineuser), doc).then(function (updateslave) {
                            updateslave.app.users.push(newusername);
                            rpj.put(internal_couchdb.my('_users/org.couchdb.user:' + machineuser), updateslave).then(function () {
                                resolve(true);
                            }).catch(function (err) {
                                if (err.statusCode != 404) {
                                    throw Error("ERROR!!!" + err);
                                }
                                reject(err);
                            });
                        }).catch(function (err) {
                            if (err.statusCode != 404) {
                                throw Error("ERROR!!!" + err);
                            }
                            reject(err);
                        });
                    }).catch(function (err) {
                        if (err.statusCode != 404) {
                            throw Error("ERROR!!!" + err);
                        }
                        reject(err);
                    });
                });
            }).catch(function (err) {
                if (err.statusCode != 404) {
                    throw Error("ERROR!!!" + err);
                }
                reject(err);
            });
        }).catch(function (err) {
            if (err.statusCode != 404) {
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
            that.addAppRole(that.user, 'main').then(function () {
                console.log("created!");
                return true;
            }).catch(function (err) {
                console.log("errRRR " + err);
            });
        }
        rpj.get(that.my('app_main')).then(function () {
            getuserdb(that, that.user).then(function (u) {
                if (u.roles.indexOf('app_main') != -1) {
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
            that.createapp('main').then(function () {
                getuserdb(that, that.user).then(function (u) {
                    if (u.roles.indexOf('app_main') != -1) {
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
            internal_couchdb.createapp(app_id).then(function () {
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
                u.roles.push('app_' + app_id);
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
                                if (err.statusCode != 404) {
                                    throw Error("ERROR!!!" + err);
                                }
                                reject(err);
                            });
                        }).catch(function (err) {
                            if (err.statusCode != 404) {
                                throw Error("ERROR!!!" + err);
                            }
                            reject(err);
                        });
                    }).catch(function (err) {
                        if (err.statusCode != 404) {
                            throw Error("ERROR!!!" + err);
                        }
                        reject(err);
                    });
                }).catch(function (err) {
                    if (err.statusCode != 404) {
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
    couchAccess.prototype.createapp = function (app_id) {
        var internal_couchdb = this;
        return new Promise(function (resolve, reject) {
            rpj.put(internal_couchdb.my('app_' + app_id)).then(function () {
                rpj.put(internal_couchdb.my('app_' + app_id + '/_design/auth'), {
                    "language": "javascript",
                    "validate_doc_update": "function(n,o,u){if(n._id&&!n._id.indexOf(\"_local/\"))return;if(!u||!u.roles||(u.roles.indexOf(\"app_" + app_id + "\")==-1&&u.roles.indexOf(\"_admin\")==-1)){throw({forbidden:'Denied.'})}}"
                }).then(function () {
                    resolve(true);
                }).catch(function (err) {
                    if (err.statusCode != 404) {
                        throw Error("ERROR!!!" + err);
                    }
                    reject(err);
                });
            }).catch(function (err) {
                if (err.statusCode != 404) {
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
            break;
        case 'machine':
            return 'mach_' + uid(6) + '_' + data.app_id;
            break;
    }
}
function random_slave(username) {
    return {
        password: uid(12),
        user: 'sl_' + username + '_' + uid(6)
    };
}
exports.default = couchAccess;

//# sourceMappingURL=data:application/json;charset=utf8;base64,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SSxDQUFDLE1BQU0sR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUNqRSxLQUFLLENBQUM7UUFDVixLQUFLLFNBQVM7WUFDVixNQUFNLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUM1QyxLQUFLLENBQUM7SUFFZCxDQUFDO0FBQ0wsQ0FBQztBQUNELHNCQUFzQixRQUFRO0lBRTFCLE1BQU0sQ0FBQztRQUNILFFBQVEsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDO1FBQ2pCLElBQUksRUFBRSxLQUFLLEdBQUcsUUFBUSxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO0tBQ3hDLENBQUE7QUFFTCxDQUFDO0FBR0Qsa0JBQWUsV0FBVyxDQUFBIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUHJvbWlzZSBmcm9tIFwiYmx1ZWJpcmRcIjtcbmltcG9ydCAqIGFzIF8gZnJvbSBcImxvZGFzaFwiO1xuXG5pbXBvcnQgY291Y2hKc29uQ29uZiBmcm9tIFwiY291Y2hqc29uY29uZlwiO1xuXG5sZXQgdWlkID0gcmVxdWlyZShcInVpZFwiKTtcbmxldCBycGogPSByZXF1aXJlKFwicmVxdWVzdC1wcm9taXNlLWpzb25cIik7XG5cblxuXG5cblxuaW50ZXJmYWNlIEljb21tb25EQiB7XG4gICAgYXBwX2lkOiBzdHJpbmc7XG4gICAgZGJuYW1lOiBzdHJpbmc7XG4gICAgc2xhdmU/OiB7XG4gICAgICAgIHVzZXJuYW1lOiBzdHJpbmc7XG4gICAgICAgIHBhc3N3b3JkOiBzdHJpbmc7XG4gICAgfSxcbiAgICBkYnR5cGU6IHN0cmluZ1xuICAgIHJvbGVzOiBzdHJpbmdbXTtcbiAgICBsYWJlbD86IHN0cmluZztcbn1cblxuXG5pbnRlcmZhY2UgSVVzZXJEQiB7XG4gICAgX2lkOiBzdHJpbmcsXG4gICAgX3Jldjogc3RyaW5nLFxuICAgIHBhc3N3b3JkX3NjaGVtZTogc3RyaW5nO1xuICAgIGl0ZXJhdGlvbnM6IHN0cmluZztcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgZW1haWw6IHN0cmluZztcbiAgICBkYjogSWNvbW1vbkRCW107XG4gICAgcm9sZXM6IHN0cmluZ1tdO1xuICAgIHR5cGU6IHN0cmluZztcbiAgICBkZXJpdmVkX2tleTogc3RyaW5nO1xuICAgIHNhbHQ6IHN0cmluZztcblxufVxuXG5cblxuXG5cblxuZnVuY3Rpb24gdGVzdGxvZ2luKGludGVybmFsX2NvdWNoZGIsIHVzZXIsIHBhc3N3b3JkLCBkYikge1xuXG4gICAgLy8gcmV0dXJuIHRydWUgaWYgY3JlZGVudGlhbHMgYXJlIGNvcnJlY3QgZm9yIGdpdmVuIGRiXG5cbiAgICByZXR1cm4gbmV3IFByb21pc2U8Ym9vbGVhbj4oZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXG4gICAgICAgIHJwai5nZXQoaW50ZXJuYWxfY291Y2hkYi5mb3IodXNlciwgcGFzc3dvcmQsIGRiKSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXNvbHZlKHRydWUpXG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGlmIChlcnIuc3RhdHVzQ29kZSAhPSA0MDQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIkVSUk9SISEhXCIgKyBlcnIpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgIH0pXG4gICAgfSlcblxufVxuXG5cbmZ1bmN0aW9uIHRlc3RhcHBfaWQoaW50ZXJuYWxfY291Y2hkYiwgYXBwX2lkKSB7XG5cblxuICAgIC8vIHJldHVybiB0cnVlIGlmIGFwcF9pZCBleGlzdFxuXG5cbiAgICByZXR1cm4gbmV3IFByb21pc2U8Ym9vbGVhbj4oZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBycGouZ2V0KGludGVybmFsX2NvdWNoZGIubXkoJ2FwcF8nICsgYXBwX2lkKSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXNvbHZlKHRydWUpXG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcblxuICAgICAgICAgICAgaWYgKGVyci5zdGF0dXNDb2RlICE9IDQwNCkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiRVJST1IhISFcIiArIGVycilcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgfSlcbiAgICB9KVxufVxuXG5cblxuXG5cblxuZnVuY3Rpb24gdGVzdGF1dGgoaW50ZXJuYWxfY291Y2hkYiwgdXNlciwgcGFzc3dvcmQsIGFwcF9pZCkge1xuXG5cbiAgICAvLyByZXR1cm4gdHJ1ZSBpZiBjcmVkZW50aWFscyBhcmUgY29ycmVjdCBmb3IgZ2l2ZW4gYXBwX2lkXG5cbiAgICAvLyBnZXQgdXNlciBjcmVkZW50aWFscyBieSB1c2VybmFtZSBhbmQgcGFzc3dvcmQgYW5kIHRha2UgdGhlIGFwcF9pZCBkYiwgdGhlbiB0ZXN0IGxvZ2luIHdpdGggaXRcblxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZ2V0dXNlcmFwcChpbnRlcm5hbF9jb3VjaGRiLCB1c2VyLCBhcHBfaWQpLnRoZW4oZnVuY3Rpb24gKGRiKSB7XG5cbiAgICAgICAgICAgIHRlc3Rsb2dpbihpbnRlcm5hbF9jb3VjaGRiLCB1c2VyLCBwYXNzd29yZCwgZGIuZGJuYW1lKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHRydWUpXG4gICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVyci5zdGF0dXNDb2RlICE9IDQwNCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIkVSUk9SISEhXCIgKyBlcnIpXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGlmIChlcnIuc3RhdHVzQ29kZSAhPSA0MDQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIkVSUk9SISEhXCIgKyBlcnIpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgIH0pXG5cbiAgICB9KVxuXG59XG5cblxuXG5cblxuZnVuY3Rpb24gZ2V0dXNlcmRiKGludGVybmFsX2NvdWNoZGIsIHVzZXJuYW1lKSB7XG5cbiAgICAvLyByZXR1cm4gYWxsIHRoZSB1c2VyIGRvYyBpbiBfdXNlcnNcblxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPElVc2VyREI+KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgcnBqLmdldChpbnRlcm5hbF9jb3VjaGRiLm15KCdfdXNlcnMvb3JnLmNvdWNoZGIudXNlcjonICsgdXNlcm5hbWUpKS50aGVuKGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgICAgICAgIHJlc29sdmUoZG9jKVxuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJFUlJPUiEhIVwiICsgZXJyKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICB9KVxuICAgIH0pXG59XG5cblxuZnVuY3Rpb24gZ2V0dXNlcmRicyhpbnRlcm5hbF9jb3VjaGRiLCB1c2VybmFtZSkge1xuXG4gICAgLy8gcmV0dXJuIGFsbCB0aGUgdXNlciBjcmVkZW50aWFscyBmb3IgZXZlcnkgYXBwbGljYXRpb24gd2hpY2ggdGhleSBoYXZlIGFjY2VzcyAoaW50ZXJuYWwpXG5cbiAgICByZXR1cm4gbmV3IFByb21pc2U8SWNvbW1vbkRCW10+KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZ2V0dXNlcmRiKGludGVybmFsX2NvdWNoZGIsIHVzZXJuYW1lKS50aGVuKGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgICAgICAgIHJlc29sdmUoZG9jLmRiKVxuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJFUlJPUiEhIVwiICsgZXJyKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICB9KVxuICAgIH0pXG59XG5cblxuXG5mdW5jdGlvbiBnZXR1c2VyYXBwKGludGVybmFsX2NvdWNoZGIsIHVzZXJuYW1lLCBhcHBfaWQpIHtcblxuXG4gICAgLy8gcmV0dXJuIHVzZXIgY3JlZGVudGlhbHMgKGludGVybmFsKVxuXG5cbiAgICByZXR1cm4gbmV3IFByb21pc2U8SWNvbW1vbkRCPihmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGdldHVzZXJkYnMoaW50ZXJuYWxfY291Y2hkYiwgdXNlcm5hbWUpLnRoZW4oZnVuY3Rpb24gKGRvYykge1xuICAgICAgICAgICAgXy5tYXAoZG9jLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIGlmIChkLmFwcF9pZCA9PSBhcHBfaWQgJiYgZC5kYnR5cGUgPT0gJ21pbmUnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJFUlJPUiEhIVwiICsgZXJyKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICB9KVxuICAgIH0pXG59XG5cblxuXG5mdW5jdGlvbiBnZXRteW1hY2hpbmUoaW50ZXJuYWxfY291Y2hkYiwgYXBwX2lkLCB1c2VybmFtZSwgbGFiZWwpIHtcblxuXG4gICAgLy8gcmV0dXJuIGNyZWRlbnRpYWxzIGJ5IGFwcGxpY2F0aW9uIGFuZCBsYWJlbCAgKGludGVybmFsKVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPEljb21tb25EQj4oZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBnZXR1c2VyZGJzKGludGVybmFsX2NvdWNoZGIsIHVzZXJuYW1lKS50aGVuKGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgICAgICAgIF8ubWFwKGRvYywgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZC5hcHBfaWQgPT0gYXBwX2lkICYmIGQuZGJ0eXBlID09ICdtYWNoaW5lJyAmJiBkLmxhYmVsID09IGxhYmVsKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJFUlJPUiEhIVwiICsgZXJyKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICB9KVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIGdldG15bWFjaGluZXMoaW50ZXJuYWxfY291Y2hkYiwgYXBwX2lkLCB1c2VybmFtZSkge1xuXG5cbiAgICAvLyByZXR1cm4gYWxsIHVzZXIgY3JlZGVudGlhbHMgZm9yIGl0J3MgbWFjaGluZXMgKGludGVybmFsKVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPEljb21tb25EQltdPihmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGdldHVzZXJkYnMoaW50ZXJuYWxfY291Y2hkYiwgdXNlcm5hbWUpLnRoZW4oZnVuY3Rpb24gKGRvYykge1xuICAgICAgICAgICAgdmFyIGRicyA9IFtdO1xuICAgICAgICAgICAgXy5tYXAoZG9jLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIGlmIChkLmFwcF9pZCA9PSBhcHBfaWQgJiYgZC5kYnR5cGUgPT0gJ21hY2hpbmUnKSB7XG4gICAgICAgICAgICAgICAgICAgIGRicy5wdXNoKGQpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIHJlc29sdmUoZGJzKVxuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJFUlJPUiEhIVwiICsgZXJyKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICB9KVxuICAgIH0pXG59XG5cblxuZnVuY3Rpb24gY3JlYXRlX3NsYXZlX3VzZXJhcHAoaW50ZXJuYWxfY291Y2hkYiwgdXNlcm5hbWUsIHVzZXJhcHBkYikge1xuXG4gICAgLy8gY3JlYXRlIHRoZSB1c2VyIHRoYXQgd2lsbCBoYXZlIGFjY2VzcyB0byBhIGNvbnRhaW5lciAoaW50ZXJuYWwpXG5cbiAgICAvLyByZXR1cm4gdXNlcm5hbWUgYW5kIHBhc3N3b3JkIGZvciB0aGUgdXNlciBjcmVhdGVkIChwYXNzd29yZCBpcyBnZW5lcmF0ZWQgaGVyZSlcblxuXG5cbiAgICByZXR1cm4gbmV3IFByb21pc2U8eyBwYXNzd29yZDogc3RyaW5nOyB1c2VyOiBzdHJpbmcgfT4oZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBsZXQgc2xhdmUgPSByYW5kb21fc2xhdmUodXNlcm5hbWUpO1xuICAgICAgICBycGoucHV0KGludGVybmFsX2NvdWNoZGIubXkoJ191c2Vycy9vcmcuY291Y2hkYi51c2VyOicgKyBzbGF2ZS51c2VyKSwge1xuICAgICAgICAgICAgbmFtZTogc2xhdmUudXNlcixcbiAgICAgICAgICAgIHJvbGVzOiBbJ3NsYXZlJ10sXG4gICAgICAgICAgICBhcHA6IHsgZGI6IHVzZXJhcHBkYiwgdXNlcjogdXNlcm5hbWUgfSxcbiAgICAgICAgICAgIGRidHlwZTogXCJ1c2Vyc2xhdmVcIixcbiAgICAgICAgICAgIHR5cGU6IFwidXNlclwiLFxuICAgICAgICAgICAgcGFzc3dvcmQ6IHNsYXZlLnBhc3N3b3JkXG4gICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmVzb2x2ZShzbGF2ZSlcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgaWYgKGVyci5zdGF0dXNDb2RlICE9IDQwNCkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiRVJST1IhISFcIiArIGVycilcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgfSk7XG4gICAgfSlcbn1cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuZnVuY3Rpb24gc2hhcmVtYWNoKGludGVybmFsX2NvdWNoZGI6IGNvdWNoQWNjZXNzLCBhcHBfaWQsIHVzZXIsIGxhYmVsLCBmcmllbmQpIHsgLy8gY3JlYXRlIG9yIHN1YnNjcmliZSBuZXcgYXBwbGljYXRpb25cblxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPGJvb2xlYW4+KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZ2V0bXltYWNoaW5lKGludGVybmFsX2NvdWNoZGIsIGFwcF9pZCwgdXNlciwgbGFiZWwpLnRoZW4oZnVuY3Rpb24gKG0pIHtcblxuICAgICAgICAgICAgZ2V0dXNlcmFwcChpbnRlcm5hbF9jb3VjaGRiLCBhcHBfaWQsIGZyaWVuZCkudGhlbihmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgICAgICBnZXRteW1hY2hpbmUoaW50ZXJuYWxfY291Y2hkYiwgYXBwX2lkLCBmcmllbmQsIGxhYmVsKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKVxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3ZGI6IEljb21tb25EQiA9IHsgYXBwX2lkOiBhcHBfaWQsIGRibmFtZTogbWFjaGluZWRiLCBzbGF2ZTogeyB1c2VybmFtZTogbWFjaGluZXVzZXIsIHBhc3N3b3JkOiBtYWNoaW5lcGFzc3csIHRva2VuOiBtYWNoaW5ldG9rZW4gfSwgbGFiZWw6IGxhYmVsLCBkYnR5cGU6IFwibWFjaGluZVwiLCByb2xlczogWydzaGFyZWQnXSB9O1xuICAgICAgICAgICAgICAgICAgICBkb2MuZGIucHVzaChuZXdkYilcblxuICAgICAgICAgICAgICAgICAgICBycGoucHV0KGludGVybmFsX2NvdWNoZGIubXkoJ191c2Vycy9vcmcuY291Y2hkYi51c2VyOicgKyBmcmllbmQpLCBkb2MpLnRoZW4oZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBycGouZ2V0KGludGVybmFsX2NvdWNoZGIubXkoJ191c2Vycy9vcmcuY291Y2hkYi51c2VyOicgKyBtYWNoaW5ldXNlciksIGRvYykudGhlbihmdW5jdGlvbiAodXBkYXRlc2xhdmUpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZXNsYXZlLmFwcC51c2Vycy5wdXNoKG5ld3VzZXJuYW1lKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJwai5wdXQoaW50ZXJuYWxfY291Y2hkYi5teSgnX3VzZXJzL29yZy5jb3VjaGRiLnVzZXI6JyArIG1hY2hpbmV1c2VyKSwgdXBkYXRlc2xhdmUpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRydWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIkVSUk9SISEhXCIgKyBlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVyci5zdGF0dXNDb2RlICE9IDQwNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIkVSUk9SISEhXCIgKyBlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIuc3RhdHVzQ29kZSAhPSA0MDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIkVSUk9SISEhXCIgKyBlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiRVJST1IhISFcIiArIGVycilcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgaWYgKGVyci5zdGF0dXNDb2RlICE9IDQwNCkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiRVJST1IhISFcIiArIGVycilcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgfSlcbiAgICB9KVxufVxuXG5cblxuXG5pbnRlcmZhY2UgSUNsYXNzQ29uZiB7XG4gICAgaG9zdG5hbWU6IHN0cmluZztcbiAgICBwcm90b2NvbD86IHN0cmluZztcbiAgICBwb3J0PzogbnVtYmVyO1xuICAgIGRiPzogc3RyaW5nO1xuICAgIHVzZXI6IHN0cmluZztcbiAgICBwYXNzd29yZDogc3RyaW5nO1xufVxuXG5cblxuXG5cblxuXG5jbGFzcyBjb3VjaEFjY2VzcyBleHRlbmRzIGNvdWNoSnNvbkNvbmYge1xuXG4gICAgY29uc3RydWN0b3Iocm9vdGFjY2Vzc2RiOiBJQ2xhc3NDb25mKSB7XG4gICAgICAgIHN1cGVyKHJvb3RhY2Nlc3NkYilcblxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XG5cbiAgICAgICAgZnVuY3Rpb24gYWRkQWRtaW5Sb2xlKCkge1xuICAgICAgICAgICAgdGhhdC5hZGRBcHBSb2xlKHRoYXQudXNlciwgJ21haW4nKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImNyZWF0ZWQhXCIpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImVyclJSUiBcIiArIGVycilcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuXG5cblxuICAgICAgICBycGouZ2V0KHRoYXQubXkoJ2FwcF9tYWluJykpLnRoZW4oZnVuY3Rpb24gKCkge1xuXG5cbiAgICAgICAgICAgIGdldHVzZXJkYih0aGF0LCB0aGF0LnVzZXIpLnRoZW4oKHUpID0+IHtcblxuICAgICAgICAgICAgICAgIGlmICh1LnJvbGVzLmluZGV4T2YoJ2FwcF9tYWluJykgIT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgYWRkQWRtaW5Sb2xlKClcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImNyZWF0ZWQhXCIpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG5cbiAgICAgICAgICAgICAgICB0aGF0LmNyZWF0ZVVzZXIodGhhdC51c2VyLCB0aGF0LnBhc3N3b3JkLCAnJykudGhlbigoKSA9PiB7XG5cblxuICAgICAgICAgICAgICAgICAgICBhZGRBZG1pblJvbGUoKVxuXG5cbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJlcnIgXCIgKyBlcnIpXG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgfSlcblxuXG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcblxuXG4gICAgICAgICAgICB0aGF0LmNyZWF0ZWFwcCgnbWFpbicpLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgZ2V0dXNlcmRiKHRoYXQsIHRoYXQudXNlcikudGhlbigodSkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh1LnJvbGVzLmluZGV4T2YoJ2FwcF9tYWluJykgIT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZEFkbWluUm9sZSgpXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImNyZWF0ZWQhXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhhdC5jcmVhdGVVc2VyKHRoYXQudXNlciwgdGhhdC5wYXNzd29yZCwgJycpLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRBZG1pblJvbGUoKVxuXG5cbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcImVyciBcIiArIGVycilcbiAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgIH0pXG5cblxuXG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG5cblxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJlcnIgXCIgKyBlcnIpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuXG5cbiAgICB9XG5cbiAgICBsb2dpbihvOiB7IHVzZXJuYW1lOiBzdHJpbmcsIHBhc3N3b3JkOiBzdHJpbmcsIGFwcF9pZDogc3RyaW5nIH0pIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXM7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPGJvb2xlYW4+KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblxuICAgICAgICAgICAgaWYgKG8gJiYgby51c2VybmFtZSAmJiBvLnBhc3N3b3JkICYmIG8uYXBwX2lkKSB7XG4gICAgICAgICAgICAgICAgdGVzdGF1dGgodGhhdCwgby51c2VybmFtZSwgby5wYXNzd29yZCwgby5hcHBfaWQpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRydWUpXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCFvKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdCgnbm8gb3B0aW9ucyBwcm92aWRlZCcpXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghby51c2VybmFtZSkge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoJ25vIHVzZXJuYW1lIHByb3ZpZGVkJylcblxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIW8ucGFzc3dvcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KCdubyBwYXNzd29yZCBwcm92aWRlZCcpXG5cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFvLmFwcF9pZCkge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoJ25vIGFwcF9pZCBwcm92aWRlZCcpXG5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICByZWdpc3RlcihvOiB7IHVzZXJuYW1lOiBzdHJpbmcsIHBhc3N3b3JkOiBzdHJpbmcsIGVtYWlsOiBzdHJpbmcsIGFwcF9pZDogc3RyaW5nIH0pOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXM7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPGJvb2xlYW4+KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgIGlmIChvICYmIG8udXNlcm5hbWUgJiYgby5wYXNzd29yZCAmJiBvLmVtYWlsICYmIG8uYXBwX2lkKSB7XG4gICAgICAgICAgICAgICAgdGhhdC5jcmVhdGVVc2VyKG8udXNlcm5hbWUsIG8ucGFzc3dvcmQsIG8uZW1haWwpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGF0LnN1YnNjcmliZWFwcChvLmFwcF9pZCwgby51c2VybmFtZSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRydWUpXG4gICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICghbykge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoJ25vIG9wdGlvbnMgcHJvdmlkZWQnKVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIW8udXNlcm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KCdubyB1c2VybmFtZSBwcm92aWRlZCcpXG5cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFvLnBhc3N3b3JkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdCgnbm8gcGFzc3dvcmQgcHJvdmlkZWQnKVxuXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghby5lbWFpbCkge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoJ25vIGVtYWlsIHByb3ZpZGVkJylcblxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIW8uYXBwX2lkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdCgnbm8gYXBwX2lkIHByb3ZpZGVkJylcblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KVxuXG4gICAgfVxuXG4gICAgY3JlYXRlYXBwZm9ydXNlcihhcHBfaWQsIHVzZXJuYW1lKSB7IC8vIGNyZWF0ZSBhIG5ldyBhcHBsaWNhdGlvblxuXG4gICAgICAgIGNvbnN0IGludGVybmFsX2NvdWNoZGIgPSB0aGlzO1xuXG5cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8Ym9vbGVhbj4oZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXG5cbiAgICAgICAgICAgIGludGVybmFsX2NvdWNoZGIuY3JlYXRlYXBwKGFwcF9pZCkudGhlbihmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgICAgICBpbnRlcm5hbF9jb3VjaGRiLnN1YnNjcmliZWFwcChhcHBfaWQsIHVzZXJuYW1lLCB0cnVlKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKVxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcblxuXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuXG5cbiAgICAgICAgICAgIH0pXG5cblxuXG5cbiAgICAgICAgfSlcbiAgICB9XG5cblxuICAgIGFkZEFwcFJvbGUodXNlcm5hbWU6IHN0cmluZywgYXBwX2lkOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXM7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxib29sZWFuPihmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cbiAgICAgICAgICAgIGdldHVzZXJkYih0aGF0LCB1c2VybmFtZSkudGhlbigodSkgPT4ge1xuICAgICAgICAgICAgICAgIHUucm9sZXMucHVzaCgnYXBwXycgKyBhcHBfaWQpXG5cbiAgICAgICAgICAgICAgICBycGoucHV0KHRoYXQubXkoJ191c2Vycy9vcmcuY291Y2hkYi51c2VyOicgKyB1c2VybmFtZSksIHUpLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodHJ1ZSlcblxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICB9KVxuXG4gICAgICAgIH0pXG5cbiAgICB9XG5cblxuXG4gICAgY3JlYXRlVXNlcih1c2VybmFtZTogc3RyaW5nLCBwYXNzd29yZDogc3RyaW5nLCBlbWFpbDogc3RyaW5nKTogUHJvbWlzZTxJVXNlckRCPiB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8SVVzZXJEQj4oZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXG4gICAgICAgICAgICBnZXR1c2VyZGIodGhhdCwgdXNlcm5hbWUpLnRoZW4oKHUpID0+IHtcbiAgICAgICAgICAgICAgICByZWplY3QoXCJ1c2VyIFwiICsgdXNlcm5hbWUgKyBcIiBqdXN0IGVpeHN0c1wiKVxuXG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBkb2MgPSB7IG5hbWU6IHVzZXJuYW1lLCBlbWFpbDogZW1haWwsIGRiOiBbXSwgXCJyb2xlc1wiOiBbJ3VzZXInXSwgXCJ0eXBlXCI6IFwidXNlclwiLCBwYXNzd29yZDogcGFzc3dvcmQgfTtcblxuICAgICAgICAgICAgICAgIHJwai5wdXQodGhhdC5teSgnX3VzZXJzL29yZy5jb3VjaGRiLnVzZXI6JyArIHVzZXJuYW1lKSwgZG9jKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZ2V0dXNlcmRiKHRoYXQsIHVzZXJuYW1lKS50aGVuKCh1KSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUodSlcblxuICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICB9KVxuXG5cblxuXG4gICAgICAgICAgICB9KVxuXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgdGVzdGxvZ2luKHVzZXIsIHBhc3N3b3JkLCBkYikge1xuXG5cbiAgICAgICAgcmV0dXJuIHRlc3Rsb2dpbih0aGlzLCB1c2VyLCBwYXNzd29yZCwgZGIpO1xuICAgIH1cblxuXG4gICAgdGVzdGFwcF9pZChhcHBfaWQpIHtcblxuXG4gICAgICAgIHJldHVybiB0ZXN0YXBwX2lkKHRoaXMsIGFwcF9pZCk7XG4gICAgfVxuXG5cbiAgICBnZXR1c2VyZGJzKHVzZXJuYW1lKSB7XG5cbiAgICAgICAgcmV0dXJuIGdldHVzZXJkYnModGhpcywgdXNlcm5hbWUpXG4gICAgfVxuXG5cblxuICAgIGdldHVzZXJhcHAodXNlcm5hbWUsIGFwcF9pZCkge1xuXG4gICAgICAgIHJldHVybiBnZXR1c2VyYXBwKHRoaXMsIHVzZXJuYW1lLCBhcHBfaWQpXG4gICAgfVxuXG5cblxuICAgIGdldG15bWFjaGluZShhcHBfaWQsIHVzZXJuYW1lLCBsYWJlbCkge1xuXG4gICAgICAgIHJldHVybiBnZXRteW1hY2hpbmUodGhpcywgYXBwX2lkLCB1c2VybmFtZSwgbGFiZWwpXG4gICAgfVxuXG4gICAgZ2V0bXltYWNoaW5lcyhhcHBfaWQsIHVzZXJuYW1lKSB7XG5cbiAgICAgICAgcmV0dXJuIGdldG15bWFjaGluZXModGhpcywgYXBwX2lkLCB1c2VybmFtZSlcbiAgICB9XG5cblxuICAgIGNyZWF0ZV9zbGF2ZV91c2VyYXBwKHVzZXJuYW1lOiBzdHJpbmcsIHVzZXJkYjogc3RyaW5nKSB7XG5cblxuICAgICAgICByZXR1cm4gY3JlYXRlX3NsYXZlX3VzZXJhcHAodGhpcywgdXNlcm5hbWUsIHVzZXJkYilcbiAgICB9XG5cbiAgICBzdWJzY3JpYmVhcHAoYXBwX2lkOiBzdHJpbmcsIHVzZXJuYW1lOiBzdHJpbmcsIG93bmVyPzogYm9vbGVhbikge1xuXG5cblxuICAgICAgICAvLyBldmVyeSB1c2VyIG11c3QgaGF2ZSBhIHBlcnNvbmFsIGRiIGZvciBldmVyeSBhcHBsaWNhdGlvbiB0aGF0IHRoZXkgaGF2ZSBhY2Nlc3NcbiAgICAgICAgLy8gd2hlbiBhbiB1c2VyIHN1YnNjcmliZSBhbiBhcHAsIGEgZGIgYW5kIGl0J3Mgc2xhdmUgdXNlciAgd2lsbCBiZSBjcmVhdGVkIGZvciBoaW0sIGFuZCB0aGUgdXNlciBkb2MgaW4gX3VzZXJzIHJlZ2lzdGVyIHRoZSBuZXcgY3JlZGVudGlhbHMgZ2VuZXJhdGVkIFxuXG5cblxuXG4gICAgICAgIGNvbnN0IGludGVybmFsX2NvdWNoZGIgPSB0aGlzO1xuXG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPGJvb2xlYW4+KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblxuXG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHN1Yihkb2MpIHtcblxuXG4gICAgICAgICAgICAgICAgdmFyIG5ld3VzZXJkYiA9IGdlbl9kYignbWVtYmVyJywgeyB1c2VybmFtZTogdXNlcm5hbWUsIGFwcF9pZDogYXBwX2lkIH0pO1xuXG4gICAgICAgICAgICAgICAgY3JlYXRlX3NsYXZlX3VzZXJhcHAoaW50ZXJuYWxfY291Y2hkYiwgdXNlcm5hbWUsIG5ld3VzZXJkYikudGhlbihmdW5jdGlvbiAoc2xhdmUpIHtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3ZGIgPSB7IGFwcF9pZDogYXBwX2lkLCBkYm5hbWU6IG5ld3VzZXJkYiwgc2xhdmU6IHsgdXNlcm5hbWU6IHNsYXZlLnVzZXIsIHBhc3N3b3JkOiBzbGF2ZS5wYXNzd29yZCB9LCBkYnR5cGU6IFwibWluZVwiLCByb2xlczogWydvd25lciddIH07XG4gICAgICAgICAgICAgICAgICAgIGRvYy5kYi5wdXNoKG5ld2RiKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAob3duZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvYy5yb2xlcy5wdXNoKCdhcHBfJyArIGFwcF9pZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3RhcnRhcHAgPSB7IGFwcF9pZDogYXBwX2lkLCBkYm5hbWU6ICdhcHBfJyArIGFwcF9pZCwgZGJ0eXBlOiBcImFwcGxpY2F0aW9uXCIsIHJvbGVzOiBbJ293bmVyJ10gfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvYy5kYi5wdXNoKHN0YXJ0YXBwKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJwai5wdXQoaW50ZXJuYWxfY291Y2hkYi5teSgnX3VzZXJzL29yZy5jb3VjaGRiLnVzZXI6JyArIHVzZXJuYW1lKSwgZG9jKS50aGVuKGZ1bmN0aW9uICgpIHsgLy8gcHVzaCBuZXcgdXNlciBzZXR0aW5nc1xuICAgICAgICAgICAgICAgICAgICAgICAgcnBqLnB1dChpbnRlcm5hbF9jb3VjaGRiLm15KG5ld3VzZXJkYiksIGRvYykudGhlbihmdW5jdGlvbiAoKSB7ICAvLyBjcmVhdGUgYW4gZW1wdHkgZGJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBycGoucHV0KGludGVybmFsX2NvdWNoZGIubXkobmV3dXNlcmRiICsgJy9fc2VjdXJpdHknKSwgeyBcIm1lbWJlcnNcIjogeyBcIm5hbWVzXCI6IFt1c2VybmFtZSwgc2xhdmUudXNlcl0sIFwicm9sZXNcIjogW10gfSB9KS50aGVuKGZ1bmN0aW9uICgpIHsgLy8gcHVzaCBzZWN1cml0eSBjaGFuZ2VzIHRvIGFwcCBkYlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRydWUpXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uZmlybURCLnBvc3Qoe2NvbmZpcm06ZmFsc2V9KS50aGVuKGZ1bmN0aW9uKGRvYyl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgLy8gIHJlZ2lzdGVyTWFpbCgnZGFyaW95emZAZ21haWwuY29tJyxkb2MuaWQpOyAvLyBUTyBCRSBBTElWRVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB9KS5jYXRjaChmdW5jdGlvbihlcnIpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIkVSUk9SISEhXCIgKyBlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVyci5zdGF0dXNDb2RlICE9IDQwNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIkVSUk9SISEhXCIgKyBlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIuc3RhdHVzQ29kZSAhPSA0MDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIkVSUk9SISEhXCIgKyBlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIkVSUk9SISEhXCIgKyBlcnIpXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG5cblxuXG5cbiAgICAgICAgICAgIGdldHVzZXJkYihpbnRlcm5hbF9jb3VjaGRiLCB1c2VybmFtZSkudGhlbihmdW5jdGlvbiAoZG9jKSB7XG5cbiAgICAgICAgICAgICAgICB0ZXN0YXBwX2lkKGludGVybmFsX2NvdWNoZGIsIGFwcF9pZCkudGhlbihmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgc3ViKGRvYylcblxuXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuXG5cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG5cblxuICAgIH1cblxuICAgIGNyZWF0ZWFwcChhcHBfaWQpIHtcbiAgICAgICAgY29uc3QgaW50ZXJuYWxfY291Y2hkYiA9IHRoaXM7XG5cbiAgICAgICAgLy8gY3JlYXRlIGFuIGFwcGxpY2F0aW9uIChpbXBlcmF0aXZlKVxuICAgICAgICAvLyByZXR1cm4gdHJ1ZSBvbmx5XG5cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8Ym9vbGVhbj4oZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXG4gICAgICAgICAgICBycGoucHV0KGludGVybmFsX2NvdWNoZGIubXkoJ2FwcF8nICsgYXBwX2lkKSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcnBqLnB1dChpbnRlcm5hbF9jb3VjaGRiLm15KCdhcHBfJyArIGFwcF9pZCArICcvX2Rlc2lnbi9hdXRoJyksIHtcbiAgICAgICAgICAgICAgICAgICAgXCJsYW5ndWFnZVwiOiBcImphdmFzY3JpcHRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ2YWxpZGF0ZV9kb2NfdXBkYXRlXCI6IFwiZnVuY3Rpb24obixvLHUpe2lmKG4uX2lkJiYhbi5faWQuaW5kZXhPZihcXFwiX2xvY2FsL1xcXCIpKXJldHVybjtpZighdXx8IXUucm9sZXN8fCh1LnJvbGVzLmluZGV4T2YoXFxcImFwcF9cIiArIGFwcF9pZCArIFwiXFxcIik9PS0xJiZ1LnJvbGVzLmluZGV4T2YoXFxcIl9hZG1pblxcXCIpPT0tMSkpe3Rocm93KHtmb3JiaWRkZW46J0RlbmllZC4nfSl9fVwiXG4gICAgICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodHJ1ZSlcbiAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIuc3RhdHVzQ29kZSAhPSA0MDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiRVJST1IhISFcIiArIGVycilcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiRVJST1IhISFcIiArIGVycilcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgfSlcblxuICAgICAgICB9KVxuICAgIH1cblxuXG5cblxuXG4gICAgc2hhcmVtYWNoKGFwcF9pZCwgdXNlciwgbGFiZWwsIGZyaWVuZCkgeyAvLyBjcmVhdGUgb3Igc3Vic2NyaWJlIG5ldyBhcHBsaWNhdGlvblxuXG5cblxuICAgICAgICByZXR1cm4gc2hhcmVtYWNoKHRoaXMsIGFwcF9pZCwgdXNlciwgbGFiZWwsIGZyaWVuZClcbiAgICB9XG5cblxuXG5cblxuXG59XG5cblxuZnVuY3Rpb24gZ2VuX2RiKGtpbmQsIGRhdGEpOiBzdHJpbmcge1xuICAgIHN3aXRjaCAoa2luZCkge1xuICAgICAgICBjYXNlICdtZW1iZXInOlxuICAgICAgICAgICAgcmV0dXJuICdtZW1fJyArIHVpZCgzKSArICdfJyArIGRhdGEuYXBwX2lkICsgJ18nICsgZGF0YS51c2VybmFtZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdtYWNoaW5lJzpcbiAgICAgICAgICAgIHJldHVybiAnbWFjaF8nICsgdWlkKDYpICsgJ18nICsgZGF0YS5hcHBfaWQ7XG4gICAgICAgICAgICBicmVhaztcblxuICAgIH1cbn1cbmZ1bmN0aW9uIHJhbmRvbV9zbGF2ZSh1c2VybmFtZSk6IHsgcGFzc3dvcmQ6IHN0cmluZzsgdXNlcjogc3RyaW5nIH0ge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcGFzc3dvcmQ6IHVpZCgxMiksXG4gICAgICAgIHVzZXI6ICdzbF8nICsgdXNlcm5hbWUgKyAnXycgKyB1aWQoNilcbiAgICB9XG5cbn1cblxuXG5leHBvcnQgZGVmYXVsdCBjb3VjaEFjY2Vzc1xuIl19
