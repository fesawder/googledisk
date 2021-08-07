function Welcome(props) {
    return React.createElement(
        "h1",
        null,
        "\u041F\u0440\u0438\u0432\u0435\u0442, ",
        props.name
    );
}

function App() {
    return React.createElement(
        "div",
        null,
        React.createElement(Welcome, { name: "\u0410\u043B\u0438\u0441\u0430" }),
        React.createElement(Welcome, { name: "\u0411\u0430\u0437\u0438\u043B\u0438\u043E" }),
        React.createElement(Welcome, { name: "\u0411\u0443\u0440\u0430\u0442\u0438\u043D\u043E" })
    );
}

ReactDOM.render(React.createElement(App, null), document.getElementById('root'));