var React = require('react');

var Link = require('react-router').Link;

module.exports = React.createClass({
    render: function() {
        return (
            <div className="container">
                <div className="row">
                    <div className="col-xs-10 col-xs-offset-1">
                        <nav className="navbar navbar-default">
                            <div className="container">
                                <div className="navbar-header">
                                    <ul className="nav navbar-nav">
                                        <li><Link to="/vehicle" activeStyle={{color: "red"}}>Vehicle</Link></li>
                                        <li><Link to="/maintenance" activeClassName={"active"}>Maintenance</Link></li>
                                        <li><Link to="/person" activeClassName={"active"}>Person</Link></li>
                                        <li><Link to="/about" activeClassName={"active"}>About</Link></li>
                                    </ul>
                                </div>
                            </div>
                        </nav>
                    </div>
                </div>
                <hr/>
                <div className="row">
                    <div className="col-xs-10 col-xs-offset-1">
                        {this.props.children}
                    </div>
                </div>
            </div>
        )
    }
});