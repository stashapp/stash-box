import { FC, useState } from "react";
import { Button, Form } from "react-bootstrap";

import { FingerprintAlgorithm, useScene } from "src/graphql";
import { Icon } from "src/components/fragments";
import List from "src/components/list/List";
import { Link } from "react-router-dom";
import { sceneHref, studioHref, formatDuration } from "src/utils";
import Modal from "src/components/modal";
import { faCheckCircle, faCircleXmark, faTimesCircle, faVideo } from "@fortawesome/free-solid-svg-icons";
import { boolean } from "yup";
import { Checkboxes } from "./UserSceneList";

const PER_PAGE = 20;

interface Props {
  sceneId: string,
  deleteFingerprint: (sceneId: string, hash: string, algo: FingerprintAlgorithm, duration: number) => void
}

const UserSceneLine: FC<Props> = ({ sceneId, deleteFingerprint }) => {
    const { loading, data } = useScene({ id: sceneId });
    const scene = data?.findScene;

    if (!scene){
        return (
            <tr key={sceneId}>
                <td colSpan={0} ></td>
            </tr>
        )
    }

    const filteredFingerprints = scene.fingerprints.filter((fing) => (fing.user_submitted))
    const initialCheckboxes:Checkboxes = {}
    filteredFingerprints.forEach(fing => {
        initialCheckboxes[scene.id+'_'+fing.hash] = false
    })


    const [checked, setChecked] = useState<Checkboxes>(initialCheckboxes)
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name
        setChecked(prevState => ({
            ...prevState,
            [name]: !prevState[name]
        }))
    }

    const getFingerprintLines = (sceneId: string, alg: FingerprintAlgorithm) => {
        const reFilteredFingerprints = scene.fingerprints.filter((fing) => (fing.algorithm == alg))

        const ret = reFilteredFingerprints.map((fing, index) => {
            const fing_id = scene.id+'_'+fing.hash
            
            return (
            <div key={fing_id}>
                <Form.Check
                    inline
                    type='checkbox'
                    id={fing_id+'_'+index}
                    name={fing_id}
                    aria-label='select this fingerprint for deletion'
                    checked={checked[fing_id]}
                    onChange={handleChange}
                />
                {fing.hash} ({formatDuration(fing.duration)})
                <span
                className="user-submitted "
                title="Submitted by you - click to remove submission"
                onClick={() => deleteFingerprint(scene.id,fing.hash, fing.algorithm, fing.duration)}
                >
                    <Icon icon={faCheckCircle} />
                    <Icon icon={faTimesCircle} />
                </span>
            </div>
        )}
        )

        return ret

    }


    return (
        <tr key={scene.id}>
            <td><Link className="text-truncate w-100" to={sceneHref(scene)}>{scene.title}</Link></td>
            <td>{scene.studio && (
                    <Link
                    to={studioHref(scene.studio)}
                    className="float-end text-truncate SceneCard-studio-name"
                    >
                    <Icon icon={faVideo} className="me-1" />
                    {scene.studio.name}
                    </Link>
                )}</td>
            <td>{scene.duration ? formatDuration(scene.duration) : ""}</td>
            <td>{scene.release_date}</td>
            <td>{getFingerprintLines(scene.id, FingerprintAlgorithm.PHASH)}</td>
            <td>{getFingerprintLines(scene.id, FingerprintAlgorithm.OSHASH)}</td>
            <td>{getFingerprintLines(scene.id, FingerprintAlgorithm.MD5)}</td>
        </tr>
    );
};

export default UserSceneLine;