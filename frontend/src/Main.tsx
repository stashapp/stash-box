import React from 'react';
import { Navbar, Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import SearchField, { SearchType } from 'src/components/searchField';
import AuthContext from './AuthContext';

const Main: React.FC = ({ children }) => {
    /*
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
    */

    const user = {
        username: 'User',
        role: 2
    };
    const contextValue = {
        authenticated: true,
        user
    };


    return (
        <div>
            <Navbar bg="light" expand="lg">
                <Nav className="mr-auto">
                    <NavLink exact to="/" className="nav-link">Home</NavLink>
                    <NavLink to="/performers" className="nav-link">Performers</NavLink>
                    <NavLink to="/scenes" className="nav-link">Scenes</NavLink>
                    <NavLink to="/studios" className="nav-link">Studios</NavLink>
                    <NavLink exact to="/performers/add" className="nav-link">Add Performer</NavLink>
                    <NavLink exact to="/scenes/add" className="nav-link">Add Scene</NavLink>
                    <NavLink exact to="/studios/add" className="nav-link">Add Studio</NavLink>
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
