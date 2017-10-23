var React = require('react');
var ReactDOM = require('react-dom');

var Routes = require('./routes');

class App extends React.Component {
    render() {
        return (
            <div>
            <table>
            <tbody>
            <tr>
            <th>First Name</th>
        <th>Last Name</th>
        <th>Description</th>
        <th>Manager</th>
        <th></th>
        <th></th>
        </tr>
        </tbody>
        </table>
        </div>
    )
    }
}

ReactDOM.render(Routes, document.getElementById('app'));
