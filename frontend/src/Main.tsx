import React, { useState, useEffect, useRef } from 'react';
import { Navbar, Nav } from 'react-bootstrap';
import { useQuery } from '@apollo/react-hooks';
import { RouteComponentProps, navigate, Link } from '@reach/router';
import AuthContext from './AuthContext';
import SearchField, { SearchType } from './components/searchField';

import { Me } from './definitions/Me';
import ME from './queries/Me.gql';

interface MainProps extends RouteComponentProps<{
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    children?: any
}>{}

const Main: React.FC<MainProps> = ({ children }) => {
    const [user, setUser] = useState(undefined);
    const prevUser = useRef();
    const { loading } = useQuery<Me>(ME, {
        onCompleted: (data) => setUser(data.me),
        onError: () => setUser(null)
    });

    useEffect(() => {
        if (user === null)
            navigate('/login');
        else if (prevUser.current === null)
            navigate('/');
        prevUser.current = user;
    }, [user]);


    if (loading)
        return <div>Loading...</div>;

    const contextValue = user !== null ? {
        authenticated: true,
        user
    } : {
        authenticated: false,
        setUser
    };

    if (!contextValue.authenticated)
        return (
            <AuthContext.Provider value={contextValue}>
                { children }
                {' '}
:
            </AuthContext.Provider>
        );


    return (
        <div>
            <Navbar bg="light" expand="lg">
                <Nav className="mr-auto">
                    <Link to="/" className="nav-link">Home</Link>
                    <Link to="/performers" className="nav-link">Performers</Link>
                    <Link to="/scenes" className="nav-link">Scenes</Link>
                    <Link to="/studios" className="nav-link">Studios</Link>
                    <Link to="/performer/add" className="nav-link">Add Performer</Link>
                    <Link to="/scene/add" className="nav-link">Add Scene</Link>
                    <Link to="/studio/add" className="nav-link">Add Studio</Link>
                </Nav>
                <div className="welcome">
Welcome
                    {user && user.username}
!
                </div>
                <SearchField searchType={SearchType.Combined} />
            </Navbar>
            <div className="StashDBContent container-fluid">
                <AuthContext.Provider value={contextValue}>
                    { children }
                </AuthContext.Provider>
            </div>
        </div>
    );
};

export default Main;
