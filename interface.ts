


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
export interface IUsersDoc {
    _id: 'users'
    users: IUser[]
    _rev?: string
    createdAt:number
}
type IUserRole = 'user' 

export interface IUser {
    role: IUserRole
    name: string
    createdAt: number
}

export interface IDevice {
    role: IDeviceRole
    serial: string
    createdAt: number
}

type IDeviceRole = 'device' 

export interface IDevicesDoc {
    _id: 'devices'
    devices: IDevice[]
    createdAt: number
    _rev?: string
}


export interface IServicesDoc {
    _id: 'services'
    services: IService[]
    _rev?: string
}

export interface IService {
    db:string
    createdAt:number
}

export interface IServiceSetup extends IService{
    devices:IDevice[]
    users:IUserSetup[]
    name:string
}

export interface IUserSetup extends IUser{
password:string
}

