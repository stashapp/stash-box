import React, { useState } from 'react';
import { Button } from 'react-bootstrap';

import { Icon } from 'src/components/fragments';
import { URL, sortImageURLs } from 'src/utils/transforms';


interface ImageCarouselProps {
    urls: URL[];
    orientation?: 'portrait'|'landscape';
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ urls, orientation }) => {
    const [activeImage, setActiveImage] = useState(0);
    const images = sortImageURLs(urls, orientation);

    if (images.length === 0)
        return <div />;

    const setNext = () => (
        setActiveImage(activeImage === images.length - 1 ? 0 : activeImage + 1)
    );
    const setPrev = () => (
        setActiveImage(activeImage === 0 ? images.length - 1 : activeImage - 1)
    );

    return (
        <div className="image-carousel">
            <img src={images[activeImage].url} alt="" className="image-carousel-img" />
            <div className="d-flex align-items-center">
                <Button className="mr-auto" onClick={setPrev}>
                    <Icon icon="arrow-left" />
                </Button>
                <h5>Image {activeImage + 1} of {images.length}</h5>
                <Button className="ml-auto" onClick={setNext}>
                    <Icon icon="arrow-right" />
                </Button>
            </div>
        </div>
    );
};

export default ImageCarousel;
