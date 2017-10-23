var React = require('react');
var Link = require('react-router');

export const Header = (props) => {
    return (
        <div>
            <div>
            <Link to="/vehicle">Vehicle</Link>
            <Link to="/maintenance">Maintenance</Link>
            <Link to="/customer">Customer</Link>
            <Link to="/about">About</Link>
            </div>
        </div>
    );
};
