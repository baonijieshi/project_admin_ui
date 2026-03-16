<template>
  <div class="theme-settings-container">
    <el-card>
      <template #header>
        <span>主题设置</span>
      </template>

      <div class="theme-content">
        <h3>侧边栏主题颜色</h3>
        <p class="description">选择您喜欢的侧边栏主题颜色</p>

        <div class="theme-colors">
          <div
            v-for="theme in themeColors"
            :key="theme.name"
            class="theme-item"
            :class="{ active: currentTheme === theme.name }"
            @click="changeTheme(theme.name)"
          >
            <div class="color-preview" :style="{ background: theme.color }">
              <el-icon v-if="currentTheme === theme.name" class="check-icon">
                <Check />
              </el-icon>
            </div>
            <span class="theme-name">{{ theme.label }}</span>
          </div>
        </div>

        <el-divider />

        <div class="custom-color-section">
          <h4>自定义颜色</h4>
          <p class="description">选择任意颜色作为侧边栏主题</p>
          <div class="custom-color-picker">
            <el-color-picker
              v-model="customColor"
              show-alpha
              @change="handleCustomColorChange"
            />
            <el-button type="primary" @click="applyCustomColor">
              应用自定义颜色
            </el-button>
            <el-button @click="resetTheme">
              恢复默认
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { ElMessage } from 'element-plus';

const store = useStore();
const customColor = ref('#2b3a4a');

const themeColors = [
  {
    name: 'default',
    label: '默认蓝',
    color: '#2b3a4a',
    titleColor: '#1f2d3d',
    textColor: '#c8d4e3',
    activeTextColor: '#66b1ff',
  },
  {
    name: 'dark',
    label: '深邃黑',
    color: '#1f1f1f',
    titleColor: '#0a0a0a',
    textColor: '#a8a8a8',
    activeTextColor: '#ffffff',
  },
  {
    name: 'green',
    label: '清新绿',
    color: '#2d5a3f',
    titleColor: '#1e3d2a',
    textColor: '#b8e6c9',
    activeTextColor: '#67c23a',
  },
  {
    name: 'purple',
    label: '优雅紫',
    color: '#4a3a5a',
    titleColor: '#342842',
    textColor: '#d4c5e0',
    activeTextColor: '#e0b3ff',
  },
  {
    name: 'orange',
    label: '活力橙',
    color: '#d4825f',
    titleColor: '#b86d4a',
    textColor: '#3d2817',
    activeTextColor: '#8b4513',
  },
  {
    name: 'red',
    label: '热情红',
    color: '#c03639',
    titleColor: '#9a2b2d',
    textColor: '#ffd4d5',
    activeTextColor: '#ffe5e6',
  },
  {
    name: 'teal',
    label: '青色',
    color: '#2c7a7b',
    titleColor: '#1f5a5b',
    textColor: '#b8e6e7',
    activeTextColor: '#5eead4',
  },
];

const currentTheme = computed(() => store.state.settings.theme);

const changeTheme = (themeName) => {
  const theme = themeColors.find((t) => t.name === themeName);
  if (theme) {
    store.dispatch('settings/changeTheme', {
      name: themeName,
      color: theme.color,
      titleColor: theme.titleColor,
      textColor: theme.textColor,
      activeTextColor: theme.activeTextColor,
    });
    ElMessage.success('主题已更换');
  }
};

const handleCustomColorChange = (color) => {
  customColor.value = color;
};

const applyCustomColor = () => {
  if (customColor.value) {
    const darkerColor = adjustColorBrightness(customColor.value, -20);
    const { textColor, activeTextColor } = generateTextColors(customColor.value);

    store.dispatch('settings/changeTheme', {
      name: 'custom',
      color: customColor.value,
      titleColor: darkerColor,
      textColor,
      activeTextColor,
    });
    ElMessage.success('自定义主题已应用');
  }
};

