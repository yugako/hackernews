import React, { Component } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import './App.css';

const DEFAULT_QUERY = 'redux';
const DEFAULT_HPP = 100;

const PATH_BASE = 'https://hn.algolia.com/api/v1';
const PATH_SEARCH = '/search';
const PARAM_SEARCH = 'query=';
const PARAM_PAGE = 'page=';
const PARAM_HPP = 'hitsPerPage=';
const Search = ({value, onChange, onSubmit, children}) =>
   (
    <form onSubmit={onSubmit}>
        <input 
          type='text'
          value={value}
          onChange={onChange} 
        />
        <button type='submit'>
          {children}
        </button>
    </form>
);
Search.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  children: PropTypes.node
}

const Table = ({ list, onDismiss }) =>
   (
    <div className="table">
      {list.map((item) => {
        return (<div key={item.objectID} className="table-row">
          <span style={{width: '40%'}}>
            <a href={item.url}>{item.title}</a>
          </span>
           <span style={{width: '30%'}}>
            {item.author}
          </span>
          <span style={{width: '10%'}}>
            {item.num_comments}
          </span>
          <span style={{width: '10%'}}>
            {item.points}
          </span>
          <span style={{width: '10%'}}>
          <Button 
            onClick={() => onDismiss(item.objectID)}
            className='button-inline'
          >
            Delete
          </Button>
          </span>
        </div>);
      })
    }
    </div>

  );


class Button extends Component {
  render() {
    const {
      onClick,
      className= '',
      children
    } = this.props;

    return (
      <button
        onClick={onClick}
        className={className}
        type='button'
      >{children}
      </button>
    );
  }
}

class App extends Component {
  _isMounted = false;
  constructor(props) {
    super(props);
    this.state = {
      results: null,
      searchKey: '',
      searchTerm: DEFAULT_QUERY,
      error: null,
    };

    this.setSearchTopStories = this.setSearchTopStories.bind(this);
    this.onDismiss = this.onDismiss.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.onSearchSubmit = this.onSearchSubmit.bind(this);
    this.fetchSearchTopStories = this.fetchSearchTopStories.bind(this);
    this.needsToSearchTopStories = this.needsToSearchTopStories.bind(this);
  }
  needsToSearchTopStories(searchTerm) {
    return !this.state.results[searchTerm];
  }
  setSearchTopStories(result) {
    const { hits, page } = result;
    const {searchKey, results} = this.state;

    const oldHits = results && results[searchKey]
      ? results[searchKey].hits
      : []

    const updatedList = [
      ...oldHits,
      ...hits
    ];
    this.setState({
      results: {
        ...results,
        [searchKey]: {hits: updatedList, page}
      }
    });
  }

  fetchSearchTopStories(searchTerm, page = 0) {
    axios(`${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_PAGE}${page}&${PARAM_HPP}${DEFAULT_HPP}`)
      .then(result => this._isMounted && this.setSearchTopStories(result.data))
      .catch(error => this._isMounted && this.setState({error}));
  }
  componentDidMount() {
    this._isMounted = true;
    const { searchTerm } = this.state;
    this.setState({searchKey: searchTerm})
    this.fetchSearchTopStories(searchTerm);
  }
  componentWillUnmount() {
    this._isMounted = false;
  }
  onDismiss(id) {
    const { searchKey, results } = this.state;
    const { hits, page } = results[searchKey];
    const isNotId = item => item.objectID !== id;
    const updatedHits = hits.filter(isNotId);
    this.setState({
      results: {
        ...results,
        [searchKey]: { hits: updatedHits, page }
      }
    });
  }

  onSearchChange (e) {
    this.setState({
      searchTerm: e.target.value,
    })
  }

  onSearchSubmit(e) {
    const {searchTerm} = this.state;
    this.setState({searchKey: searchTerm})

    if (this.needsToSearchTopStories(searchTerm)) {
      this.fetchSearchTopStories(searchTerm);
    }
    
    e.preventDefault();
  }
  render() {
    const {
      searchTerm,
      results,
      searchKey,
      error
    } = this.state;
    const page = (
      results &&
      results[searchKey] &&
      results[searchKey].page
    ) || 0;
    const list = (
      results &&
      results[searchKey] &&
      results[searchKey].hits
    ) || [];


    return (
      <div className="page">
        <div className="interactions">
          <Search 
            value={searchTerm}
            onChange={this.onSearchChange}
            onSubmit={this.onSearchSubmit}
           >
            Пошук
           </Search> 
          </div>
          {error
            ? <div className='interactions'>
                <p>Щось пішло не так</p>
              </div>
            :
            <Table
              list={list}
              onDismiss={this.onDismiss}
            />
          }
          
        <div className="interactions">
          <Button onClick={() => this.fetchSearchTopStories(searchKey, page + 1)}>
          Більше історій
          </Button>
        </div>
      </div>
    );
  }
}

export default App;

export {
  Button,
  Search,
  Table,
}