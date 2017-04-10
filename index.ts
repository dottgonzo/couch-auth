import * as Promise from "bluebird"
import * as _ from "lodash"
import * as async from "async"

import couchJsonConf from "couchjsonconf"

import * as express from "express"


import * as I from "./interface"

const uid = require("uid")
const rpj = require("request-promise-json")





function getuserdb(internal_couchdb, adminAuth: I.IAuth, username: string): Promise<I.IUserDB> {

    // return all the user doc in _users


    return new Promise<I.IUserDB>(function (resolve, reject) {
        if (adminAuth && internal_couchdb.checkAdmin(adminAuth)) {

            rpj.get(internal_couchdb.my('_users/org.couchdb.user:' + username)).then(function (doc) {
                resolve(doc)
            }).catch(function (err) {
                if (err.statusCode !== 404) {
                    console.error("ERROR!!! " + err)
                }
                reject(err)
            })
        } else {
            reject({ error: 'unauthorized' })
        }
    })
}



export class couchAccess extends couchJsonConf {

    constructor(rootaccessdb: I.IClassConf) {
        super(rootaccessdb)

        const that = this



        function addAdminRole() {
            that.addAppRole({ user: that.user, password: that.password }, that.user, 'app_main')
        }

        rpj.get(that.my('app_main')).then(function () {


            getuserdb(that, { user: that.user, password: that.password }, that.user).then((u) => {

                if (u.roles.indexOf('app_main') !== -1) {
                    addAdminRole()
                } else {

                    return true

                }

            }).catch((err) => {
                that.createUser({ user: that.user, password: that.password }, { user: that.user, password: that.password }).then(() => {
                    addAdminRole()
                }).catch((err) => {
                    throw new Error(err)
                })

            })


        }).catch(function (err) {

            that.createClosedApp({ user: that.user, password: that.password }, 'app_main').then(() => {

                const services: I.IServicesDoc = {
                    _id: 'services',
                    services: []
                }
                rpj.put(that.my('app_main') + '/services', services).then(() => {
                    getuserdb(that, { user: that.user, password: that.password }, that.user).then((u) => {

                        if (u.roles.indexOf('app_main') !== -1) {
                            addAdminRole()
                        } else {
                            return true
                        }

                    }).catch((err) => {

                        that.createUser({ user: that.user, password: that.password }, { user: that.user, password: that.password }).then(() => {
                            addAdminRole()
                        }).catch((err) => {
                            throw new Error(err)
                        })

                    })
                }).catch((err) => {
                    throw new Error(err)
                })
            }).catch((err) => {
                throw new Error(err)
            })
        })
    }

    checkAdmin(adminAuth: I.IAuth) {
        if (adminAuth && adminAuth.user && adminAuth.password && adminAuth.user === this.user && adminAuth.password === this.password) {
            return true
        } else {
            return false
        }
    }

    login(auth: I.IAuth) {
        const that = this

        return new Promise<I.IUserDB>(function (resolve, reject) {

            if (auth && auth.user && auth.password) {
                rpj.get(that.my('_users/org.couchdb.user:' + auth.user)).then(function () {
                    rpj.get(that.for(auth.user, auth.password, '_users/org.couchdb.user:' + auth.user)).then(function (doc: I.IUserDB) {
                        resolve(doc)
                    }).catch(function (err) {
                        if (err.statusCode !== 404) {
                            console.error("ERROR!!! " + err)
                        }

                        reject(err)
                    })
                }).catch(function (err) {
                    if (err.statusCode !== 404) {
                        console.error("ERROR!!! " + err)
                    }
                    reject(err)
                })

            } else {
                if (!auth) {
                    reject('no options provided')
                } else if (!auth.user) {
                    reject('no username provided')
                } else if (!auth.password) {
                    reject('no password provided')
                } else {
                    reject('undefined error')
                }
            }

        })
    }




