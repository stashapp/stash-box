import React, { useState } from 'react';
import { RouteComponentProps, Link } from '@reach/router';
import useForm from 'react-hook-form';
import * as yup from 'yup';

import { Studio_getStudio as Studio } from 'src/definitions/Studio';

const nullCheck = ((input:string|null) => (input === '' || input === 'null' ? null : input));

const schema = yup.object().shape({
    title: yup.string().required(),
    url: yup.string().url().transform(nullCheck).nullable(),
    photoURL: yup.string().url().transform(nullCheck).nullable()
});

interface StudioProps extends RouteComponentProps<{
    studio: Studio,
    callback: (data:Object) => void
}>{}

const StudioForm: React.FC<StudioProps> = ({ studio, callback }) => {
    const { register, handleSubmit } = useForm({
        validationSchema: schema,
    });
    const [photoURL, setPhotoURL] = useState(studio.photoUrl);

    const onURLChange = (e: React.ChangeEvent<HTMLInputElement>) => (
        setPhotoURL(e.currentTarget.value));

    const onSubmit = (data:Object) => {
        callback(data);
    };

    return (
        <form className="StudioForm" onSubmit={handleSubmit(onSubmit)}>
            <div className="row StudioForm-body">
                <div className="col-8">
                    <div className="form-group row">
                        <div className="col-6">
                            <label htmlFor="title">
                                <div>Title</div>
                                <input
                                    className="form-control"
                                    type="text"
                                    placeholder="Title"
                                    name="title"
                                    defaultValue={studio.title}
                                    ref={register({ required: true })}
                                />
                            </label>
                        </div>
                    </div>
                    <div className="form-group row">
                        <div className="col-6">
                            <label htmlFor="url">
                                <div>URL</div>
                                <input
                                    className="form-control"
                                    type="text"
                                    placeholder="URL"
                                    name="url"
                                    defaultValue={studio.url}
                                    ref={register}
                                />
                            </label>
                        </div>
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
                                defaultValue={studio.photoUrl}
                                ref={register}
                            />
                        </label>
                    </div>
                    <img src={photoURL} alt="Performer" />
                </div>
            </div>

            <div className="form-group">
                <input className="btn btn-primary col-2 save-button" type="submit" value="Save" />
                <input className="btn btn-secondary offset-6 reset-button" type="reset" />
                <Link to={studio.uuid ? `/studio/${studio.uuid}` : '/studios'}>
                    <button className="btn btn-danger reset-button" type="button">Cancel</button>
                </Link>
            </div>
        </form>
    );
};

export default StudioForm;
