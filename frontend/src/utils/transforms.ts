import { MeasurementsInput, BreastTypeEnum, URLInput } from 'src/definitions/globalTypes';

export const boobJobStatus = (val:BreastTypeEnum) => {
    if (val === BreastTypeEnum.NATURAL) return 'Natural';
    if (val === BreastTypeEnum.FAKE) return 'Augmented';
    if (val === BreastTypeEnum.NA) return 'N/A';
    return 'Unknown';
};

export const getBraSize = (measurements:MeasurementsInput) => (
    measurements === null || measurements.band_size === null || measurements.cup_size === null ? ''
        : measurements.band_size + measurements.cup_size
);

export const getUrlByType = (urls:URLInput[], type:string) => (
    (urls && (urls.find((url) => url.type === type) || {}).url) || ''
);

export const getBodyModification = (bodyMod:{location:string, description?:string}[]) => (
    (bodyMod || []).map((mod) => (
        mod.location + (mod.description ? ` (${mod.description})` : '')
    )).join(', ')
);
