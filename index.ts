import * as Promise from "bluebird"
import * as _ from "lodash"

import couchJsonConf from "couchjsonconf"

import { IClassConf, IUserDB, IcommonDB } from "./interface"

const uid = require("uid")
const rpj = require("request-promise-json")




function getuserdb(internal_couchdb, username) {

    // return all the user doc in _users


    return new Promise<IUserDB>(function (resolve, reject) {
        rpj.get(internal_couchdb.my('_users/org.couchdb.user:' + username)).then(function (doc) {
            resolve(doc)
        }).catch(function (err) {
            if (err.statusCode !== 404) {
                throw Error("ERROR!!!" + err)
            }

            reject(err)
        })
    })
}



class couchAccess extends couchJsonConf {

    constructor(rootaccessdb: IClassConf) {
        super(rootaccessdb)

        let that = this

        function addAdminRole() {
            that.addAppRole(that.user, 'app_main').then(() => {
                console.log("created!")
                return true
            }).catch((err) => {
                console.log("errRRR " + err)
            })
        }




        rpj.get(that.my('app_main')).then(function () {


            getuserdb(that, that.user).then((u) => {

                if (u.roles.indexOf('app_main') !== -1) {
                    addAdminRole()
                } else {
                    console.log("created!")
                    return true
                }

            }).catch((err) => {
                that.createUser(that.user, that.password, '').then(() => {
                    addAdminRole()
                }).catch((err) => {
                    console.error("err " + err)
                })

            })


        }).catch(function (err) {


            that.createClosedApp('app_main').then(() => {

                getuserdb(that, that.user).then((u) => {

                    if (u.roles.indexOf('app_main') !== -1) {
                        addAdminRole()
                    } else {
                        console.log("created!")
                        return true
                    }

                }).catch((err) => {

                    that.createUser(that.user, that.password, '').then(() => {

                        addAdminRole()


                    }).catch((err) => {
                        console.error("err " + err)
                    })

                })



            }).catch((err) => {


                console.error("err " + err)
            })
        })


    }

    login(o: { username: string, password: string, app_id: string }) {
        const that = this

        return new Promise<boolean>(function (resolve, reject) {

            if (o && o.username && o.password && o.app_id) {
                testauth(that, o.username, o.password, o.app_id).then(() => {
                    resolve(true)
                }).catch((err) => {
                    reject(err)
                })

            } else {
                if (!o) {
                    reject('no options provided')
                } else if (!o.username) {
                    reject('no username provided')

                } else if (!o.password) {
                    reject('no password provided')

                } else if (!o.app_id) {
                    reject('no app_id provided')

                }
            }

        })
    }

    register(o: { username: string, password: string, email: string, app_id: string }): Promise<boolean> {
        const that = this

        return new Promise<boolean>(function (resolve, reject) {
            if (o && o.username && o.password && o.email && o.app_id) {
                that.createUser(o.username, o.password, o.email).then(() => {
                    that.subscribeapp(o.app_id, o.username).then(() => {
                        resolve(true)
                    }).catch((err) => {
                        reject(err)
                    })
                }).catch((err) => {
                    reject(err)
                })
            } else {
                if (!o) {
                    reject('no options provided')
                } else if (!o.username) {
                    reject('no username provided')

                } else if (!o.password) {
                    reject('no password provided')

                } else if (!o.email) {
                    reject('no email provided')

                } else if (!o.app_id) {
                    reject('no app_id provided')

                }
            }

        })

    }

    createappforuser(app_id, username) { // create a new application

        const internal_couchdb = this



        return new Promise<boolean>(function (resolve, reject) {


            internal_couchdb.createClosedApp(app_id).then(function () {

                internal_couchdb.subscribeapp(app_id, username, true).then(() => {
                    resolve(true)
                }).catch((err) => {
                    reject(err)


                })
            }).catch(function (err) {
                reject(err)


            })




        })
    }


    addAppRole(username: string, app_id: string): Promise<boolean> {
        const that = this
        return new Promise<boolean>(function (resolve, reject) {

            getuserdb(that, username).then((u) => {
                u.roles.push(app_id)

                rpj.put(that.my('_users/org.couchdb.user:' + username), u).then(() => {

                    resolve(true)

                }).catch((err) => {
                    reject(err)
                })
            }).catch((err) => {
                reject(err)
            })

        })

    }



