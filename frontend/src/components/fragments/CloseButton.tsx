import React from 'react';
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface CloseButtonProps {
    handler: () => void;
    className?: string;
}

const CloseButton: React.FC<CloseButtonProps> = ({ handler, className }) => (
    <button type="button" onClick={handler} className={className || ''}>
        <FontAwesomeIcon icon={faTimesCircle} />
    </button>
);

export default CloseButton;
