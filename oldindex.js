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
            if (err.statusCode !== 404) {
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
            if (err.statusCode !== 404) {
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
    });
}
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
function getuserdbs(internal_couchdb, username) {
    return new Promise(function (resolve, reject) {
        getuserdb(internal_couchdb, username).then(function (doc) {
            resolve(doc.db);
        }).catch(function (err) {
            if (err.statusCode !== 404) {
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
                if (d.app_id === app_id && d.dbtype === 'mine') {
                    resolve(d);
                }
            });
        }).catch(function (err) {
            if (err.statusCode !== 404) {
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
                if (d.app_id === app_id && d.dbtype === 'machine' && d.label === label) {
                    resolve(d);
                }
            });
        }).catch(function (err) {
            if (err.statusCode !== 404) {
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
                if (d.app_id === app_id && d.dbtype === 'machine') {
                    dbs.push(d);
                }
            });
            resolve(dbs);
        }).catch(function (err) {
            if (err.statusCode !== 404) {
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
            if (err.statusCode !== 404) {
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
            that.createapp('main').then(function () {
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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SSxDQUFDLE1BQU0sR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQTtRQUNwRSxLQUFLLFNBQVM7WUFDVixNQUFNLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQTtJQUVuRCxDQUFDO0FBQ0wsQ0FBQztBQUNELHNCQUFzQixRQUFRO0lBRTFCLE1BQU0sQ0FBQztRQUNILFFBQVEsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDO1FBQ2pCLElBQUksRUFBRSxLQUFLLEdBQUcsUUFBUSxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO0tBQ3hDLENBQUE7QUFFTCxDQUFDO0FBR0Qsa0JBQWUsV0FBVyxDQUFBIiwiZmlsZSI6Im9sZGluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUHJvbWlzZSBmcm9tIFwiYmx1ZWJpcmRcIlxuaW1wb3J0ICogYXMgXyBmcm9tIFwibG9kYXNoXCJcblxuaW1wb3J0IGNvdWNoSnNvbkNvbmYgZnJvbSBcImNvdWNoanNvbmNvbmZcIlxuXG5pbXBvcnQge0lDbGFzc0NvbmYsSVVzZXJEQixJY29tbW9uREJ9IGZyb20gXCIuL2ludGVyZmFjZVwiXG5cbmNvbnN0IHVpZCA9IHJlcXVpcmUoXCJ1aWRcIilcbmNvbnN0IHJwaiA9IHJlcXVpcmUoXCJyZXF1ZXN0LXByb21pc2UtanNvblwiKVxuXG5cblxuXG5cblxuXG5cbmZ1bmN0aW9uIHRlc3Rsb2dpbihpbnRlcm5hbF9jb3VjaGRiLCB1c2VyLCBwYXNzd29yZCwgZGIpIHtcblxuICAgIC8vIHJldHVybiB0cnVlIGlmIGNyZWRlbnRpYWxzIGFyZSBjb3JyZWN0IGZvciBnaXZlbiBkYlxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPGJvb2xlYW4+KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblxuICAgICAgICBycGouZ2V0KGludGVybmFsX2NvdWNoZGIuZm9yKHVzZXIsIHBhc3N3b3JkLCBkYikpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKVxuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT09IDQwNCkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiRVJST1IhISFcIiArIGVycilcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgfSlcbiAgICB9KVxuXG59XG5cblxuZnVuY3Rpb24gdGVzdGFwcF9pZChpbnRlcm5hbF9jb3VjaGRiLCBhcHBfaWQpIHtcblxuXG4gICAgLy8gcmV0dXJuIHRydWUgaWYgYXBwX2lkIGV4aXN0XG5cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZTxib29sZWFuPihmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIHJwai5nZXQoaW50ZXJuYWxfY291Y2hkYi5teSgnYXBwXycgKyBhcHBfaWQpKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJlc29sdmUodHJ1ZSlcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuXG4gICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT09IDQwNCkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiRVJST1IhISFcIiArIGVycilcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgfSlcbiAgICB9KVxufVxuXG5cblxuXG5cblxuZnVuY3Rpb24gdGVzdGF1dGgoaW50ZXJuYWxfY291Y2hkYiwgdXNlciwgcGFzc3dvcmQsIGFwcF9pZCkge1xuXG5cbiAgICAvLyByZXR1cm4gdHJ1ZSBpZiBjcmVkZW50aWFscyBhcmUgY29ycmVjdCBmb3IgZ2l2ZW4gYXBwX2lkXG5cbiAgICAvLyBnZXQgdXNlciBjcmVkZW50aWFscyBieSB1c2VybmFtZSBhbmQgcGFzc3dvcmQgYW5kIHRha2UgdGhlIGFwcF9pZCBkYiwgdGhlbiB0ZXN0IGxvZ2luIHdpdGggaXRcblxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZ2V0dXNlcmFwcChpbnRlcm5hbF9jb3VjaGRiLCB1c2VyLCBhcHBfaWQpLnRoZW4oZnVuY3Rpb24gKGRiOmFueSkge1xuXG4gICAgICAgICAgICB0ZXN0bG9naW4oaW50ZXJuYWxfY291Y2hkYiwgdXNlciwgcGFzc3dvcmQsIGRiLmRibmFtZSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKVxuICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGlmIChlcnIuc3RhdHVzQ29kZSAhPT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiRVJST1IhISFcIiArIGVycilcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgaWYgKGVyci5zdGF0dXNDb2RlICE9PSA0MDQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIkVSUk9SISEhXCIgKyBlcnIpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgIH0pXG5cbiAgICB9KVxuXG59XG5cblxuXG5cblxuZnVuY3Rpb24gZ2V0dXNlcmRiKGludGVybmFsX2NvdWNoZGIsIHVzZXJuYW1lKSB7XG5cbiAgICAvLyByZXR1cm4gYWxsIHRoZSB1c2VyIGRvYyBpbiBfdXNlcnNcblxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPElVc2VyREI+KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgcnBqLmdldChpbnRlcm5hbF9jb3VjaGRiLm15KCdfdXNlcnMvb3JnLmNvdWNoZGIudXNlcjonICsgdXNlcm5hbWUpKS50aGVuKGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgICAgICAgIHJlc29sdmUoZG9jKVxuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT09IDQwNCkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiRVJST1IhISFcIiArIGVycilcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgfSlcbiAgICB9KVxufVxuXG5cbmZ1bmN0aW9uIGdldHVzZXJkYnMoaW50ZXJuYWxfY291Y2hkYiwgdXNlcm5hbWUpIHtcblxuICAgIC8vIHJldHVybiBhbGwgdGhlIHVzZXIgY3JlZGVudGlhbHMgZm9yIGV2ZXJ5IGFwcGxpY2F0aW9uIHdoaWNoIHRoZXkgaGF2ZSBhY2Nlc3MgKGludGVybmFsKVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPEljb21tb25EQltdPihmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGdldHVzZXJkYihpbnRlcm5hbF9jb3VjaGRiLCB1c2VybmFtZSkudGhlbihmdW5jdGlvbiAoZG9jKSB7XG4gICAgICAgICAgICByZXNvbHZlKGRvYy5kYilcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgaWYgKGVyci5zdGF0dXNDb2RlICE9PSA0MDQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIkVSUk9SISEhXCIgKyBlcnIpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgIH0pXG4gICAgfSlcbn1cblxuXG5cbmZ1bmN0aW9uIGdldHVzZXJhcHAoaW50ZXJuYWxfY291Y2hkYiwgdXNlcm5hbWUsIGFwcF9pZCkge1xuXG5cbiAgICAvLyByZXR1cm4gdXNlciBjcmVkZW50aWFscyAoaW50ZXJuYWwpXG5cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZTxJY29tbW9uREI+KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZ2V0dXNlcmRicyhpbnRlcm5hbF9jb3VjaGRiLCB1c2VybmFtZSkudGhlbihmdW5jdGlvbiAoZG9jKSB7XG4gICAgICAgICAgICBfLm1hcChkb2MsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgaWYgKGQuYXBwX2lkID09PSBhcHBfaWQgJiYgZC5kYnR5cGUgPT09ICdtaW5lJykge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGQpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgaWYgKGVyci5zdGF0dXNDb2RlICE9PSA0MDQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIkVSUk9SISEhXCIgKyBlcnIpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgIH0pXG4gICAgfSlcbn1cblxuXG5cbmZ1bmN0aW9uIGdldG15bWFjaGluZShpbnRlcm5hbF9jb3VjaGRiLCBhcHBfaWQsIHVzZXJuYW1lLCBsYWJlbCkge1xuXG5cbiAgICAvLyByZXR1cm4gY3JlZGVudGlhbHMgYnkgYXBwbGljYXRpb24gYW5kIGxhYmVsICAoaW50ZXJuYWwpXG5cbiAgICByZXR1cm4gbmV3IFByb21pc2U8SWNvbW1vbkRCPihmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGdldHVzZXJkYnMoaW50ZXJuYWxfY291Y2hkYiwgdXNlcm5hbWUpLnRoZW4oZnVuY3Rpb24gKGRvYykge1xuICAgICAgICAgICAgXy5tYXAoZG9jLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIGlmIChkLmFwcF9pZCA9PT0gYXBwX2lkICYmIGQuZGJ0eXBlID09PSAnbWFjaGluZScgJiYgZC5sYWJlbCA9PT0gbGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShkKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGlmIChlcnIuc3RhdHVzQ29kZSAhPT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJFUlJPUiEhIVwiICsgZXJyKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICB9KVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIGdldG15bWFjaGluZXMoaW50ZXJuYWxfY291Y2hkYiwgYXBwX2lkLCB1c2VybmFtZSkge1xuXG5cbiAgICAvLyByZXR1cm4gYWxsIHVzZXIgY3JlZGVudGlhbHMgZm9yIGl0J3MgbWFjaGluZXMgKGludGVybmFsKVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPEljb21tb25EQltdPihmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGdldHVzZXJkYnMoaW50ZXJuYWxfY291Y2hkYiwgdXNlcm5hbWUpLnRoZW4oZnVuY3Rpb24gKGRvYykge1xuICAgICAgICAgICAgdmFyIGRicyA9IFtdXG4gICAgICAgICAgICBfLm1hcChkb2MsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgaWYgKGQuYXBwX2lkID09PSBhcHBfaWQgJiYgZC5kYnR5cGUgPT09ICdtYWNoaW5lJykge1xuICAgICAgICAgICAgICAgICAgICBkYnMucHVzaChkKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICByZXNvbHZlKGRicylcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgaWYgKGVyci5zdGF0dXNDb2RlICE9PSA0MDQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIkVSUk9SISEhXCIgKyBlcnIpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgIH0pXG4gICAgfSlcbn1cblxuXG5mdW5jdGlvbiBjcmVhdGVfc2xhdmVfdXNlcmFwcChpbnRlcm5hbF9jb3VjaGRiLCB1c2VybmFtZSwgdXNlcmFwcGRiKSB7XG5cbiAgICAvLyBjcmVhdGUgdGhlIHVzZXIgdGhhdCB3aWxsIGhhdmUgYWNjZXNzIHRvIGEgY29udGFpbmVyIChpbnRlcm5hbClcblxuICAgIC8vIHJldHVybiB1c2VybmFtZSBhbmQgcGFzc3dvcmQgZm9yIHRoZSB1c2VyIGNyZWF0ZWQgKHBhc3N3b3JkIGlzIGdlbmVyYXRlZCBoZXJlKVxuXG5cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZTx7IHBhc3N3b3JkOiBzdHJpbmc7IHVzZXI6IHN0cmluZyB9PihmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGxldCBzbGF2ZSA9IHJhbmRvbV9zbGF2ZSh1c2VybmFtZSlcbiAgICAgICAgcnBqLnB1dChpbnRlcm5hbF9jb3VjaGRiLm15KCdfdXNlcnMvb3JnLmNvdWNoZGIudXNlcjonICsgc2xhdmUudXNlciksIHtcbiAgICAgICAgICAgIG5hbWU6IHNsYXZlLnVzZXIsXG4gICAgICAgICAgICByb2xlczogWydzbGF2ZSddLFxuICAgICAgICAgICAgYXBwOiB7IGRiOiB1c2VyYXBwZGIsIHVzZXI6IHVzZXJuYW1lIH0sXG4gICAgICAgICAgICBkYnR5cGU6IFwidXNlcnNsYXZlXCIsXG4gICAgICAgICAgICB0eXBlOiBcInVzZXJcIixcbiAgICAgICAgICAgIHBhc3N3b3JkOiBzbGF2ZS5wYXNzd29yZFxuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJlc29sdmUoc2xhdmUpXG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGlmIChlcnIuc3RhdHVzQ29kZSAhPT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJFUlJPUiEhIVwiICsgZXJyKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICB9KVxuICAgIH0pXG59XG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cbmZ1bmN0aW9uIHNoYXJlbWFjaChpbnRlcm5hbF9jb3VjaGRiOiBjb3VjaEFjY2VzcywgYXBwX2lkLCB1c2VyLCBsYWJlbCwgZnJpZW5kKSB7IC8vIGNyZWF0ZSBvciBzdWJzY3JpYmUgbmV3IGFwcGxpY2F0aW9uXG5cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZTxib29sZWFuPihmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGdldG15bWFjaGluZShpbnRlcm5hbF9jb3VjaGRiLCBhcHBfaWQsIHVzZXIsIGxhYmVsKS50aGVuKGZ1bmN0aW9uIChtKSB7XG5cbiAgICAgICAgICAgIGdldHVzZXJhcHAoaW50ZXJuYWxfY291Y2hkYiwgYXBwX2lkLCBmcmllbmQpLnRoZW4oZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICAgICAgZ2V0bXltYWNoaW5lKGludGVybmFsX2NvdWNoZGIsIGFwcF9pZCwgZnJpZW5kLCBsYWJlbCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodHJ1ZSlcbiAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld2RiOiBJY29tbW9uREIgPSB7IGFwcF9pZDogYXBwX2lkLCBkYm5hbWU6IG1hY2hpbmVkYiwgc2xhdmU6IHsgdXNlcm5hbWU6IG1hY2hpbmV1c2VyLCBwYXNzd29yZDogbWFjaGluZXBhc3N3LCB0b2tlbjogbWFjaGluZXRva2VuIH0sIGxhYmVsOiBsYWJlbCwgZGJ0eXBlOiBcIm1hY2hpbmVcIiwgcm9sZXM6IFsnc2hhcmVkJ10gfVxuICAgICAgICAgICAgICAgICAgICBkb2MuZGIucHVzaChuZXdkYilcblxuICAgICAgICAgICAgICAgICAgICBycGoucHV0KGludGVybmFsX2NvdWNoZGIubXkoJ191c2Vycy9vcmcuY291Y2hkYi51c2VyOicgKyBmcmllbmQpLCBkb2MpLnRoZW4oZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBycGouZ2V0KGludGVybmFsX2NvdWNoZGIubXkoJ191c2Vycy9vcmcuY291Y2hkYi51c2VyOicgKyBtYWNoaW5ldXNlciksIGRvYykudGhlbihmdW5jdGlvbiAodXBkYXRlc2xhdmUpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZXNsYXZlLmFwcC51c2Vycy5wdXNoKG5ld3VzZXJuYW1lKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcnBqLnB1dChpbnRlcm5hbF9jb3VjaGRiLm15KCdfdXNlcnMvb3JnLmNvdWNoZGIudXNlcjonICsgbWFjaGluZXVzZXIpLCB1cGRhdGVzbGF2ZSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUodHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIuc3RhdHVzQ29kZSAhPT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIkVSUk9SISEhXCIgKyBlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVyci5zdGF0dXNDb2RlICE9PSA0MDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJFUlJPUiEhIVwiICsgZXJyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT09IDQwNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiRVJST1IhISFcIiArIGVycilcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGlmIChlcnIuc3RhdHVzQ29kZSAhPT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiRVJST1IhISFcIiArIGVycilcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgaWYgKGVyci5zdGF0dXNDb2RlICE9PSA0MDQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIkVSUk9SISEhXCIgKyBlcnIpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgIH0pXG4gICAgfSlcbn1cblxuXG5cblxuXG5cblxuXG5jbGFzcyBjb3VjaEFjY2VzcyBleHRlbmRzIGNvdWNoSnNvbkNvbmYge1xuXG4gICAgY29uc3RydWN0b3Iocm9vdGFjY2Vzc2RiOiBJQ2xhc3NDb25mKSB7XG4gICAgICAgIHN1cGVyKHJvb3RhY2Nlc3NkYilcblxuICAgICAgICBsZXQgdGhhdCA9IHRoaXNcblxuICAgICAgICBmdW5jdGlvbiBhZGRBZG1pblJvbGUoKSB7XG4gICAgICAgICAgICB0aGF0LmFkZEFwcFJvbGUodGhhdC51c2VyLCAnbWFpbicpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiY3JlYXRlZCFcIilcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyUlJSIFwiICsgZXJyKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuXG5cblxuXG4gICAgICAgIHJwai5nZXQodGhhdC5teSgnYXBwX21haW4nKSkudGhlbihmdW5jdGlvbiAoKSB7XG5cblxuICAgICAgICAgICAgZ2V0dXNlcmRiKHRoYXQsIHRoYXQudXNlcikudGhlbigodSkgPT4ge1xuXG4gICAgICAgICAgICAgICAgaWYgKHUucm9sZXMuaW5kZXhPZignYXBwX21haW4nKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgYWRkQWRtaW5Sb2xlKClcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImNyZWF0ZWQhXCIpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG5cbiAgICAgICAgICAgICAgICB0aGF0LmNyZWF0ZVVzZXIodGhhdC51c2VyLCB0aGF0LnBhc3N3b3JkLCAnJykudGhlbigoKSA9PiB7XG5cblxuICAgICAgICAgICAgICAgICAgICBhZGRBZG1pblJvbGUoKVxuXG5cbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJlcnIgXCIgKyBlcnIpXG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgfSlcblxuXG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcblxuXG4gICAgICAgICAgICB0aGF0LmNyZWF0ZWFwcCgnbWFpbicpLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgZ2V0dXNlcmRiKHRoYXQsIHRoYXQudXNlcikudGhlbigodSkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh1LnJvbGVzLmluZGV4T2YoJ2FwcF9tYWluJykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRBZG1pblJvbGUoKVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJjcmVhdGVkIVwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuY3JlYXRlVXNlcih0aGF0LnVzZXIsIHRoYXQucGFzc3dvcmQsICcnKS50aGVuKCgpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgYWRkQWRtaW5Sb2xlKClcblxuXG4gICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJlcnIgXCIgKyBlcnIpXG4gICAgICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICB9KVxuXG5cblxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuXG5cbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiZXJyIFwiICsgZXJyKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcblxuXG4gICAgfVxuXG4gICAgbG9naW4obzogeyB1c2VybmFtZTogc3RyaW5nLCBwYXNzd29yZDogc3RyaW5nLCBhcHBfaWQ6IHN0cmluZyB9KSB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzXG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPGJvb2xlYW4+KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblxuICAgICAgICAgICAgaWYgKG8gJiYgby51c2VybmFtZSAmJiBvLnBhc3N3b3JkICYmIG8uYXBwX2lkKSB7XG4gICAgICAgICAgICAgICAgdGVzdGF1dGgodGhhdCwgby51c2VybmFtZSwgby5wYXNzd29yZCwgby5hcHBfaWQpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRydWUpXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCFvKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdCgnbm8gb3B0aW9ucyBwcm92aWRlZCcpXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghby51c2VybmFtZSkge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoJ25vIHVzZXJuYW1lIHByb3ZpZGVkJylcblxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIW8ucGFzc3dvcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KCdubyBwYXNzd29yZCBwcm92aWRlZCcpXG5cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFvLmFwcF9pZCkge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoJ25vIGFwcF9pZCBwcm92aWRlZCcpXG5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICByZWdpc3RlcihvOiB7IHVzZXJuYW1lOiBzdHJpbmcsIHBhc3N3b3JkOiBzdHJpbmcsIGVtYWlsOiBzdHJpbmcsIGFwcF9pZDogc3RyaW5nIH0pOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXNcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8Ym9vbGVhbj4oZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgaWYgKG8gJiYgby51c2VybmFtZSAmJiBvLnBhc3N3b3JkICYmIG8uZW1haWwgJiYgby5hcHBfaWQpIHtcbiAgICAgICAgICAgICAgICB0aGF0LmNyZWF0ZVVzZXIoby51c2VybmFtZSwgby5wYXNzd29yZCwgby5lbWFpbCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuc3Vic2NyaWJlYXBwKG8uYXBwX2lkLCBvLnVzZXJuYW1lKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUodHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCFvKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdCgnbm8gb3B0aW9ucyBwcm92aWRlZCcpXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghby51c2VybmFtZSkge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoJ25vIHVzZXJuYW1lIHByb3ZpZGVkJylcblxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIW8ucGFzc3dvcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KCdubyBwYXNzd29yZCBwcm92aWRlZCcpXG5cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFvLmVtYWlsKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdCgnbm8gZW1haWwgcHJvdmlkZWQnKVxuXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghby5hcHBfaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KCdubyBhcHBfaWQgcHJvdmlkZWQnKVxuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pXG5cbiAgICB9XG5cbiAgICBjcmVhdGVhcHBmb3J1c2VyKGFwcF9pZCwgdXNlcm5hbWUpIHsgLy8gY3JlYXRlIGEgbmV3IGFwcGxpY2F0aW9uXG5cbiAgICAgICAgY29uc3QgaW50ZXJuYWxfY291Y2hkYiA9IHRoaXNcblxuXG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPGJvb2xlYW4+KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblxuXG4gICAgICAgICAgICBpbnRlcm5hbF9jb3VjaGRiLmNyZWF0ZWFwcChhcHBfaWQpLnRoZW4oZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICAgICAgaW50ZXJuYWxfY291Y2hkYi5zdWJzY3JpYmVhcHAoYXBwX2lkLCB1c2VybmFtZSwgdHJ1ZSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodHJ1ZSlcbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG5cblxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycilcblxuXG4gICAgICAgICAgICB9KVxuXG5cblxuXG4gICAgICAgIH0pXG4gICAgfVxuXG5cbiAgICBhZGRBcHBSb2xlKHVzZXJuYW1lOiBzdHJpbmcsIGFwcF9pZDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxib29sZWFuPihmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cbiAgICAgICAgICAgIGdldHVzZXJkYih0aGF0LCB1c2VybmFtZSkudGhlbigodSkgPT4ge1xuICAgICAgICAgICAgICAgIHUucm9sZXMucHVzaCgnYXBwXycgKyBhcHBfaWQpXG5cbiAgICAgICAgICAgICAgICBycGoucHV0KHRoYXQubXkoJ191c2Vycy9vcmcuY291Y2hkYi51c2VyOicgKyB1c2VybmFtZSksIHUpLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodHJ1ZSlcblxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICB9KVxuXG4gICAgICAgIH0pXG5cbiAgICB9XG5cblxuXG4gICAgY3JlYXRlVXNlcih1c2VybmFtZTogc3RyaW5nLCBwYXNzd29yZDogc3RyaW5nLCBlbWFpbDogc3RyaW5nKTogUHJvbWlzZTxJVXNlckRCPiB7XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxJVXNlckRCPihmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cbiAgICAgICAgICAgIGdldHVzZXJkYih0aGF0LCB1c2VybmFtZSkudGhlbigodSkgPT4ge1xuICAgICAgICAgICAgICAgIHJlamVjdChcInVzZXIgXCIgKyB1c2VybmFtZSArIFwiIGp1c3QgZWl4c3RzXCIpXG5cbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGRvYyA9IHsgbmFtZTogdXNlcm5hbWUsIGVtYWlsOiBlbWFpbCwgZGI6IFtdLCBcInJvbGVzXCI6IFsndXNlciddLCBcInR5cGVcIjogXCJ1c2VyXCIsIHBhc3N3b3JkOiBwYXNzd29yZCB9XG5cbiAgICAgICAgICAgICAgICBycGoucHV0KHRoYXQubXkoJ191c2Vycy9vcmcuY291Y2hkYi51c2VyOicgKyB1c2VybmFtZSksIGRvYykudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGdldHVzZXJkYih0aGF0LCB1c2VybmFtZSkudGhlbigodSkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHUpXG5cbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgfSlcblxuXG5cblxuICAgICAgICAgICAgfSlcblxuICAgICAgICB9KVxuICAgIH1cblxuICAgIHRlc3Rsb2dpbih1c2VyLCBwYXNzd29yZCwgZGIpIHtcblxuXG4gICAgICAgIHJldHVybiB0ZXN0bG9naW4odGhpcywgdXNlciwgcGFzc3dvcmQsIGRiKVxuICAgIH1cblxuXG4gICAgdGVzdGFwcF9pZChhcHBfaWQpIHtcblxuXG4gICAgICAgIHJldHVybiB0ZXN0YXBwX2lkKHRoaXMsIGFwcF9pZClcbiAgICB9XG5cblxuICAgIGdldHVzZXJkYnModXNlcm5hbWUpIHtcblxuICAgICAgICByZXR1cm4gZ2V0dXNlcmRicyh0aGlzLCB1c2VybmFtZSlcbiAgICB9XG5cblxuXG4gICAgZ2V0dXNlcmFwcCh1c2VybmFtZSwgYXBwX2lkKSB7XG5cbiAgICAgICAgcmV0dXJuIGdldHVzZXJhcHAodGhpcywgdXNlcm5hbWUsIGFwcF9pZClcbiAgICB9XG5cblxuXG4gICAgZ2V0bXltYWNoaW5lKGFwcF9pZCwgdXNlcm5hbWUsIGxhYmVsKSB7XG5cbiAgICAgICAgcmV0dXJuIGdldG15bWFjaGluZSh0aGlzLCBhcHBfaWQsIHVzZXJuYW1lLCBsYWJlbClcbiAgICB9XG5cbiAgICBnZXRteW1hY2hpbmVzKGFwcF9pZCwgdXNlcm5hbWUpIHtcblxuICAgICAgICByZXR1cm4gZ2V0bXltYWNoaW5lcyh0aGlzLCBhcHBfaWQsIHVzZXJuYW1lKVxuICAgIH1cblxuXG4gICAgY3JlYXRlX3NsYXZlX3VzZXJhcHAodXNlcm5hbWU6IHN0cmluZywgdXNlcmRiOiBzdHJpbmcpIHtcblxuXG4gICAgICAgIHJldHVybiBjcmVhdGVfc2xhdmVfdXNlcmFwcCh0aGlzLCB1c2VybmFtZSwgdXNlcmRiKVxuICAgIH1cblxuICAgIHN1YnNjcmliZWFwcChhcHBfaWQ6IHN0cmluZywgdXNlcm5hbWU6IHN0cmluZywgb3duZXI/OiBib29sZWFuKSB7XG5cblxuXG4gICAgICAgIC8vIGV2ZXJ5IHVzZXIgbXVzdCBoYXZlIGEgcGVyc29uYWwgZGIgZm9yIGV2ZXJ5IGFwcGxpY2F0aW9uIHRoYXQgdGhleSBoYXZlIGFjY2Vzc1xuICAgICAgICAvLyB3aGVuIGFuIHVzZXIgc3Vic2NyaWJlIGFuIGFwcCwgYSBkYiBhbmQgaXQncyBzbGF2ZSB1c2VyICB3aWxsIGJlIGNyZWF0ZWQgZm9yIGhpbSwgYW5kIHRoZSB1c2VyIGRvYyBpbiBfdXNlcnMgcmVnaXN0ZXIgdGhlIG5ldyBjcmVkZW50aWFscyBnZW5lcmF0ZWQgXG5cblxuXG5cbiAgICAgICAgY29uc3QgaW50ZXJuYWxfY291Y2hkYiA9IHRoaXNcblxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxib29sZWFuPihmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cblxuXG4gICAgICAgICAgICBmdW5jdGlvbiBzdWIoZG9jKSB7XG5cblxuICAgICAgICAgICAgICAgIHZhciBuZXd1c2VyZGIgPSBnZW5fZGIoJ21lbWJlcicsIHsgdXNlcm5hbWU6IHVzZXJuYW1lLCBhcHBfaWQ6IGFwcF9pZCB9KVxuXG4gICAgICAgICAgICAgICAgY3JlYXRlX3NsYXZlX3VzZXJhcHAoaW50ZXJuYWxfY291Y2hkYiwgdXNlcm5hbWUsIG5ld3VzZXJkYikudGhlbihmdW5jdGlvbiAoc2xhdmUpIHtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3ZGIgPSB7IGFwcF9pZDogYXBwX2lkLCBkYm5hbWU6IG5ld3VzZXJkYiwgc2xhdmU6IHsgdXNlcm5hbWU6IHNsYXZlLnVzZXIsIHBhc3N3b3JkOiBzbGF2ZS5wYXNzd29yZCB9LCBkYnR5cGU6IFwibWluZVwiLCByb2xlczogWydvd25lciddIH1cbiAgICAgICAgICAgICAgICAgICAgZG9jLmRiLnB1c2gobmV3ZGIpXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG93bmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb2Mucm9sZXMucHVzaCgnYXBwXycgKyBhcHBfaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3RhcnRhcHAgPSB7IGFwcF9pZDogYXBwX2lkLCBkYm5hbWU6ICdhcHBfJyArIGFwcF9pZCwgZGJ0eXBlOiBcImFwcGxpY2F0aW9uXCIsIHJvbGVzOiBbJ293bmVyJ10gfVxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jLmRiLnB1c2goc3RhcnRhcHApXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBycGoucHV0KGludGVybmFsX2NvdWNoZGIubXkoJ191c2Vycy9vcmcuY291Y2hkYi51c2VyOicgKyB1c2VybmFtZSksIGRvYykudGhlbihmdW5jdGlvbiAoKSB7IC8vIHB1c2ggbmV3IHVzZXIgc2V0dGluZ3NcbiAgICAgICAgICAgICAgICAgICAgICAgIHJwai5wdXQoaW50ZXJuYWxfY291Y2hkYi5teShuZXd1c2VyZGIpLCBkb2MpLnRoZW4oZnVuY3Rpb24gKCkgeyAgLy8gY3JlYXRlIGFuIGVtcHR5IGRiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcnBqLnB1dChpbnRlcm5hbF9jb3VjaGRiLm15KG5ld3VzZXJkYiArICcvX3NlY3VyaXR5JyksIHsgXCJtZW1iZXJzXCI6IHsgXCJuYW1lc1wiOiBbdXNlcm5hbWUsIHNsYXZlLnVzZXJdLCBcInJvbGVzXCI6IFtdIH0gfSkudGhlbihmdW5jdGlvbiAoKSB7IC8vIHB1c2ggc2VjdXJpdHkgY2hhbmdlcyB0byBhcHAgZGJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbmZpcm1EQi5wb3N0KHtjb25maXJtOmZhbHNlfSkudGhlbihmdW5jdGlvbihkb2Mpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgIC8vICByZWdpc3Rlck1haWwoJ2RhcmlveXpmQGdtYWlsLmNvbScsZG9jLmlkKSAvLyBUTyBCRSBBTElWRVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB9KS5jYXRjaChmdW5jdGlvbihlcnIpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIH0pXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIuc3RhdHVzQ29kZSAhPT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIkVSUk9SISEhXCIgKyBlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVyci5zdGF0dXNDb2RlICE9PSA0MDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJFUlJPUiEhIVwiICsgZXJyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT09IDQwNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiRVJST1IhISFcIiArIGVycilcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIuc3RhdHVzQ29kZSAhPT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIkVSUk9SISEhXCIgKyBlcnIpXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG5cblxuXG5cbiAgICAgICAgICAgIGdldHVzZXJkYihpbnRlcm5hbF9jb3VjaGRiLCB1c2VybmFtZSkudGhlbihmdW5jdGlvbiAoZG9jKSB7XG5cbiAgICAgICAgICAgICAgICB0ZXN0YXBwX2lkKGludGVybmFsX2NvdWNoZGIsIGFwcF9pZCkudGhlbihmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgc3ViKGRvYylcblxuXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuXG5cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG5cblxuICAgIH1cblxuICAgIGNyZWF0ZWFwcChhcHBfaWQpIHtcbiAgICAgICAgY29uc3QgaW50ZXJuYWxfY291Y2hkYiA9IHRoaXNcblxuICAgICAgICAvLyBjcmVhdGUgYW4gYXBwbGljYXRpb24gKGltcGVyYXRpdmUpXG4gICAgICAgIC8vIHJldHVybiB0cnVlIG9ubHlcblxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxib29sZWFuPihmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cbiAgICAgICAgICAgIHJwai5wdXQoaW50ZXJuYWxfY291Y2hkYi5teSgnYXBwXycgKyBhcHBfaWQpKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBycGoucHV0KGludGVybmFsX2NvdWNoZGIubXkoJ2FwcF8nICsgYXBwX2lkICsgJy9fZGVzaWduL2F1dGgnKSwge1xuICAgICAgICAgICAgICAgICAgICBcImxhbmd1YWdlXCI6IFwiamF2YXNjcmlwdFwiLFxuICAgICAgICAgICAgICAgICAgICBcInZhbGlkYXRlX2RvY191cGRhdGVcIjogXCJmdW5jdGlvbihuLG8sdSl7aWYobi5faWQmJiFuLl9pZC5pbmRleE9mKFxcXCJfbG9jYWwvXFxcIikpcmV0dXJuO2lmKCF1fHwhdS5yb2xlc3x8KHUucm9sZXMuaW5kZXhPZihcXFwiYXBwX1wiICsgYXBwX2lkICsgXCJcXFwiKT09LTEmJnUucm9sZXMuaW5kZXhPZihcXFwiX2FkbWluXFxcIik9PS0xKSl7dGhyb3coe2ZvcmJpZGRlbjonRGVuaWVkLid9KX19XCJcbiAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKVxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVyci5zdGF0dXNDb2RlICE9PSA0MDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiRVJST1IhISFcIiArIGVycilcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT09IDQwNCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIkVSUk9SISEhXCIgKyBlcnIpXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgfSlcbiAgICB9XG5cblxuXG5cblxuICAgIHNoYXJlbWFjaChhcHBfaWQsIHVzZXIsIGxhYmVsLCBmcmllbmQpIHsgLy8gY3JlYXRlIG9yIHN1YnNjcmliZSBuZXcgYXBwbGljYXRpb25cblxuXG5cbiAgICAgICAgcmV0dXJuIHNoYXJlbWFjaCh0aGlzLCBhcHBfaWQsIHVzZXIsIGxhYmVsLCBmcmllbmQpXG4gICAgfVxuXG5cblxuXG5cblxufVxuXG5cbmZ1bmN0aW9uIGdlbl9kYihraW5kLCBkYXRhKTogc3RyaW5nIHtcbiAgICBzd2l0Y2ggKGtpbmQpIHtcbiAgICAgICAgY2FzZSAnbWVtYmVyJzpcbiAgICAgICAgICAgIHJldHVybiAnbWVtXycgKyB1aWQoMykgKyAnXycgKyBkYXRhLmFwcF9pZCArICdfJyArIGRhdGEudXNlcm5hbWVcbiAgICAgICAgY2FzZSAnbWFjaGluZSc6XG4gICAgICAgICAgICByZXR1cm4gJ21hY2hfJyArIHVpZCg2KSArICdfJyArIGRhdGEuYXBwX2lkXG5cbiAgICB9XG59XG5mdW5jdGlvbiByYW5kb21fc2xhdmUodXNlcm5hbWUpOiB7IHBhc3N3b3JkOiBzdHJpbmc7IHVzZXI6IHN0cmluZyB9IHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHBhc3N3b3JkOiB1aWQoMTIpLFxuICAgICAgICB1c2VyOiAnc2xfJyArIHVzZXJuYW1lICsgJ18nICsgdWlkKDYpXG4gICAgfVxuXG59XG5cblxuZXhwb3J0IGRlZmF1bHQgY291Y2hBY2Nlc3NcbiJdfQ==