    addAppRole(auth: I.IAuth, username: string, app_id: string): Promise<boolean> {
        const that = this
        return new Promise<boolean>(function (resolve, reject) {

            getuserdb(that, auth, username).then((u) => {
                u.roles.push(app_id)

                rpj.put(that.my('_users/org.couchdb.user:' + username), u).then(() => {
                    if (username === auth.user) {
                        resolve(true)

                    } else {
                        rpj.get(that.my(app_id + '/users')).then((doc: I.IUsersDoc) => {
                            doc.users.push({ name: username, role: 'user', createdAt: Date.now() })
                            rpj.put(that.my(app_id + '/users'), doc).then((doc) => {
                                resolve(true)

                            }).catch((err) => {
                                reject(err)
                            })

                        }).catch((err) => {

                            if (err.statusCode !== 404) {
                                reject(err)
                            } else {
                                const doc: I.IUsersDoc = {
                                    _id: 'users',
                                    users: [{ name: username, role: 'user', createdAt: Date.now() }],
                                    createdAt: Date.now()
                                }
                                rpj.put(that.my(app_id + '/users'), doc).then((doc) => {
                                    resolve(true)

                                }).catch((err) => {
                                    reject(err)
                                })
                            }

                        })


                    }

                }).catch((err) => {
                    reject(err)
                })
            }).catch((err) => {
                reject(err)
            })

        })

    }



    createUser(adminauth: I.IAuth, user: I.IAuth): Promise<I.IUserDB> {
        const that = this
        return new Promise<I.IUserDB>(function (resolve, reject) {

            getuserdb(that, adminauth, user.user).then((u) => {
                reject("user " + user.user + " just eixsts")

            }).catch((err) => {

                const doc = { name: user.user, db: [], "roles": ['user'], "type": "user", password: user.password }

                rpj.put(that.my('_users/org.couchdb.user:' + user.user), doc).then(() => {
                    getuserdb(that, adminauth, user.user).then((u) => {

                        resolve(u)

                    }).catch((err) => {
                        reject(err)
                    })
                }).catch((err) => {
                    reject(err)
                })




            })

        })
    }

    createClosedApp(admin: I.IAuth, app_id) {
        const that = this

        // create an application (imperative)
        // return true only


        return new Promise<boolean>(function (resolve, reject) {
            if (admin && that.checkAdmin(admin)) {


                if (app_id !== 'app_main') app_id = 'private_' + app_id
                rpj.put(that.my(app_id)).then(function () {
                    rpj.put(that.my(app_id + '/_design/auth'), {
                        "language": "javascript",
                        "validate_doc_update": "function(n,o,u){if(n._id&&!n._id.indexOf(\"_local/\"))return;if(!u||!u.roles||(u.roles.indexOf(\"" + app_id + "\")==-1&&u.roles.indexOf(\"_admin\")==-1)){throw({forbidden:'Denied.'})}}"
                    }).then(function () {
                        resolve(true)
                    }).catch(function (err) {
                        if (err.statusCode !== 404) {
                            console.error("ERROR!!! " + err)
                        }

                        reject(err)
                    })
                }).catch(function (err) {
                    if (err.statusCode !== 404) {
                        console.error("ERROR!!! " + err)
                    } else {
                        reject(err)

                    }
                })
            } else {
                reject({ error: 'unauthorized' })
            }
        })
    }
    createServiceApp(admin: I.IAuth, app_id, slaveuser: I.IAuth) {
        const that = this

        // create an application (imperative)
        // return true only


        return new Promise<boolean>(function (resolve, reject) {

            if (admin && that.checkAdmin(admin) && app_id && slaveuser && slaveuser.user && slaveuser.password) {

                app_id = 'service_' + app_id
                rpj.put(that.my(app_id)).then(function () {
                    rpj.put(that.my(app_id + '/_design/auth'), {
                        "language": "javascript",
                        "validate_doc_update": "function(n,o,u){if(n._id&&!n._id.indexOf(\"_local/\"))return;if(!u||!u.roles||(u.roles.indexOf(\"" + app_id + "\")==-1&&u.roles.indexOf(\"_admin\")==-1)){throw({forbidden:'Denied.'})}}"
                    }).then(function () {
                        that.createUser(admin, slaveuser).then(function () {
                            that.addAppRole(admin, slaveuser.user, app_id).then(function () {
                                const devicesdoc: I.IDevicesDoc = {
                                    _id: 'devices',
                                    devices: [],
                                    createdAt: Date.now()
                                }
                                rpj.put(that.my(app_id + '/users'), devicesdoc).then(() => {
                                    rpj.get(that.my('app_main') + '/services').then((servicesdoc: I.IServicesDoc) => {

                                        servicesdoc.services.push({
                                            db: app_id,
                                            createdAt: Date.now()
                                        })

                                        rpj.put(that.my('app_main') + '/services', servicesdoc).then(() => {
                                            resolve(true)
                                        }).catch((err) => {
                                            reject(err)
                                        })
                                    }).catch((err) => {
                                        reject(err)
                                    })

                                }).catch((err) => {
                                    reject(err)
                                })
                            }).catch(function (err) {
                                reject(err)
                            })
                        }).catch(function (err) {
                            reject(err)
                        })
                    }).catch(function (err) {
                        reject(err)
                    })
                }).catch(function (err) {
                    reject(err)
                })
            } else {
                reject({ error: 'wrong params for service app creation' })
            }
        })
    }

