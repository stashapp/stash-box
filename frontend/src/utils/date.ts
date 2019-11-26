
const getFuzzyDate = (date:string, accuracy:number) => {
    if (date === null) return '';
    if (accuracy === 3) return date;
    if (accuracy === 2) return date.slice(0, 7);
    return date.slice(0, 4);
};

export default getFuzzyDate;
