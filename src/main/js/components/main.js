var React = require('react');

var Link = require('react-router').Link;

module.exports = React.createClass({
    render: function() {
        return (
            <div className="container">
                <div className="row">
                    <div className="col-xs-15">
                        <nav className="navbar navbar-default">
                            <div className="container">
                                <div className="navbar-header">
                                    <ul className="nav navbar-nav">
                                        <li><Link to="/vehicle">Vehicle</Link></li>
                                        <li><Link to="/maintenance">Maintenance</Link></li>
                                        <li><Link to="/customer">Customer</Link></li>
                                        <li><Link to="/about">About</Link></li>
                                    </ul>
                                </div>
                            </div>
                        </nav>
                    </div>
                    <hr/>
                    <div className="row">
                        <div className="col-xs-15">
                                {this.props.children}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
});