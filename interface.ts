


export interface IcommonDB {
    app_id: string;
    slave?: {
        username: string;
        password: string;
    },
    dbtype: string
    roles: string[];
    label?: string;
}


export interface IUserDB {
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

export interface ISecurity {
    members: {
        names: string[]
        roles: string[]
    }
}

export interface IClassConf {
    hostname: string;
    protocol?: string;
    port?: number;
    db?: string;
    user: string;
    password: string;
}


export interface IAuth {
    user: string
    password: string
}

export interface IAuthDB extends IAuth {
    db: string
}
export interface IUserDoc {
    _id:string
    users:IUser[]
    _rev?:string
}
export interface IUser {
    role:string
    name:string
    createdAt:number
}