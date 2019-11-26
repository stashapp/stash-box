export const boobJobStatus = (val:boolean) => {
    if (val === false) return 'Natural';
    if (val === true) return 'Augmented';
    return 'Unknown';
};
