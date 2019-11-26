export interface Performer {
    performerId:number;
    alias:string|null;
}

export interface SceneFormData {
    performers?: Performer[];
    date?:string;
    dateAccuracy?:number;
}

export interface PerformerFormData {
    boobJob?:boolean|string;
    bandSize?:number;
    cupSize?:string;
    gender:string;
    birthdate?:string;
    birthdateAccuracy?:number;
    piercings?:string[];
    tattoos?:string[];
    aliases?:string[];
}
