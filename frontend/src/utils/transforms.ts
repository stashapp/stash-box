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

export interface URL {
    url: string;
    type: string;
    image_id: string | null;
    height: number | null;
    width: number | null;
}

export const sortImageURLs = (urls: URL[], orientation: 'portrait'|'landscape') => (
    urls
        .filter((u) => u.type === 'PHOTO' && u.image_id !== null)
        .map((u:URL) => ({
            url: `${process.env.CDN}/${u.image_id.slice(0, 2)}/${u.image_id.slice(2, 4)}/${u.image_id}`,
            width: u.width,
            height: u.height,
            aspect: orientation === 'portrait' ? (u.height / u.width > 1) : (u.width / u.height) > 1
        }))
        .sort((a, b) => {
            if (a.aspect > b.aspect) return -1;
            if (a.aspect < b.aspect) return 1;
            if (orientation === 'portrait' && a.height > b.height) return -1;
            if (orientation === 'portrait' && a.height < b.height) return 1;
            if (orientation === 'landscape' && a.width > b.width) return -1;
            if (orientation === 'landscape' && a.width < b.width) return 1;
            return 0;
        })
);

export const getUrlByType = (
    urls:URL[],
    type:string,
    orientation?: 'portrait'|'landscape'
) => {
    if (type === 'PHOTO' && urls.some((u) => u.type === 'PHOTO') && orientation)
        return sortImageURLs(urls, orientation)[0].url;
    return (urls && (urls.find((url) => url.type === type) || {}).url) || '';
};

export const getBodyModification = (bodyMod:{location:string, description?:string}[]) => (
    (bodyMod || []).map((mod) => (
        mod.location + (mod.description ? ` (${mod.description})` : '')
    )).join(', ')
);
