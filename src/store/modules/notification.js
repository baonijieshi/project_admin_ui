import {
  getUnreadCount, markAsRead, markAllAsRead, clearAll as clearAllApi,
} from '@/api/notification';

const state = {
  unreadCount: 0,
  pollTimer: null,
};

const mutations = {
  SET_UNREAD_COUNT: (state, count) => { state.unreadCount = count; },
  SET_POLL_TIMER: (state, timer) => { state.pollTimer = timer; },
};

let visibilityHandler = null;

const actions = {
  fetchUnreadCount({ commit }) {
    return getUnreadCount()
      .then((res) => {
        commit('SET_UNREAD_COUNT', res.data.count);
      })
      .catch(() => {
        // 静默忽略，下次轮询重试
      });
  },

  startPolling({ dispatch, commit, state }) {
    // 防止重复启动
    if (state.pollTimer) {
      clearInterval(state.pollTimer);
    }

    // 立即请求一次
    dispatch('fetchUnreadCount');

    // 30 秒定时轮询
    const timer = setInterval(() => {
      dispatch('fetchUnreadCount');
    }, 30000);
    commit('SET_POLL_TIMER', timer);

    // visibilitychange 监听：页面隐藏时暂停，可见时立即请求并恢复
    visibilityHandler = () => {
      if (document.hidden) {
        // 页面隐藏，暂停轮询
        if (state.pollTimer) {
          clearInterval(state.pollTimer);
          commit('SET_POLL_TIMER', null);
        }
      } else {
        // 页面可见，立即请求并恢复轮询
        dispatch('fetchUnreadCount');
        const newTimer = setInterval(() => {
          dispatch('fetchUnreadCount');
        }, 30000);
        commit('SET_POLL_TIMER', newTimer);
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);
  },

  stopPolling({ commit, state }) {
    if (state.pollTimer) {
      clearInterval(state.pollTimer);
      commit('SET_POLL_TIMER', null);
    }
    if (visibilityHandler) {
      document.removeEventListener('visibilitychange', visibilityHandler);
      visibilityHandler = null;
    }
  },

  markRead({ dispatch }, id) {
    return markAsRead(id).then(() => {
      dispatch('fetchUnreadCount');
    });
  },

  markAllRead({ commit }) {
    return markAllAsRead().then(() => {
      commit('SET_UNREAD_COUNT', 0);
    });
  },

  clearAll({ commit }) {
    return clearAllApi().then(() => {
      commit('SET_UNREAD_COUNT', 0);
    });
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
};