    getServices(admin: I.IAuth) {
        const that = this

        return new Promise<I.IService[]>(function (resolve, reject) {
            if (admin && that.checkAdmin(admin)) {

                rpj.get(that.my('app_main/services')).then((doc: I.IServicesDoc) => {
                    resolve(doc.services)
                }).catch(function (err) {
                    reject(err)
                })

            } else {
                reject({ error: 'unauthorized' })
            }
        })
    }
    Setup(admin, services: I.IServiceSetup[]): Promise<boolean> {
        const that = this

        return new Promise<boolean>(function (resolve, reject) {
            if (admin && that.checkAdmin(admin)) {

                async.eachSeries(services, (service, cb) => {
                    console.log('todo')
                    console.log(service)
                    cb()
                }, (err) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(true)
                    }
                })

            } else {
                reject({ error: 'unauthorized' })
            }
        })
    }
    createPubApp(admin: I.IAuth, app_id) {
        const that = this

        // create an application (imperative)
        // return true only


        return new Promise<boolean>(function (resolve, reject) {
            if (admin && that.checkAdmin(admin)) {

                app_id = 'pub_' + app_id
                rpj.put(that.my(app_id)).then(function () {
                    rpj.put(that.my(app_id + '/_design/auth'), {
                        "language": "javascript",
                        "validate_doc_update": "function(n, o, u) { if (u.roles.length == 0 || u.roles.indexOf('_admin') == -1) { throw({ forbidden: 'You must be an admin in to save data' }); } }"
                    }).then(function () {
                        resolve(true)
                    }).catch(function (err) {
                        reject(err)

                    })
                }).catch(function (err) {
                    if (err.statusCode !== 404) {
                        console.error("ERROR!!! " + err)
                    }

                    reject(err)
                })
            } else {
                reject({ error: 'unauthorized' })
            }
        })
    }





}


const router = express.Router()

export function accessRouter(rootaccessdb: I.IClassConf) {

    const CouchAuth = new couchAccess(rootaccessdb)




    router.get('/', (req, res) => {
        res.send('need access');

    })

    router.post('/testadmin', (req, res) => {

        const admin = req.body.admin

        console.log(admin)

        if (admin && CouchAuth.checkAdmin(admin)) {

            res.send({ ok: true });

        } else {
            res.send({ error: 'wrong admin credentials' });

        }

    })


    return router

}

