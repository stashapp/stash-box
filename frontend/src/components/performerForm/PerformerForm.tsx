import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/react-hooks';
import { RouteComponentProps, Link } from '@reach/router';
import useForm from 'react-hook-form';
import Select from 'react-select';
import * as yup from 'yup';

import { Countries } from 'src/definitions/Countries';
import { Performer_getPerformer as Performer } from 'src/definitions/Performer';
import CountryQuery from 'src/queries/Country.gql';
import { UpdatePerformerMutation_updatePerformer as PerformerData } from 'src/definitions/UpdatePerformerMutation';

import getFuzzyDate from 'src/utils/date';
import { LoadingIndicator } from 'src/components/fragments';

type OptionEnum = {
    value:string;
    label:string;
};

const GENDER:OptionEnum[] = [
    { value: 'female', label: 'Female' },
    { value: 'male', label: 'Male' },
    { value: 'transfemale', label: 'Transfemale' },
    { value: 'transmale', label: 'Transmale' },
    { value: 'Other', label: 'Other' }
];

const HAIR:OptionEnum[] = [
    { value: 'null', label: 'Unknown' },
    { value: 'blonde', label: 'Blonde' },
    { value: 'brunette', label: 'Brunette' },
    { value: 'black', label: 'Black' },
    { value: 'red', label: 'Red' },
    { value: 'auburn', label: 'Auburn' },
    { value: 'grey', label: 'Grey' },
    { value: 'bald', label: 'Bald' },
    { value: 'various', label: 'Various' },
    { value: 'other', label: 'Other' }
];

const BREAST:OptionEnum[] = [
    { value: 'null', label: 'Unknown' },
    { value: 'natural', label: 'Natural' },
    { value: 'augmented', label: 'Augmented' }
];

const EYE:OptionEnum[] = [
    { value: 'null', label: 'Unknown' },
    { value: 'blue', label: 'Blue' },
    { value: 'brown', label: 'Brown' },
    { value: 'grey', label: 'Grey' },
    { value: 'green', label: 'Green' },
    { value: 'hazel', label: 'Hazel' },
    { value: 'red', label: 'Red' }
];

const ETHNICITY:OptionEnum[] = [
    { value: 'null', label: 'Unknown' },
    { value: 'caucasian', label: 'Caucasian' },
    { value: 'black', label: 'Black' },
    { value: 'asian', label: 'Asian' },
    { value: 'indian', label: 'Indian' },
    { value: 'latino', label: 'Latino' },
    { value: 'middleeastern', label: 'Middle Eastern' },
    { value: 'mixed', label: 'Mixed' },
    { value: 'other', label: 'Other' }
];

const getEnumValue = (enumArray:OptionEnum[], val:string) => {
    if (val === null)
        return enumArray[0].value;
    return val.toLowerCase();
};

const nullCheck = ((input:string|null) => (input === '' || input === 'null' ? null : input));
const zeroCheck = ((input:number|null) => (input === 0 || Number.isNaN(input) ? null : input));

const schema = yup.object().shape({
    name: yup.string().required(),
    gender: yup.string().oneOf(GENDER.map((g) => g.value)).required(),
    disambiguation: yup.string().trim(),
    birthdate: yup.string().transform(nullCheck)
        .matches(/^\d{4}$|^\d{4}-\d{2}$|^\d{4}-\d{2}-\d{2}$/, { excludeEmptyString: true }).nullable(),
    careerStart: yup.number().transform(zeroCheck).nullable().min(1950)
        .max(new Date().getFullYear()),
    careerEnd: yup.number().transform(zeroCheck).min(1950).max(new Date().getFullYear())
        .nullable(),
    height: yup.number().transform(zeroCheck).min(100).max(230)
        .nullable(),
    cupSize: yup.string().transform(nullCheck).matches(/\d{2,3}[a-zA-Z]{1,4}/).nullable(),
    waistSize: yup.number().transform(zeroCheck).min(15).max(50)
        .nullable(),
    hipSize: yup.number().transform(zeroCheck).nullable(),
    boobJob: yup.string().transform(nullCheck).oneOf([null, ...BREAST.map((b) => b.value)]).nullable(),
    countryId: yup.number().min(0).max(1000).transform(zeroCheck)
        .nullable(),
    ethnicity: yup.string().transform(nullCheck).oneOf([null, ...ETHNICITY.map((e) => e.value)]).nullable(),
    location: yup.string().trim().transform(nullCheck).nullable(),
    eyeColor: yup.string().transform(nullCheck).nullable().oneOf([null, ...EYE.map((e) => e.value)]),
    hairColor: yup.string().transform(nullCheck).nullable().oneOf([null, ...HAIR.map((h) => h.value)]),
    tattoos: yup.string().trim().transform(nullCheck).nullable(),
    piercings: yup.string().trim().transform(nullCheck).nullable(),
    aliases: yup.string().trim().transform(nullCheck).nullable(),
    photoURL: yup.string().url().transform(nullCheck).nullable()
});