    createUser(username: string, password: string, email: string): Promise<IUserDB> {
        const that = this
        return new Promise<IUserDB>(function (resolve, reject) {

            getuserdb(that, username).then((u) => {
                reject("user " + username + " just eixsts")

            }).catch((err) => {

                const doc = { name: username, email: email, db: [], "roles": ['user'], "type": "user", password: password }

                rpj.put(that.my('_users/org.couchdb.user:' + username), doc).then(() => {
                    getuserdb(that, username).then((u) => {

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

    testlogin(user, password, db) {


        return testlogin(this, user, password, db)
    }


    testapp_id(app_id) {


        return testapp_id(this, app_id)
    }


    getuserdbs(username) {

        return getuserdbs(this, username)
    }



    getuserapp(username, app_id) {

        return getuserapp(this, username, app_id)
    }



    getmymachine(app_id, username, label) {

        return getmymachine(this, app_id, username, label)
    }

    getmymachines(app_id, username) {

        return getmymachines(this, app_id, username)
    }


    create_slave_userapp(username: string, userdb: string) {


        return create_slave_userapp(this, username, userdb)
    }

    subscribeapp(app_id: string, username: string, owner?: boolean) {



        // every user must have a personal db for every application that they have access
        // when an user subscribe an app, a db and it's slave user  will be created for him, and the user doc in _users register the new credentials generated 




        const internal_couchdb = this


        return new Promise<boolean>(function (resolve, reject) {



            function sub(doc) {


                var newuserdb = gen_db('member', { username: username, app_id: app_id })

                create_slave_userapp(internal_couchdb, username, newuserdb).then(function (slave) {

                    var newdb = { app_id: app_id, dbname: newuserdb, slave: { username: slave.user, password: slave.password }, dbtype: "mine", roles: ['owner'] }
                    doc.db.push(newdb)

                    if (owner) {
                        doc.roles.push('app_' + app_id)
                        var startapp = { app_id: app_id, dbname: 'app_' + app_id, dbtype: "application", roles: ['owner'] }
                        doc.db.push(startapp)
                    }

                    rpj.put(internal_couchdb.my('_users/org.couchdb.user:' + username), doc).then(function () { // push new user settings
                        rpj.put(internal_couchdb.my(newuserdb), doc).then(function () {  // create an empty db
                            rpj.put(internal_couchdb.my(newuserdb + '/_security'), { "members": { "names": [username, slave.user], "roles": [] } }).then(function () { // push security changes to app db
                                resolve(true)

                                // confirmDB.post({confirm:false}).then(function(doc){
                                //   //  registerMail('darioyzf@gmail.com',doc.id) // TO BE ALIVE
                                // }).catch(function(err){
                                //   reject(err)
                                // })

                            }).catch(function (err) {
                                if (err.statusCode !== 404) {
                                    throw Error("ERROR!!!" + err)
                                }

                                reject(err)
                            })
                        }).catch(function (err) {
                            if (err.statusCode !== 404) {
                                throw Error("ERROR!!!" + err)
                            }

                            reject(err)
                        })
                    }).catch(function (err) {
                        if (err.statusCode !== 404) {
                            throw Error("ERROR!!!" + err)
                        }

                        reject(err)
                    })
                }).catch(function (err) {
                    if (err.statusCode !== 404) {
                        throw Error("ERROR!!!" + err)
                    }

                    reject(err)
                })
            }




            getuserdb(internal_couchdb, username).then(function (doc) {

                testapp_id(internal_couchdb, app_id).then(function () {

                    sub(doc)


                }).catch(function (err) {
                    reject(err)
                })

            }).catch(function (err) {
                reject(err)


            })
        })


    }

    createClosedApp(app_id) {
        const internal_couchdb = this

        // create an application (imperative)
        // return true only


        return new Promise<boolean>(function (resolve, reject) {

            rpj.put(internal_couchdb.my(app_id)).then(function () {
                rpj.put(internal_couchdb.my(app_id + '/_design/auth'), {
                    "language": "javascript",
                    "validate_doc_update": "function(n,o,u){if(n._id&&!n._id.indexOf(\"_local/\"))return;if(!u||!u.roles||(u.roles.indexOf(\"" + app_id + "\")==-1&&u.roles.indexOf(\"_admin\")==-1)){throw({forbidden:'Denied.'})}}"
                }).then(function () {
                    resolve(true)
                }).catch(function (err) {
                    if (err.statusCode !== 404) {
                        throw Error("ERROR!!!" + err)
                    }

                    reject(err)
                })
            }).catch(function (err) {
                if (err.statusCode !== 404) {
                    throw Error("ERROR!!!" + err)
                } else {
                    reject(err)

                }
            })

        })
    }


    createRoApp(app_id) {
        const internal_couchdb = this

        // create an application (imperative)
        // return true only


        return new Promise<boolean>(function (resolve, reject) {

            rpj.put(internal_couchdb.my(app_id)).then(function () {
                rpj.put(internal_couchdb.my(app_id + '/_design/auth'), {
                    "language": "javascript",
                    "validate_doc_update": "function(n, o, u) { if (u.roles.length == 0 || u.roles.indexOf('_admin') == -1) { throw({ forbidden: 'You must be an admin in to save data' }); } }"
                }).then(function () {
                    resolve(true)
                }).catch(function (err) {
                    reject(err)

                })
            }).catch(function (err) {
                if (err.statusCode !== 404) {
                    throw Error("ERROR!!!" + err)
                }

                reject(err)
            })

        })
    }


    sharemach(app_id, user, label, friend) { // create or subscribe new application



        return sharemach(this, app_id, user, label, friend)
    }






}


function gen_db(kind, data): string {
    switch (kind) {
        case 'member':
            return 'mem_' + uid(3) + '_' + data.app_id + '_' + data.username
        case 'machine':
            return 'mach_' + uid(6) + '_' + data.app_id

    }
}
function random_slave(username): { password: string; user: string } {

    return {
        password: uid(12),
        user: 'sl_' + username + '_' + uid(6)
    }

}


export default couchAccess
