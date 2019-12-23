import React from 'react';
import { faVenus, faTransgenderAlt, faMars } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface IconProps {
    gender: string;
}

const GenderIcon: React.FC<IconProps> = ({ gender }) => {
    const icon = gender.toLowerCase() === 'male' ? faMars
        : gender.toLowerCase() === 'female' ? faVenus : faTransgenderAlt;
    return <FontAwesomeIcon icon={icon} />;
};

export default GenderIcon;
