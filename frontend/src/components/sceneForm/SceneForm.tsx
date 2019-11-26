/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/react-hooks';
import { RouteComponentProps, Link } from '@reach/router';
import useForm from 'react-hook-form';
import Select from 'react-select';
import * as yup from 'yup';
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import cx from 'classnames';

import { Studios } from 'src/definitions/Studios';
import { Search_search_performers as PerformerResult } from 'src/definitions/Search';
import { Scene_getScene as Scene } from 'src/definitions/Scene';
import StudioQuery from 'src/queries/Studios.gql';
import { SceneFormData, Performer } from 'src/common/types';
import getFuzzyDate from 'src/utils/date';

import { GenderIcon, LoadingIndicator } from 'src/components/fragments';
import SearchField, { SearchType } from 'src/components/searchField';

const nullCheck = ((input:string|null) => (input === '' || input === 'null' ? null : input));
const zeroCheck = ((input:number|null) => (input === 0 || Number.isNaN(input) ? null : input));

const schema = yup.object().shape({
    title: yup.string().required(),
    description: yup.string().trim(),
    date: yup.string().transform(nullCheck)
        .matches(/^\d{4}$|^\d{4}-\d{2}$|^\d{4}-\d{2}-\d{2}$/, { excludeEmptyString: true }).nullable(),
    studioId: yup.number().transform(zeroCheck).required(),
    photoURL: yup.string().url().transform(nullCheck).nullable(),
    studioURL: yup.string().url().transform(nullCheck).nullable(),
    performers: yup.array().of(yup.object().shape({
        performerId: yup.number().required(),
        alias: yup.string().transform(nullCheck).nullable()
    })).nullable()
});

interface SceneProps extends RouteComponentProps<{
    scene: Scene,
    callback: (data:SceneFormData, performers:Performer[]) => void
}>{}

interface PerformerInfo {
    name: string;
    alias?: string;
    displayName: string;
    uuid: string;
    id: number;
    gender: string;
}