interface PerformerProps extends RouteComponentProps<{
    performer: Performer,
    callback: (data:PerformerData) => void
}>{}

interface FormData {
    boobJob?: string;
}

const PerformerForm: React.FC<PerformerProps> = ({ performer, callback }) => {
    const { register, handleSubmit, setValue } = useForm({
        validationSchema: schema,
    });
    const [gender, setGender] = useState(performer.gender || 'female');
    const [photoURL, setPhotoURL] = useState(performer.photoUrl);
    const { loading: loadingCountries, data: countries } = useQuery<Countries>(CountryQuery);
    useEffect(() => {
        register({ name: 'countryId' });
        setValue('countryId', performer.countryId);
    }, [register]);

    if (loadingCountries)
        return <LoadingIndicator message="Loading performer..." />;

    const onGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => (
        setGender(e.currentTarget.value));
    const onURLChange = (e: React.ChangeEvent<HTMLInputElement>) => (
        setPhotoURL(e.currentTarget.value));
    const onCountryChange = (selectedOption:{label:string, value:number}) => (
        setValue('countryId', selectedOption.value));

    const enumOptions = (enums: OptionEnum[]) => (
        enums.map((obj) => (<option key={obj.value} value={obj.value}>{obj.label}</option>))
    );

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const onSubmit = (data:any) => {
        const performerData = { ...data };
        performerData.boobJob = data.boobJob === 'natural' ? false : data.boobJob === 'augmented' ? true : null;
        if (data.cupSize !== null) {
            performerData.bandSize = Number.parseInt(data.cupSize.match(/^\d+/)[0], 10);
            performerData.cupSize = data.cupSize.replace(performerData.bandSize, '')
                .match(/^[a-zA-Z]+/)[0].toUpperCase();
        }
        if (data.gender !== 'female' && data.gender !== 'transfemale')
            performerData.boobJob = null;
        if (data.birthdate !== null)
            if (data.birthdate.length === 10)
                performerData.birthdateAccuracy = 3;
            else if (data.birthdate.length === 7) {
                performerData.birthdateAccuracy = 2;
                performerData.birthdate = `${data.birthdate}-01`;
            } else {
                performerData.birthdateAccuracy = 1;
                performerData.birthdate = `${data.birthdate}-01-01`;
            }

        if (data.piercings !== null)
            performerData.piercings = data.piercings.split(';').map((p:string) => p.trim());
        if (data.tattoos !== null)
            performerData.tattoos = data.tattoos.split(';').map((p:string) => p.trim());
        if (data.aliases !== null)
            performerData.aliases = data.aliases.split(';').map((p:string) => p.trim());

        callback(performerData);
    };

    const countryObj = countries.getCountries.map((country) => ({ value: country.id, label: country.name }));

    return (
        <form className="PerformerForm" onSubmit={handleSubmit(onSubmit)}>
            <div className="row">
                <div className="col-8">
                    <div className="form-group row">
                        <div className="col-6">
                            <label htmlFor="name">
                                <div>Name</div>
                                <input
                                    className="form-control"
                                    type="text"
                                    placeholder="Name"
                                    name="name"
                                    defaultValue={performer.name}
                                    ref={register({ required: true })}
                                />
                            </label>
                        </div>
                        <div className="col-6">
                            <label htmlFor="disambiguation">
                                <div>Disambiguation</div>
                                <input
                                    className="form-control"
                                    type="text"
                                    placeholder="Disambiguation"
                                    name="disambiguation"
                                    defaultValue={performer.disambiguation}
                                    ref={register}
                                />
                            </label>
                        </div>
                    </div>
                    <div className="form-group row">
                        <div className="col-3">
                            <label htmlFor="gender">
                                <div>Gender</div>
                                <select
                                    className="form-control"
                                    name="gender"
                                    defaultValue={performer.gender}
                                    onChange={onGenderChange}
                                    ref={register}
                                >
                                    { enumOptions(GENDER) }
                                </select>
                            </label>
                        </div>
                        <div className="col-3">
                            <label htmlFor="birthdate">Birthdate</label>
                            <input
                                className="form-control"
                                type="text"
                                placeholder="YYYY-MM-DD"
                                name="birthdate"
                                defaultValue={getFuzzyDate(performer.birthdate, performer.birthdateAccuracy)}
                                ref={register}
                            />
                        </div>
                        <div className="col-3">
                            <label htmlFor="careerStart">
                                <div>Career Start</div>
                                <input
                                    className="form-control"
                                    type="year"
                                    placeholder="Year"
                                    name="careerStart"
                                    defaultValue={performer.careerStart}
                                    ref={register}
                                />
                            </label>
                        </div>
                        <div className="col-3">
                            <label htmlFor="careerEnd">
                                <div>Career End</div>
                                <input
                                    className="form-control"
                                    type="year"
                                    placeholder="Year"
                                    name="careerEnd"
                                    defaultValue={performer.careerEnd}
                                    ref={register}
                                />
                            </label>
                        </div>
                    </div>

                    <div className="form-group row">
                        <div className="col-3">
                            <label htmlFor="height">
                                <div>
                                    Height
                                    <small className="text-muted">in cm</small>
                                </div>
                                <input
                                    className="form-control"
                                    type="number"
                                    placeholder="Height"
                                    name="height"
                                    defaultValue={performer.height}
                                    ref={register}
                                />
                            </label>
                        </div>

                        <div className="col-2">
                            <label htmlFor="cupSize">
                                <div>Bra size</div>
                                <input
                                    className="form-</div>control"
                                    type="text"
                                    placeholder="Bra"
                                    name="cupSize"
                                    defaultValue={
                                        performer.bandSize !== null ? performer.bandSize + performer.cupSize : ''
                                    }
                                    ref={register({ pattern: /\d{2,3}[a-zA-Z]{1,4}/i })}
                                />
                            </label>
                        </div>

                        <div className="col-2">
                            <label htmlFor="waistSize">
                                <div>Waist-size</div>
                                <input
                                    className="form-control"
                                    type="number"
                                    placeholder="Waist"
                                    name="waistSize"
                                    defaultValue={performer.waistSize}
                                    ref={register}
                                />
                            </label>
                        </div>

                        <div className="col-2">
                            <label htmlFor="hipSize">
                                <div>Hip-size</div>
                                <input
                                    className="form-control"
                                    type="number"
                                    placeholder="Hip"
                                    name="hipSize"
                                    defaultValue={performer.hipSize}
                                    ref={register}
                                />
                            </label>
                        </div>

                        { (gender === 'female' || gender === 'transfemale') && (
                            <div className="col-3">
                                <label htmlFor="boobJob">
                                    <div>Breast-type</div>
                                    <select
                                        className="form-control"
                                        name="boobJob"
                                        defaultValue={performer.boobJob === true
                                            ? 'augmented' : performer.boobJob === false ? 'natural' : null}
                                        ref={register}
                                    >
                                        { enumOptions(BREAST) }
                                    </select>
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="form-group row">
                        <div className="col-6">
                            <label htmlFor="countryId">
                                <div>Nationality</div>
                                <Select
                                    name="countryId"
                                    onChange={onCountryChange}
                                    options={countryObj}
                                    defaultValue={countryObj.find((c) => c.value === performer.countryId)}
                                />
                            </label>
                        </div>

                        <div className="col-6">
                            <label htmlFor="ethnicity">
                                <div>Ethnicity</div>
                                <select
                                    className="form-control"
                                    name="ethnicity"
                                    defaultValue={getEnumValue(ETHNICITY, performer.ethnicity)}
                                    ref={register}
                                >
                                    { enumOptions(ETHNICITY) }
                                </select>
                            </label>
                        </div>
                    </div>

                    <div className="form-group row">
                        <div className="col-6">
                            <label htmlFor="location">
                                <div>Location</div>
                                <input
                                    className="form-control"
                                    type="text"
                                    placeholder="Location"
                                    name="location"
                                    defaultValue={performer.location}
                                    ref={register}
                                />
                            </label>
                        </div>

                        <div className="col-3">
                            <label htmlFor="eyeColor">
                                <div>Eye color</div>
                                <select
                                    className="form-control"
                                    name="eyeColor"
                                    defaultValue={getEnumValue(EYE, performer.eyeColor)}
                                    ref={register}
                                >
                                    { enumOptions(EYE) }
                                </select>
                            </label>
                        </div>

                        <div className="col-3">
                            <label htmlFor="hairColor">
                                <div>Hair color</div>
                                <select
                                    className="form-control"
                                    name="hairColor"
                                    defaultValue={getEnumValue(HAIR, performer.hairColor)}
                                    ref={register}
                                >
                                    { enumOptions(HAIR) }
                                </select>
                            </label>
                        </div>
                    </div>

                    <div className="form-group row">
                        <div className="col-6">
                            <label htmlFor="tattoos">
                                <div>
                                    Tattoos
                                    <small className="text-muted">separated by ; </small>
                                </div>
                                <input
                                    className="form-control"
                                    type="text"
                                    placeholder="Tattoos"
                                    name="tattoos"
                                    defaultValue={(performer.tattoos || []).join('; ')}
                                    ref={register}
                                />
                            </label>
                        </div>

                        <div className="col-6">
                            <label htmlFor="piercings">
                                <div>
                                    Piercings
                                    <small className="text-muted">separated by ; </small>
                                </div>
                                <input
                                    className="form-control"
                                    type="text"
                                    placeholder="Piercings"
                                    name="piercings"
                                    defaultValue={(performer.piercings || []).join('; ')}
                                    ref={register}
                                />
                            </label>
                        </div>
                    </div>

                    <div className="form-group row">
                        <div className="col">
                            <label htmlFor="aliases">
                                <div>
                                    Aliases
                                    <small className="text-muted">
    separated by
                                        <em>;</em>
                                    </small>
                                </div>
                                <input
                                    className="form-control"
                                    type="text"
                                    placeholder="Aliases"
                                    name="aliases"
                                    defaultValue={(performer.aliases || []).join('; ')}
                                    ref={register}
                                />
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <input className="btn btn-primary col-2 save-button" type="submit" value="Save" />
                        <input className="btn btn-secondary offset-6 reset-button" type="reset" />
                        <Link to={performer.uuid ? `/performer/${performer.uuid}` : '/performers'}>
                            <button className="btn btn-danger reset-button" type="button">Cancel</button>
                        </Link>
                    </div>
                </div>

                <div className="col-4">
                    <div className="form-group">
                        <label htmlFor="photoUrl">
                            <div>Photo URL</div>
                            <input
                                type="url"
                                className="form-control"
                                name="photoUrl"
                                onChange={onURLChange}
                                defaultValue={performer.photoUrl}
                                ref={register}
                            />
                        </label>
                    </div>
                    <img alt="" src={photoURL} />
                </div>
            </div>
        </form>
    );
};

export default PerformerForm;
