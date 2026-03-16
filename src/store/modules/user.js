import {
  login as loginApi,
  getInfo as getInfoApi,
  logout as logoutApi,
  updateAvatar as updateAvatarApi,
  getMenus as getMenusApi,
} from '@/api/user';
import router from '@/router';
import { buildRoutes } from '@/router/routeComponents';

const state = {
  token: localStorage.getItem('token') || '',
  id: null,
  name: '',
  avatar: '',
  roles: [],
  permissions: [],
  menus: [],
  routesAdded: false,
};

const mutations = {
  SET_TOKEN: (state, token) => { state.token = token; },
  SET_ID: (state, id) => { state.id = id; },
  SET_NAME: (state, name) => { state.name = name; },
  SET_AVATAR: (state, avatar) => { state.avatar = avatar; },
  SET_ROLES: (state, roles) => { state.roles = roles; },
  SET_PERMISSIONS: (state, permissions) => { state.permissions = permissions; },
  SET_MENUS: (state, menus) => { state.menus = menus; },
  SET_ROUTES_ADDED: (state, val) => { state.routesAdded = val; },
};

const actions = {
  login({ commit }, userInfo) {
    const { username, password } = userInfo;
    return loginApi({ username: username.trim(), password })
      .then((res) => {
        const { token } = res.data;
        commit('SET_TOKEN', token);
        localStorage.setItem('token', token);
      });
  },

  getInfo({ commit, state }) {
    return getInfoApi(state.token).then((res) => {
      const { data } = res;
      commit('SET_ID', data.id);
      commit('SET_NAME', data.first_name || data.username);
      commit('SET_AVATAR', data.avatar);
      commit('SET_ROLES', data.roles || ['dev']);
      commit('SET_PERMISSIONS', data.permissions || []);
      return data;
    });
  },

  fetchMenus({ commit, state }) {
    return getMenusApi().then((res) => {
      const menus = res.data || [];
      commit('SET_MENUS', menus);

      // 只添加一次动态路由
      if (!state.routesAdded) {
        const dynamicRoutes = buildRoutes(menus);
        dynamicRoutes.forEach((route) => router.addRoute(route));
        commit('SET_ROUTES_ADDED', true);
      }
    });
  },

  logout({ commit }) {
    return logoutApi().then(() => {
      commit('SET_TOKEN', '');
      commit('SET_ROLES', []);
      commit('SET_MENUS', []);
      commit('SET_ROUTES_ADDED', false);
      localStorage.removeItem('token');
    });
  },

  resetToken({ commit }) {
    return new Promise((resolve) => {
      commit('SET_TOKEN', '');
      commit('SET_ROLES', []);
      commit('SET_MENUS', []);
      commit('SET_ROUTES_ADDED', false);
      localStorage.removeItem('token');
      resolve();
    });
  },

  updateAvatar({ commit }, avatar) {
    return updateAvatarApi(avatar).then(() => {
      commit('SET_AVATAR', avatar);
    });
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
};
