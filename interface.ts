


export  interface IcommonDB {
    app_id: string;
    dbname: string;
    slave?: {
        username: string;
        password: string;
    },
    dbtype: string
    roles: string[];
    label?: string;
}


export  interface IUserDB {
    _id: string,
    _rev: string,
    password_scheme: string;
    iterations: string;
    name: string;
    email: string;
    db: IcommonDB[];
    roles: string[];
    type: string;
    derived_key: string;
    salt: string;

}



export  interface IClassConf {
    hostname: string;
    protocol?: string;
    port?: number;
    db?: string;
    user: string;
    password: string;
}


