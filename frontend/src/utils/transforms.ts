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

export const getUrlByType = (
    urls:URLInput[],
    type:string,
    orientation?: 'portrait'|'landscape'
) => {
    if (urls.length === 0) return '';
    if (type === 'PHOTO')
        return urls.filter((u) => u.type === 'PHOTO').map((u) => {
            const width = Number.parseInt(u.url.match(/width=(\d+)/)[1], 10);
            const height = Number.parseInt(u.url.match(/height=(\d+)/)[1], 10);
            return {
                url: u.url,
                width,
                height,
                aspect: orientation === 'portrait' ? (height / width > 1) : (width / height) > 1
            }
        }).sort((a, b) => {
            if (a.aspect > b.aspect) return -1;
            if (a.aspect < b.aspect) return 1;
            if (orientation === 'portrait' && a.height > b.height) return -1;
            if (orientation === 'portrait' && a.height < b.height) return 1;
            if (orientation === 'landscape' && a.width > b.width) return -1;
            if (orientation === 'landscape' && a.width < b.width) return 1;
            return 0;
        })[0].url;
    return (urls && (urls.find((url) => url.type === type) || {}).url) || '';
};

export const getBodyModification = (bodyMod:{location:string, description?:string}[]) => (
    (bodyMod || []).map((mod) => (
        mod.location + (mod.description ? ` (${mod.description})` : '')
    )).join(', ')
);
