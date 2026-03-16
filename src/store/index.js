import { createStore } from 'vuex';
import getters from './getters';
import app from './modules/app';
import user from './modules/user';
import settings from './modules/settings';

const store = createStore({
  modules: {
    app,
    user,
    settings,
  },
  getters,
});

export default store;