const resetTheme = () => {
  changeTheme('default');
};

const adjustColorBrightness = (color, percent) => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const amt = Math.round(2.55 * percent);
  const newR = Math.min(255, Math.max(0, r + amt));
  const newG = Math.min(255, Math.max(0, g + amt));
  const newB = Math.min(255, Math.max(0, b + amt));
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
};

// 根据背景色生成和谐的文字颜色
const generateTextColors = (bgColor) => {
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // 计算亮度
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  const isLight = brightness >= 128;

  let textColor;
  let activeTextColor;

  if (isLight) {
    // 浅色背景：使用深色文字
    // 基于背景色的色相，生成深色文字
    const darkR = Math.max(0, Math.floor(r * 0.2));
    const darkG = Math.max(0, Math.floor(g * 0.2));
    const darkB = Math.max(0, Math.floor(b * 0.2));
    textColor = `#${toHex(darkR)}${toHex(darkG)}${toHex(darkB)}`;

    // 激活色：更深一些
    const activeDarkR = Math.max(0, Math.floor(r * 0.15));
    const activeDarkG = Math.max(0, Math.floor(g * 0.15));
    const activeDarkB = Math.max(0, Math.floor(b * 0.15));
    activeTextColor = `#${toHex(activeDarkR)}${toHex(activeDarkG)}${toHex(activeDarkB)}`;
  } else {
    // 深色背景：使用浅色文字
    // 基于背景色的色相，生成浅色文字
    const lightR = Math.min(255, Math.floor(r + (255 - r) * 0.7));
    const lightG = Math.min(255, Math.floor(g + (255 - g) * 0.7));
    const lightB = Math.min(255, Math.floor(b + (255 - b) * 0.7));
    textColor = `#${toHex(lightR)}${toHex(lightG)}${toHex(lightB)}`;

    // 激活色：更亮一些
    const activeLightR = Math.min(255, Math.floor(r + (255 - r) * 0.85));
    const activeLightG = Math.min(255, Math.floor(g + (255 - g) * 0.85));
    const activeLightB = Math.min(255, Math.floor(b + (255 - b) * 0.85));
    activeTextColor = `#${toHex(activeLightR)}${toHex(activeLightG)}${toHex(activeLightB)}`;
  }

  return { textColor, activeTextColor };
};

// 辅助函数：数字转十六进制
const toHex = (n) => {
  const hexValue = n.toString(16);
  return hexValue.length === 1 ? `0${hexValue}` : hexValue;
};
</script>

<style lang="scss" scoped>
.theme-settings-container {
  padding: 20px;

  .theme-content {
    h3 {
      font-size: 15px;
      margin-bottom: 6px;
      color: #303133;
      font-weight: 600;
    }

    h4 {
      font-size: 14px;
      margin-bottom: 6px;
      color: #303133;
      font-weight: 600;
    }

    .description {
      color: #909399;
      font-size: 13px;
      margin-bottom: 20px;
    }

    .theme-colors {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
      gap: 16px;
      margin-bottom: 20px;

      .theme-item {
        cursor: pointer;
        text-align: center;
        transition: all 0.2s;

        &:hover {
          transform: translateY(-3px);
        }

        &.active .color-preview {
          border: 3px solid #409eff;
          box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
        }

        .color-preview {
          width: 100%;
          height: 72px;
          border-radius: 8px;
          margin-bottom: 6px;
          border: 3px solid transparent;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;

          .check-icon {
            font-size: 28px;
            color: #fff;
          }
        }

        .theme-name {
          font-size: 13px;
          color: #606266;
        }
      }
    }

    .custom-color-section {
      margin-top: 20px;

      .custom-color-picker {
        display: flex;
        align-items: center;
        gap: 12px;

        .el-color-picker {
          :deep(.el-color-picker__trigger) {
            width: 48px;
            height: 48px;
          }
        }
      }
    }
  }
}
</style>