const SceneForm: React.FC<SceneProps> = ({ scene, callback }) => {
    const { register, handleSubmit, setValue, errors } = useForm({
        validationSchema: schema,
    });
    const [photoURL, setPhotoURL] = useState(scene.photoUrl);
    const [performers, setPerformers] = useState<PerformerInfo[]>(
        scene.performers.map((p) => ({
            displayName: p.performer.displayName,
            uuid: p.performer.uuid,
            id: p.performer.id,
            name: p.performer.name,
            alias: p.alias,
            gender: p.performer.gender
        }))
    );
    const { loading: loadingStudios, data: studios } = useQuery<Studios>(StudioQuery, {
        variables: { skip: 0, limit: 1000 }
    });
    useEffect(() => {
        register({ name: 'studioId' });
        setValue('studioId', scene.studio.id);
    }, [register]);

    if (loadingStudios)
        return <LoadingIndicator message="Loading scene..." />;

    const onURLChange = (e: React.ChangeEvent<HTMLInputElement>) => (
        setPhotoURL(e.currentTarget.value));
    const onStudioChange = (selectedOption:{label:string, value:number}) => (
        setValue('studioId', selectedOption.value));

    const onSubmit = (data:SceneFormData) => {
        const output = { ...data };
        if (data.date !== null)
            if (data.date.length === 10)
                output.dateAccuracy = 3;
            else if (data.date.length === 7) {
                output.dateAccuracy = 2;
                output.date = `${data.date}-01`;
            } else {
                output.dateAccuracy = 1;
                output.date = `${data.date}-01-01`;
            }
        delete output.performers;
        callback(output, data.performers);
    };

    const studioObj = studios.getStudios.map((studio) => ({ value: studio.id, label: studio.title }));

    const addPerformer = (result:PerformerResult) => setPerformers(
        [...performers, {
            name: result.name, displayName: result.displayName, uuid: result.uuid, gender: result.gender, id: result.id
        }]
    );
    const removePerformer = (uuid:string) => setPerformers(performers.filter((p) => p.uuid !== uuid));
    const performerList = performers.map((p, index) => (
        <div className="performer-item" key={p.uuid}>
            <button className="performer-remove" type="button" onClick={removePerformer.bind(null, p.uuid)}>
                <FontAwesomeIcon icon={faTimesCircle} />
            </button>
            <GenderIcon gender={p.gender} />
            <input type="hidden" value={p.id} name={`performers[${index}].performerId`} ref={register} />
            <span className="performer-name">{p.displayName}</span>
            <label htmlFor={`performers[${index}].alias`}>
                <div>Alias used: </div>
                <input
                    className="performer-alias"
                    type="text"
                    name={`performers[${index}].alias`}
                    defaultValue={p.alias !== p.name ? p.alias : ''}
                    placeholder={p.name}
                    ref={register}
                />
            </label>
        </div>
    ));

    return (
        <form
            className={cx('SceneForm', { 'was-validated': Object.keys(errors).length })}
            onSubmit={handleSubmit(onSubmit)}
        >
            <div className="row">
                <div className="col-6">
                    <div className="form-group row">
                        <div className="col-8">
                            <label htmlFor="title">
                                <div>Title</div>
                                <input
                                    className={cx('form-control', { 'is-invalid': errors.title })}
                                    type="text"
                                    placeholder="Title"
                                    name="title"
                                    defaultValue={scene.title}
                                    ref={register({ required: true })}
                                />
                            </label>
                        </div>
                        <div className="col-4">
                            <label htmlFor="date">Date</label>
                            <input
                                className="form-control"
                                type="text"
                                placeholder="YYYY-MM-DD"
                                name="date"
                                defaultValue={getFuzzyDate(scene.date, scene.dateAccuracy)}
                                ref={register}
                            />
                        </div>
                    </div>

                    <div className="form-group row">
                        <div className="col">
                            <label htmlFor="performers">Performers</label>
                            { performerList }
                            <div className="add-performer">
                                <span>Add performer:</span>
                                <SearchField onClick={addPerformer} searchType={SearchType.Performer} />
                            </div>
                        </div>
                    </div>


                    <div className="form-group row">
                        <div className="col-6">
                            <label htmlFor="studioId">
                                <div>Studio</div>
                                <Select
                                    name="studioId"
                                    onChange={onStudioChange}
                                    options={studioObj}
                                    defaultValue={studioObj.find((s) => s.value === scene.studio.id)}
                                />
                            </label>
                        </div>
                        <div className="col-6">
                            <div className="form-group">
                                <label htmlFor="studioUrl">
                                    <div>Studio URL</div>
                                    <input
                                        type="url"
                                        className="form-control"
                                        name="studioUrl"
                                        defaultValue={scene.studioUrl}
                                        ref={register}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="form-group row">
                        <div className="col">
                            <label htmlFor="description">
                                <div>Description</div>
                                <textarea
                                    className="form-control description"
                                    placeholder="Description"
                                    name="description"
                                    defaultValue={scene.description}
                                    ref={register}
                                />
                            </label>
                        </div>
                    </div>

                    <div className="form-group button-row">
                        <input className="btn btn-primary col-2 save-button" type="submit" value="Save" />
                        <input className="btn btn-secondary offset-6 reset-button" type="reset" />
                        <Link to={scene.uuid ? `/scene/${scene.uuid}` : '/scenes'}>
                            <button className="btn btn-danger reset-button" type="button">Cancel</button>
                        </Link>
                    </div>
                </div>
                <div className="col-6">
                    <div className="form-group">
                        <label htmlFor="photoUrl">
                            <div>Photo URL</div>
                            <input
                                type="url"
                                className="form-control"
                                name="photoUrl"
                                onChange={onURLChange}
                                defaultValue={scene.photoUrl}
                                ref={register}
                            />
                        </label>
                    </div>
                    <img src={photoURL} alt="" />
                </div>
            </div>
        </form>
    );
};

export default SceneForm;
