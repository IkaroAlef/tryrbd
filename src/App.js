import React, { Component } from 'react';

// import loadGraph from './loadGraph';
import Teste from './teste';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    /* const graphContainer = document.querySelector('#graphContainer');
    const toolbarContainer = document.querySelector('#toolbarContainer');
    const sidebarContainer = document.querySelector('#sidebarContainer');
    const outlineContainer = document.querySelector('#outlineContainer');
    const statusContainer = document.querySelector('#statusContainer');
    loadGraph(
      graphContainer,
      outlineContainer,
      toolbarContainer,
      sidebarContainer,
      statusContainer
    ); */
  }

  render() {
    return <Teste />;
  }
}
