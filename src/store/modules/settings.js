const state = {
  theme: localStorage.getItem('theme') || 'default',
  themeColor: localStorage.getItem('themeColor') || '#2b3a4a',
  themeTitleColor: localStorage.getItem('themeTitleColor') || '#1f2d3d',
  menuTextColor: localStorage.getItem('menuTextColor') || '#bfcbd9',
  menuActiveTextColor: localStorage.getItem('menuActiveTextColor') || '#409eff',
};

const mutations = {
  CHANGE_THEME: (state, {
    name, color, titleColor, textColor, activeTextColor,
  }) => {
    state.theme = name;
    state.themeColor = color;
    state.themeTitleColor = titleColor;
    state.menuTextColor = textColor;
    state.menuActiveTextColor = activeTextColor;
    localStorage.setItem('theme', name);
    localStorage.setItem('themeColor', color);
    localStorage.setItem('themeTitleColor', titleColor);
    localStorage.setItem('menuTextColor', textColor);
    localStorage.setItem('menuActiveTextColor', activeTextColor);

    // 更新 CSS 变量
    document.documentElement.style.setProperty('--sidebar-bg-color', color);
    document.documentElement.style.setProperty('--sidebar-title-bg-color', titleColor);
  },
};

const actions = {
  changeTheme({ commit }, payload) {
    commit('CHANGE_THEME', payload);
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
};
