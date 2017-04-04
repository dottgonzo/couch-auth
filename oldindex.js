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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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SSxDQUFDLE1BQU0sR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQTtRQUNwRSxLQUFLLFNBQVM7WUFDVixNQUFNLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQTtJQUVuRCxDQUFDO0FBQ0wsQ0FBQztBQUNELHNCQUFzQixRQUFRO0lBRTFCLE1BQU0sQ0FBQztRQUNILFFBQVEsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDO1FBQ2pCLElBQUksRUFBRSxLQUFLLEdBQUcsUUFBUSxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO0tBQ3hDLENBQUE7QUFFTCxDQUFDO0FBR0Qsa0JBQWUsV0FBVyxDQUFBIiwiZmlsZSI6Im9sZGluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUHJvbWlzZSBmcm9tIFwiYmx1ZWJpcmRcIlxuaW1wb3J0ICogYXMgXyBmcm9tIFwibG9kYXNoXCJcblxuaW1wb3J0IGNvdWNoSnNvbkNvbmYgZnJvbSBcImNvdWNoanNvbmNvbmZcIlxuXG5pbXBvcnQge0lDbGFzc0NvbmYsSVVzZXJEQixJY29tbW9uREJ9IGZyb20gXCIuL2ludGVyZmFjZVwiXG5cbmNvbnN0IHVpZCA9IHJlcXVpcmUoXCJ1aWRcIilcbmNvbnN0IHJwaiA9IHJlcXVpcmUoXCJyZXF1ZXN0LXByb21pc2UtanNvblwiKVxuXG5cblxuXG5cblxuXG5cbmZ1bmN0aW9uIHRlc3Rsb2dpbihpbnRlcm5hbF9jb3VjaGRiLCB1c2VyLCBwYXNzd29yZCwgZGIpIHtcblxuICAgIC8vIHJldHVybiB0cnVlIGlmIGNyZWRlbnRpYWxzIGFyZSBjb3JyZWN0IGZvciBnaXZlbiBkYlxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPGJvb2xlYW4+KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblxuICAgICAgICBycGouZ2V0KGludGVybmFsX2NvdWNoZGIuZm9yKHVzZXIsIHBhc3N3b3JkLCBkYikpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKVxuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT09IDQwNCkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiRVJST1IhISFcIiArIGVycilcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgfSlcbiAgICB9KVxuXG59XG5cblxuZnVuY3Rpb24gdGVzdGFwcF9pZChpbnRlcm5hbF9jb3VjaGRiLCBhcHBfaWQpIHtcblxuXG4gICAgLy8gcmV0dXJuIHRydWUgaWYgYXBwX2lkIGV4aXN0XG5cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZTxib29sZWFuPihmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIHJwai5nZXQoaW50ZXJuYWxfY291Y2hkYi5teSgnYXBwXycgKyBhcHBfaWQpKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJlc29sdmUodHJ1ZSlcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuXG4gICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT09IDQwNCkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiRVJST1IhISFcIiArIGVycilcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgfSlcbiAgICB9KVxufVxuXG5cblxuXG5cblxuZnVuY3Rpb24gdGVzdGF1dGgoaW50ZXJuYWxfY291Y2hkYiwgdXNlciwgcGFzc3dvcmQsIGFwcF9pZCkge1xuXG5cbiAgICAvLyByZXR1cm4gdHJ1ZSBpZiBjcmVkZW50aWFscyBhcmUgY29ycmVjdCBmb3IgZ2l2ZW4gYXBwX2lkXG5cbiAgICAvLyBnZXQgdXNlciBjcmVkZW50aWFscyBieSB1c2VybmFtZSBhbmQgcGFzc3dvcmQgYW5kIHRha2UgdGhlIGFwcF9pZCBkYiwgdGhlbiB0ZXN0IGxvZ2luIHdpdGggaXRcblxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZ2V0dXNlcmFwcChpbnRlcm5hbF9jb3VjaGRiLCB1c2VyLCBhcHBfaWQpLnRoZW4oZnVuY3Rpb24gKGRiKSB7XG5cbiAgICAgICAgICAgIHRlc3Rsb2dpbihpbnRlcm5hbF9jb3VjaGRiLCB1c2VyLCBwYXNzd29yZCwgZGIuZGJuYW1lKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHRydWUpXG4gICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVyci5zdGF0dXNDb2RlICE9PSA0MDQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJFUlJPUiEhIVwiICsgZXJyKVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT09IDQwNCkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiRVJST1IhISFcIiArIGVycilcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgfSlcblxuICAgIH0pXG5cbn1cblxuXG5cblxuXG5mdW5jdGlvbiBnZXR1c2VyZGIoaW50ZXJuYWxfY291Y2hkYiwgdXNlcm5hbWUpIHtcblxuICAgIC8vIHJldHVybiBhbGwgdGhlIHVzZXIgZG9jIGluIF91c2Vyc1xuXG5cbiAgICByZXR1cm4gbmV3IFByb21pc2U8SVVzZXJEQj4oZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBycGouZ2V0KGludGVybmFsX2NvdWNoZGIubXkoJ191c2Vycy9vcmcuY291Y2hkYi51c2VyOicgKyB1c2VybmFtZSkpLnRoZW4oZnVuY3Rpb24gKGRvYykge1xuICAgICAgICAgICAgcmVzb2x2ZShkb2MpXG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGlmIChlcnIuc3RhdHVzQ29kZSAhPT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJFUlJPUiEhIVwiICsgZXJyKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICB9KVxuICAgIH0pXG59XG5cblxuZnVuY3Rpb24gZ2V0dXNlcmRicyhpbnRlcm5hbF9jb3VjaGRiLCB1c2VybmFtZSkge1xuXG4gICAgLy8gcmV0dXJuIGFsbCB0aGUgdXNlciBjcmVkZW50aWFscyBmb3IgZXZlcnkgYXBwbGljYXRpb24gd2hpY2ggdGhleSBoYXZlIGFjY2VzcyAoaW50ZXJuYWwpXG5cbiAgICByZXR1cm4gbmV3IFByb21pc2U8SWNvbW1vbkRCW10+KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZ2V0dXNlcmRiKGludGVybmFsX2NvdWNoZGIsIHVzZXJuYW1lKS50aGVuKGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgICAgICAgIHJlc29sdmUoZG9jLmRiKVxuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT09IDQwNCkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiRVJST1IhISFcIiArIGVycilcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgfSlcbiAgICB9KVxufVxuXG5cblxuZnVuY3Rpb24gZ2V0dXNlcmFwcChpbnRlcm5hbF9jb3VjaGRiLCB1c2VybmFtZSwgYXBwX2lkKSB7XG5cblxuICAgIC8vIHJldHVybiB1c2VyIGNyZWRlbnRpYWxzIChpbnRlcm5hbClcblxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPEljb21tb25EQj4oZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBnZXR1c2VyZGJzKGludGVybmFsX2NvdWNoZGIsIHVzZXJuYW1lKS50aGVuKGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgICAgICAgIF8ubWFwKGRvYywgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZC5hcHBfaWQgPT09IGFwcF9pZCAmJiBkLmRidHlwZSA9PT0gJ21pbmUnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT09IDQwNCkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiRVJST1IhISFcIiArIGVycilcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgfSlcbiAgICB9KVxufVxuXG5cblxuZnVuY3Rpb24gZ2V0bXltYWNoaW5lKGludGVybmFsX2NvdWNoZGIsIGFwcF9pZCwgdXNlcm5hbWUsIGxhYmVsKSB7XG5cblxuICAgIC8vIHJldHVybiBjcmVkZW50aWFscyBieSBhcHBsaWNhdGlvbiBhbmQgbGFiZWwgIChpbnRlcm5hbClcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZTxJY29tbW9uREI+KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZ2V0dXNlcmRicyhpbnRlcm5hbF9jb3VjaGRiLCB1c2VybmFtZSkudGhlbihmdW5jdGlvbiAoZG9jKSB7XG4gICAgICAgICAgICBfLm1hcChkb2MsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgaWYgKGQuYXBwX2lkID09PSBhcHBfaWQgJiYgZC5kYnR5cGUgPT09ICdtYWNoaW5lJyAmJiBkLmxhYmVsID09PSBsYWJlbCkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGQpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgaWYgKGVyci5zdGF0dXNDb2RlICE9PSA0MDQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIkVSUk9SISEhXCIgKyBlcnIpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgIH0pXG4gICAgfSlcbn1cblxuZnVuY3Rpb24gZ2V0bXltYWNoaW5lcyhpbnRlcm5hbF9jb3VjaGRiLCBhcHBfaWQsIHVzZXJuYW1lKSB7XG5cblxuICAgIC8vIHJldHVybiBhbGwgdXNlciBjcmVkZW50aWFscyBmb3IgaXQncyBtYWNoaW5lcyAoaW50ZXJuYWwpXG5cbiAgICByZXR1cm4gbmV3IFByb21pc2U8SWNvbW1vbkRCW10+KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZ2V0dXNlcmRicyhpbnRlcm5hbF9jb3VjaGRiLCB1c2VybmFtZSkudGhlbihmdW5jdGlvbiAoZG9jKSB7XG4gICAgICAgICAgICB2YXIgZGJzID0gW11cbiAgICAgICAgICAgIF8ubWFwKGRvYywgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZC5hcHBfaWQgPT09IGFwcF9pZCAmJiBkLmRidHlwZSA9PT0gJ21hY2hpbmUnKSB7XG4gICAgICAgICAgICAgICAgICAgIGRicy5wdXNoKGQpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIHJlc29sdmUoZGJzKVxuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT09IDQwNCkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiRVJST1IhISFcIiArIGVycilcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgfSlcbiAgICB9KVxufVxuXG5cbmZ1bmN0aW9uIGNyZWF0ZV9zbGF2ZV91c2VyYXBwKGludGVybmFsX2NvdWNoZGIsIHVzZXJuYW1lLCB1c2VyYXBwZGIpIHtcblxuICAgIC8vIGNyZWF0ZSB0aGUgdXNlciB0aGF0IHdpbGwgaGF2ZSBhY2Nlc3MgdG8gYSBjb250YWluZXIgKGludGVybmFsKVxuXG4gICAgLy8gcmV0dXJuIHVzZXJuYW1lIGFuZCBwYXNzd29yZCBmb3IgdGhlIHVzZXIgY3JlYXRlZCAocGFzc3dvcmQgaXMgZ2VuZXJhdGVkIGhlcmUpXG5cblxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPHsgcGFzc3dvcmQ6IHN0cmluZzsgdXNlcjogc3RyaW5nIH0+KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgbGV0IHNsYXZlID0gcmFuZG9tX3NsYXZlKHVzZXJuYW1lKVxuICAgICAgICBycGoucHV0KGludGVybmFsX2NvdWNoZGIubXkoJ191c2Vycy9vcmcuY291Y2hkYi51c2VyOicgKyBzbGF2ZS51c2VyKSwge1xuICAgICAgICAgICAgbmFtZTogc2xhdmUudXNlcixcbiAgICAgICAgICAgIHJvbGVzOiBbJ3NsYXZlJ10sXG4gICAgICAgICAgICBhcHA6IHsgZGI6IHVzZXJhcHBkYiwgdXNlcjogdXNlcm5hbWUgfSxcbiAgICAgICAgICAgIGRidHlwZTogXCJ1c2Vyc2xhdmVcIixcbiAgICAgICAgICAgIHR5cGU6IFwidXNlclwiLFxuICAgICAgICAgICAgcGFzc3dvcmQ6IHNsYXZlLnBhc3N3b3JkXG4gICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmVzb2x2ZShzbGF2ZSlcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgaWYgKGVyci5zdGF0dXNDb2RlICE9PSA0MDQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIkVSUk9SISEhXCIgKyBlcnIpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgIH0pXG4gICAgfSlcbn1cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuZnVuY3Rpb24gc2hhcmVtYWNoKGludGVybmFsX2NvdWNoZGI6IGNvdWNoQWNjZXNzLCBhcHBfaWQsIHVzZXIsIGxhYmVsLCBmcmllbmQpIHsgLy8gY3JlYXRlIG9yIHN1YnNjcmliZSBuZXcgYXBwbGljYXRpb25cblxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPGJvb2xlYW4+KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZ2V0bXltYWNoaW5lKGludGVybmFsX2NvdWNoZGIsIGFwcF9pZCwgdXNlciwgbGFiZWwpLnRoZW4oZnVuY3Rpb24gKG0pIHtcblxuICAgICAgICAgICAgZ2V0dXNlcmFwcChpbnRlcm5hbF9jb3VjaGRiLCBhcHBfaWQsIGZyaWVuZCkudGhlbihmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgICAgICBnZXRteW1hY2hpbmUoaW50ZXJuYWxfY291Y2hkYiwgYXBwX2lkLCBmcmllbmQsIGxhYmVsKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKVxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3ZGI6IEljb21tb25EQiA9IHsgYXBwX2lkOiBhcHBfaWQsIGRibmFtZTogbWFjaGluZWRiLCBzbGF2ZTogeyB1c2VybmFtZTogbWFjaGluZXVzZXIsIHBhc3N3b3JkOiBtYWNoaW5lcGFzc3csIHRva2VuOiBtYWNoaW5ldG9rZW4gfSwgbGFiZWw6IGxhYmVsLCBkYnR5cGU6IFwibWFjaGluZVwiLCByb2xlczogWydzaGFyZWQnXSB9XG4gICAgICAgICAgICAgICAgICAgIGRvYy5kYi5wdXNoKG5ld2RiKVxuXG4gICAgICAgICAgICAgICAgICAgIHJwai5wdXQoaW50ZXJuYWxfY291Y2hkYi5teSgnX3VzZXJzL29yZy5jb3VjaGRiLnVzZXI6JyArIGZyaWVuZCksIGRvYykudGhlbihmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJwai5nZXQoaW50ZXJuYWxfY291Y2hkYi5teSgnX3VzZXJzL29yZy5jb3VjaGRiLnVzZXI6JyArIG1hY2hpbmV1c2VyKSwgZG9jKS50aGVuKGZ1bmN0aW9uICh1cGRhdGVzbGF2ZSkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlc2xhdmUuYXBwLnVzZXJzLnB1c2gobmV3dXNlcm5hbWUpXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBycGoucHV0KGludGVybmFsX2NvdWNoZGIubXkoJ191c2Vycy9vcmcuY291Y2hkYi51c2VyOicgKyBtYWNoaW5ldXNlciksIHVwZGF0ZXNsYXZlKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVyci5zdGF0dXNDb2RlICE9PSA0MDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiRVJST1IhISFcIiArIGVycilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT09IDQwNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIkVSUk9SISEhXCIgKyBlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIuc3RhdHVzQ29kZSAhPT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJFUlJPUiEhIVwiICsgZXJyKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVyci5zdGF0dXNDb2RlICE9PSA0MDQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJFUlJPUiEhIVwiICsgZXJyKVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT09IDQwNCkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiRVJST1IhISFcIiArIGVycilcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgfSlcbiAgICB9KVxufVxuXG5cblxuXG5cblxuXG5cbmNsYXNzIGNvdWNoQWNjZXNzIGV4dGVuZHMgY291Y2hKc29uQ29uZiB7XG5cbiAgICBjb25zdHJ1Y3Rvcihyb290YWNjZXNzZGI6IElDbGFzc0NvbmYpIHtcbiAgICAgICAgc3VwZXIocm9vdGFjY2Vzc2RiKVxuXG4gICAgICAgIGxldCB0aGF0ID0gdGhpc1xuXG4gICAgICAgIGZ1bmN0aW9uIGFkZEFkbWluUm9sZSgpIHtcbiAgICAgICAgICAgIHRoYXQuYWRkQXBwUm9sZSh0aGF0LnVzZXIsICdtYWluJykudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJjcmVhdGVkIVwiKVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJlcnJSUlIgXCIgKyBlcnIpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cblxuXG5cbiAgICAgICAgcnBqLmdldCh0aGF0Lm15KCdhcHBfbWFpbicpKS50aGVuKGZ1bmN0aW9uICgpIHtcblxuXG4gICAgICAgICAgICBnZXR1c2VyZGIodGhhdCwgdGhhdC51c2VyKS50aGVuKCh1KSA9PiB7XG5cbiAgICAgICAgICAgICAgICBpZiAodS5yb2xlcy5pbmRleE9mKCdhcHBfbWFpbicpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBhZGRBZG1pblJvbGUoKVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiY3JlYXRlZCFcIilcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcblxuICAgICAgICAgICAgICAgIHRoYXQuY3JlYXRlVXNlcih0aGF0LnVzZXIsIHRoYXQucGFzc3dvcmQsICcnKS50aGVuKCgpID0+IHtcblxuXG4gICAgICAgICAgICAgICAgICAgIGFkZEFkbWluUm9sZSgpXG5cblxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcImVyciBcIiArIGVycilcbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICB9KVxuXG5cbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuXG5cbiAgICAgICAgICAgIHRoYXQuY3JlYXRlYXBwKCdtYWluJykudGhlbigoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICBnZXR1c2VyZGIodGhhdCwgdGhhdC51c2VyKS50aGVuKCh1KSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHUucm9sZXMuaW5kZXhPZignYXBwX21haW4nKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZEFkbWluUm9sZSgpXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImNyZWF0ZWQhXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhhdC5jcmVhdGVVc2VyKHRoYXQudXNlciwgdGhhdC5wYXNzd29yZCwgJycpLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRBZG1pblJvbGUoKVxuXG5cbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcImVyciBcIiArIGVycilcbiAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgIH0pXG5cblxuXG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG5cblxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJlcnIgXCIgKyBlcnIpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuXG5cbiAgICB9XG5cbiAgICBsb2dpbihvOiB7IHVzZXJuYW1lOiBzdHJpbmcsIHBhc3N3b3JkOiBzdHJpbmcsIGFwcF9pZDogc3RyaW5nIH0pIHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXNcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8Ym9vbGVhbj4oZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXG4gICAgICAgICAgICBpZiAobyAmJiBvLnVzZXJuYW1lICYmIG8ucGFzc3dvcmQgJiYgby5hcHBfaWQpIHtcbiAgICAgICAgICAgICAgICB0ZXN0YXV0aCh0aGF0LCBvLnVzZXJuYW1lLCBvLnBhc3N3b3JkLCBvLmFwcF9pZCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodHJ1ZSlcbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoIW8pIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KCdubyBvcHRpb25zIHByb3ZpZGVkJylcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFvLnVzZXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdCgnbm8gdXNlcm5hbWUgcHJvdmlkZWQnKVxuXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghby5wYXNzd29yZCkge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoJ25vIHBhc3N3b3JkIHByb3ZpZGVkJylcblxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIW8uYXBwX2lkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdCgnbm8gYXBwX2lkIHByb3ZpZGVkJylcblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KVxuICAgIH1cblxuICAgIHJlZ2lzdGVyKG86IHsgdXNlcm5hbWU6IHN0cmluZywgcGFzc3dvcmQ6IHN0cmluZywgZW1haWw6IHN0cmluZywgYXBwX2lkOiBzdHJpbmcgfSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBjb25zdCB0aGF0ID0gdGhpc1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxib29sZWFuPihmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICBpZiAobyAmJiBvLnVzZXJuYW1lICYmIG8ucGFzc3dvcmQgJiYgby5lbWFpbCAmJiBvLmFwcF9pZCkge1xuICAgICAgICAgICAgICAgIHRoYXQuY3JlYXRlVXNlcihvLnVzZXJuYW1lLCBvLnBhc3N3b3JkLCBvLmVtYWlsKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5zdWJzY3JpYmVhcHAoby5hcHBfaWQsIG8udXNlcm5hbWUpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKVxuICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoIW8pIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KCdubyBvcHRpb25zIHByb3ZpZGVkJylcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFvLnVzZXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdCgnbm8gdXNlcm5hbWUgcHJvdmlkZWQnKVxuXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghby5wYXNzd29yZCkge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoJ25vIHBhc3N3b3JkIHByb3ZpZGVkJylcblxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIW8uZW1haWwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KCdubyBlbWFpbCBwcm92aWRlZCcpXG5cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFvLmFwcF9pZCkge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoJ25vIGFwcF9pZCBwcm92aWRlZCcpXG5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSlcblxuICAgIH1cblxuICAgIGNyZWF0ZWFwcGZvcnVzZXIoYXBwX2lkLCB1c2VybmFtZSkgeyAvLyBjcmVhdGUgYSBuZXcgYXBwbGljYXRpb25cblxuICAgICAgICBjb25zdCBpbnRlcm5hbF9jb3VjaGRiID0gdGhpc1xuXG5cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8Ym9vbGVhbj4oZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXG5cbiAgICAgICAgICAgIGludGVybmFsX2NvdWNoZGIuY3JlYXRlYXBwKGFwcF9pZCkudGhlbihmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgICAgICBpbnRlcm5hbF9jb3VjaGRiLnN1YnNjcmliZWFwcChhcHBfaWQsIHVzZXJuYW1lLCB0cnVlKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKVxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcblxuXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuXG5cbiAgICAgICAgICAgIH0pXG5cblxuXG5cbiAgICAgICAgfSlcbiAgICB9XG5cblxuICAgIGFkZEFwcFJvbGUodXNlcm5hbWU6IHN0cmluZywgYXBwX2lkOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXNcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPGJvb2xlYW4+KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblxuICAgICAgICAgICAgZ2V0dXNlcmRiKHRoYXQsIHVzZXJuYW1lKS50aGVuKCh1KSA9PiB7XG4gICAgICAgICAgICAgICAgdS5yb2xlcy5wdXNoKCdhcHBfJyArIGFwcF9pZClcblxuICAgICAgICAgICAgICAgIHJwai5wdXQodGhhdC5teSgnX3VzZXJzL29yZy5jb3VjaGRiLnVzZXI6JyArIHVzZXJuYW1lKSwgdSkudGhlbigoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKVxuXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgfSlcblxuICAgIH1cblxuXG5cbiAgICBjcmVhdGVVc2VyKHVzZXJuYW1lOiBzdHJpbmcsIHBhc3N3b3JkOiBzdHJpbmcsIGVtYWlsOiBzdHJpbmcpOiBQcm9taXNlPElVc2VyREI+IHtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXNcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPElVc2VyREI+KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblxuICAgICAgICAgICAgZ2V0dXNlcmRiKHRoYXQsIHVzZXJuYW1lKS50aGVuKCh1KSA9PiB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KFwidXNlciBcIiArIHVzZXJuYW1lICsgXCIganVzdCBlaXhzdHNcIilcblxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuXG4gICAgICAgICAgICAgICAgY29uc3QgZG9jID0geyBuYW1lOiB1c2VybmFtZSwgZW1haWw6IGVtYWlsLCBkYjogW10sIFwicm9sZXNcIjogWyd1c2VyJ10sIFwidHlwZVwiOiBcInVzZXJcIiwgcGFzc3dvcmQ6IHBhc3N3b3JkIH1cblxuICAgICAgICAgICAgICAgIHJwai5wdXQodGhhdC5teSgnX3VzZXJzL29yZy5jb3VjaGRiLnVzZXI6JyArIHVzZXJuYW1lKSwgZG9jKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZ2V0dXNlcmRiKHRoYXQsIHVzZXJuYW1lKS50aGVuKCh1KSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUodSlcblxuICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICB9KVxuXG5cblxuXG4gICAgICAgICAgICB9KVxuXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgdGVzdGxvZ2luKHVzZXIsIHBhc3N3b3JkLCBkYikge1xuXG5cbiAgICAgICAgcmV0dXJuIHRlc3Rsb2dpbih0aGlzLCB1c2VyLCBwYXNzd29yZCwgZGIpXG4gICAgfVxuXG5cbiAgICB0ZXN0YXBwX2lkKGFwcF9pZCkge1xuXG5cbiAgICAgICAgcmV0dXJuIHRlc3RhcHBfaWQodGhpcywgYXBwX2lkKVxuICAgIH1cblxuXG4gICAgZ2V0dXNlcmRicyh1c2VybmFtZSkge1xuXG4gICAgICAgIHJldHVybiBnZXR1c2VyZGJzKHRoaXMsIHVzZXJuYW1lKVxuICAgIH1cblxuXG5cbiAgICBnZXR1c2VyYXBwKHVzZXJuYW1lLCBhcHBfaWQpIHtcblxuICAgICAgICByZXR1cm4gZ2V0dXNlcmFwcCh0aGlzLCB1c2VybmFtZSwgYXBwX2lkKVxuICAgIH1cblxuXG5cbiAgICBnZXRteW1hY2hpbmUoYXBwX2lkLCB1c2VybmFtZSwgbGFiZWwpIHtcblxuICAgICAgICByZXR1cm4gZ2V0bXltYWNoaW5lKHRoaXMsIGFwcF9pZCwgdXNlcm5hbWUsIGxhYmVsKVxuICAgIH1cblxuICAgIGdldG15bWFjaGluZXMoYXBwX2lkLCB1c2VybmFtZSkge1xuXG4gICAgICAgIHJldHVybiBnZXRteW1hY2hpbmVzKHRoaXMsIGFwcF9pZCwgdXNlcm5hbWUpXG4gICAgfVxuXG5cbiAgICBjcmVhdGVfc2xhdmVfdXNlcmFwcCh1c2VybmFtZTogc3RyaW5nLCB1c2VyZGI6IHN0cmluZykge1xuXG5cbiAgICAgICAgcmV0dXJuIGNyZWF0ZV9zbGF2ZV91c2VyYXBwKHRoaXMsIHVzZXJuYW1lLCB1c2VyZGIpXG4gICAgfVxuXG4gICAgc3Vic2NyaWJlYXBwKGFwcF9pZDogc3RyaW5nLCB1c2VybmFtZTogc3RyaW5nLCBvd25lcj86IGJvb2xlYW4pIHtcblxuXG5cbiAgICAgICAgLy8gZXZlcnkgdXNlciBtdXN0IGhhdmUgYSBwZXJzb25hbCBkYiBmb3IgZXZlcnkgYXBwbGljYXRpb24gdGhhdCB0aGV5IGhhdmUgYWNjZXNzXG4gICAgICAgIC8vIHdoZW4gYW4gdXNlciBzdWJzY3JpYmUgYW4gYXBwLCBhIGRiIGFuZCBpdCdzIHNsYXZlIHVzZXIgIHdpbGwgYmUgY3JlYXRlZCBmb3IgaGltLCBhbmQgdGhlIHVzZXIgZG9jIGluIF91c2VycyByZWdpc3RlciB0aGUgbmV3IGNyZWRlbnRpYWxzIGdlbmVyYXRlZCBcblxuXG5cblxuICAgICAgICBjb25zdCBpbnRlcm5hbF9jb3VjaGRiID0gdGhpc1xuXG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPGJvb2xlYW4+KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblxuXG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHN1Yihkb2MpIHtcblxuXG4gICAgICAgICAgICAgICAgdmFyIG5ld3VzZXJkYiA9IGdlbl9kYignbWVtYmVyJywgeyB1c2VybmFtZTogdXNlcm5hbWUsIGFwcF9pZDogYXBwX2lkIH0pXG5cbiAgICAgICAgICAgICAgICBjcmVhdGVfc2xhdmVfdXNlcmFwcChpbnRlcm5hbF9jb3VjaGRiLCB1c2VybmFtZSwgbmV3dXNlcmRiKS50aGVuKGZ1bmN0aW9uIChzbGF2ZSkge1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdkYiA9IHsgYXBwX2lkOiBhcHBfaWQsIGRibmFtZTogbmV3dXNlcmRiLCBzbGF2ZTogeyB1c2VybmFtZTogc2xhdmUudXNlciwgcGFzc3dvcmQ6IHNsYXZlLnBhc3N3b3JkIH0sIGRidHlwZTogXCJtaW5lXCIsIHJvbGVzOiBbJ293bmVyJ10gfVxuICAgICAgICAgICAgICAgICAgICBkb2MuZGIucHVzaChuZXdkYilcblxuICAgICAgICAgICAgICAgICAgICBpZiAob3duZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvYy5yb2xlcy5wdXNoKCdhcHBfJyArIGFwcF9pZClcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzdGFydGFwcCA9IHsgYXBwX2lkOiBhcHBfaWQsIGRibmFtZTogJ2FwcF8nICsgYXBwX2lkLCBkYnR5cGU6IFwiYXBwbGljYXRpb25cIiwgcm9sZXM6IFsnb3duZXInXSB9XG4gICAgICAgICAgICAgICAgICAgICAgICBkb2MuZGIucHVzaChzdGFydGFwcClcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJwai5wdXQoaW50ZXJuYWxfY291Y2hkYi5teSgnX3VzZXJzL29yZy5jb3VjaGRiLnVzZXI6JyArIHVzZXJuYW1lKSwgZG9jKS50aGVuKGZ1bmN0aW9uICgpIHsgLy8gcHVzaCBuZXcgdXNlciBzZXR0aW5nc1xuICAgICAgICAgICAgICAgICAgICAgICAgcnBqLnB1dChpbnRlcm5hbF9jb3VjaGRiLm15KG5ld3VzZXJkYiksIGRvYykudGhlbihmdW5jdGlvbiAoKSB7ICAvLyBjcmVhdGUgYW4gZW1wdHkgZGJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBycGoucHV0KGludGVybmFsX2NvdWNoZGIubXkobmV3dXNlcmRiICsgJy9fc2VjdXJpdHknKSwgeyBcIm1lbWJlcnNcIjogeyBcIm5hbWVzXCI6IFt1c2VybmFtZSwgc2xhdmUudXNlcl0sIFwicm9sZXNcIjogW10gfSB9KS50aGVuKGZ1bmN0aW9uICgpIHsgLy8gcHVzaCBzZWN1cml0eSBjaGFuZ2VzIHRvIGFwcCBkYlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRydWUpXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uZmlybURCLnBvc3Qoe2NvbmZpcm06ZmFsc2V9KS50aGVuKGZ1bmN0aW9uKGRvYyl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgLy8gIHJlZ2lzdGVyTWFpbCgnZGFyaW95emZAZ21haWwuY29tJyxkb2MuaWQpIC8vIFRPIEJFIEFMSVZFXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIH0pLmNhdGNoKGZ1bmN0aW9uKGVycil7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gfSlcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVyci5zdGF0dXNDb2RlICE9PSA0MDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiRVJST1IhISFcIiArIGVycilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT09IDQwNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIkVSUk9SISEhXCIgKyBlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIuc3RhdHVzQ29kZSAhPT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJFUlJPUiEhIVwiICsgZXJyKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVyci5zdGF0dXNDb2RlICE9PSA0MDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiRVJST1IhISFcIiArIGVycilcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cblxuXG5cblxuICAgICAgICAgICAgZ2V0dXNlcmRiKGludGVybmFsX2NvdWNoZGIsIHVzZXJuYW1lKS50aGVuKGZ1bmN0aW9uIChkb2MpIHtcblxuICAgICAgICAgICAgICAgIHRlc3RhcHBfaWQoaW50ZXJuYWxfY291Y2hkYiwgYXBwX2lkKS50aGVuKGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgICAgICAgICBzdWIoZG9jKVxuXG5cbiAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG5cblxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcblxuXG4gICAgfVxuXG4gICAgY3JlYXRlYXBwKGFwcF9pZCkge1xuICAgICAgICBjb25zdCBpbnRlcm5hbF9jb3VjaGRiID0gdGhpc1xuXG4gICAgICAgIC8vIGNyZWF0ZSBhbiBhcHBsaWNhdGlvbiAoaW1wZXJhdGl2ZSlcbiAgICAgICAgLy8gcmV0dXJuIHRydWUgb25seVxuXG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPGJvb2xlYW4+KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblxuICAgICAgICAgICAgcnBqLnB1dChpbnRlcm5hbF9jb3VjaGRiLm15KCdhcHBfJyArIGFwcF9pZCkpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJwai5wdXQoaW50ZXJuYWxfY291Y2hkYi5teSgnYXBwXycgKyBhcHBfaWQgKyAnL19kZXNpZ24vYXV0aCcpLCB7XG4gICAgICAgICAgICAgICAgICAgIFwibGFuZ3VhZ2VcIjogXCJqYXZhc2NyaXB0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwidmFsaWRhdGVfZG9jX3VwZGF0ZVwiOiBcImZ1bmN0aW9uKG4sbyx1KXtpZihuLl9pZCYmIW4uX2lkLmluZGV4T2YoXFxcIl9sb2NhbC9cXFwiKSlyZXR1cm47aWYoIXV8fCF1LnJvbGVzfHwodS5yb2xlcy5pbmRleE9mKFxcXCJhcHBfXCIgKyBhcHBfaWQgKyBcIlxcXCIpPT0tMSYmdS5yb2xlcy5pbmRleE9mKFxcXCJfYWRtaW5cXFwiKT09LTEpKXt0aHJvdyh7Zm9yYmlkZGVuOidEZW5pZWQuJ30pfX1cIlxuICAgICAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRydWUpXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyLnN0YXR1c0NvZGUgIT09IDQwNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJFUlJPUiEhIVwiICsgZXJyKVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGlmIChlcnIuc3RhdHVzQ29kZSAhPT0gNDA0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiRVJST1IhISFcIiArIGVycilcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgfSlcblxuICAgICAgICB9KVxuICAgIH1cblxuXG5cblxuXG4gICAgc2hhcmVtYWNoKGFwcF9pZCwgdXNlciwgbGFiZWwsIGZyaWVuZCkgeyAvLyBjcmVhdGUgb3Igc3Vic2NyaWJlIG5ldyBhcHBsaWNhdGlvblxuXG5cblxuICAgICAgICByZXR1cm4gc2hhcmVtYWNoKHRoaXMsIGFwcF9pZCwgdXNlciwgbGFiZWwsIGZyaWVuZClcbiAgICB9XG5cblxuXG5cblxuXG59XG5cblxuZnVuY3Rpb24gZ2VuX2RiKGtpbmQsIGRhdGEpOiBzdHJpbmcge1xuICAgIHN3aXRjaCAoa2luZCkge1xuICAgICAgICBjYXNlICdtZW1iZXInOlxuICAgICAgICAgICAgcmV0dXJuICdtZW1fJyArIHVpZCgzKSArICdfJyArIGRhdGEuYXBwX2lkICsgJ18nICsgZGF0YS51c2VybmFtZVxuICAgICAgICBjYXNlICdtYWNoaW5lJzpcbiAgICAgICAgICAgIHJldHVybiAnbWFjaF8nICsgdWlkKDYpICsgJ18nICsgZGF0YS5hcHBfaWRcblxuICAgIH1cbn1cbmZ1bmN0aW9uIHJhbmRvbV9zbGF2ZSh1c2VybmFtZSk6IHsgcGFzc3dvcmQ6IHN0cmluZzsgdXNlcjogc3RyaW5nIH0ge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcGFzc3dvcmQ6IHVpZCgxMiksXG4gICAgICAgIHVzZXI6ICdzbF8nICsgdXNlcm5hbWUgKyAnXycgKyB1aWQoNilcbiAgICB9XG5cbn1cblxuXG5leHBvcnQgZGVmYXVsdCBjb3VjaEFjY2Vzc1xuIl19