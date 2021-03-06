import { Controller, provide } from 'cerebral'
import Devtools from 'cerebral/devtools'
import uuid from 'uuid'
import Router from '@cerebral/router'
import { redirect } from '@cerebral/router/operators'
import StorageProvider from '@cerebral/storage'
import { set, toggle, unset, when } from 'cerebral/operators'
import { props, state } from 'cerebral/tags'
import addTodo from './actions/addTodo'
import toggleAllChecked from './actions/toggleAllChecked'
import clearCompletedTodos from './actions/clearCompletedTodos'

const controller = Controller({
  devtools: Devtools({ host: 'localhost:8787' }),
  providers: [
    provide('uuid', uuid),
    StorageProvider({
      target: window.localStorage,
      sync: { todos: 'todos' },
      prefix: 'todomvc',
    }),
  ],
  state: {
    newTodoTitle: '',
    todos: window.localStorage.getItem('todomvc.todos')
      ? JSON.parse(window.localStorage.getItem('todomvc.todos'))
      : {},
    filter: 'all',
    editingUid: null,
  },
  signals: {
    rootRouted: redirect('/all'),
    newTodoTitleChanged: set(state`newTodoTitle`, props`title`),
    newTodoSubmitted: [
      when(state`newTodoTitle`),
      {
        true: [addTodo, set(state`newTodoTitle`, '')],
        false: [],
      },
    ],
    todoNewTitleChanged: set(
      state`todos.${props`uid`}.editedTitle`,
      props`title`
    ),
    todoNewTitleSubmitted: [
      when(state`todos.${props`uid`}.editedTitle`),
      {
        true: [
          set(
            state`todos.${props`uid`}.title`,
            state`todos.${props`uid`}.editedTitle`
          ),
          unset(state`todos.${props`uid`}.editedTitle`),
          set(state`editingUid`, null),
        ],
        false: [],
      },
    ],
    removeTodoClicked: [unset(state`todos.${props`uid`}`)],
    todoDoubleClicked: [
      set(
        state`todos.${props`uid`}.editedTitle`,
        state`todos.${props`uid`}.title`
      ),
      set(state`editingUid`, props`uid`),
    ],
    toggleAllChanged: [toggleAllChecked],
    toggleTodoCompletedChanged: [toggle(state`todos.${props`uid`}.completed`)],
    todoNewTitleAborted: [
      unset(state`todos.${props`uid`}.editedTitle`),
      set(state`editingUid`, null),
    ],
    clearCompletedClicked: [clearCompletedTodos],
    filterClicked: [set(state`filter`, props`filter`)],
  },
  modules: {
    router: Router({
      onlyHash: true,
      filterFalsy: false,
      routes: [
        { path: '/', signal: 'rootRouted' },
        // simple map to signal. all parsed path and queries params goes to signal
        // {path: '/:filter', signal: 'app.filterClicked'}
        // map to signal + state
        {
          path: '/:filterName',
          signal: 'filterClicked',
          map: {
            // We could remove filterClicked signal above with
            // filterName: state`filter`
            filterName: props`filter`,
            todos: state`newTodoTitle`,
          },
        },
        // map to state only.
        // {path: '/:filterName', map: {filterName: state`app.filter`, title: state`app.newTodoTitle`}}
      ],
    }),
  },
})

export default controller
