import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@apollo/react-hooks';
import { Navbar, Nav } from 'react-bootstrap';
import { NavLink, useHistory } from 'react-router-dom';
import SearchField, { SearchType } from 'src/components/searchField';
import ME from 'src/queries/Me.gql';
import { Me } from 'src/definitions/Me';
import AuthContext from './AuthContext';

const Main: React.FC = ({ children }) => {
    const history = useHistory();
    const [user, setUser] = useState(undefined);
    const prevUser = useRef();
    const { loading } = useQuery<Me>(ME, {
        onCompleted: (data) => setUser(data.me),
        onError: () => setUser(null)
    });

    useEffect(() => {
        if (user === null)
            history.push('/login');
        else if (prevUser.current === null)
            history.push('/');
        prevUser.current = user;
    }, [user]);


    if (loading)
        return <div>Loading...</div>;

    const isRole = (role: string) => (
        (user?.roles ?? []).includes(role)
    );

    const contextValue = user ? {
        authenticated: true,
        user,
        isRole
    } : {
        authenticated: false,
        setUser,
    };

    if (!contextValue.authenticated)
        return (
            <AuthContext.Provider value={contextValue}>
                { children }
            </AuthContext.Provider>
        );

    const handleLogout = async () => {
        const res = await fetch('/logout');
        if (res.ok)
            window.location.href = '/';
        return false;
    };

    const renderUserNav = () => (
        contextValue.authenticated && (
            <>
                <span>Logged in as</span>
                <NavLink to={`/users/${contextValue.user.name}`} className="nav-link ml-auto mr-2">{contextValue.user.name}</NavLink>
                { isRole('ADMIN') && (
                    <NavLink exact to="/admin" className="nav-link">Admin</NavLink>
                )}
                <NavLink to="/logout" onClick={handleLogout} className="nav-link">Logout</NavLink>
            </>
        )
    );

    return (
        <div>
            <Navbar bg="dark" variant="dark" className="px-4">
                <Nav className="row mr-auto">
                    <NavLink exact to="/" className="nav-link">Home</NavLink>
                    <NavLink to="/performers" className="nav-link">Performers</NavLink>
                    <NavLink to="/scenes" className="nav-link">Scenes</NavLink>
                    <NavLink to="/studios" className="nav-link col-1">Studios</NavLink>
                </Nav>
                <Nav className="align-items-center">
                    { contextValue.authenticated && renderUserNav() }
                    <SearchField searchType={SearchType.Combined} />
                </Nav>
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
