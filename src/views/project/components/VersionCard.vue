<template>
  <div class="version-card" @click="$emit('click')">
    <div class="version-card__header">
      <div class="version-card__title-row">
        <span class="version-card__name">{{ version.name }}</span>
        <el-tag :type="statusType" size="small" effect="dark" round>{{ version.status }}</el-tag>
      </div>
      <div class="version-card__actions">
        <el-button size="small" link type="primary" @click.stop="$emit('edit')">编辑</el-button>
        <el-button v-if="version.isArchived" size="small" link type="warning" @click.stop="$emit('archive')">取消归档</el-button>
        <el-button size="small" link type="danger" @click.stop="$emit('delete')">删除</el-button>
      </div>
    </div>
    <div class="version-card__body">
      <div class="version-card__meta">
        <span v-if="version.startDate || version.endDate" class="meta-item">
          <el-icon><Calendar /></el-icon>
          {{ version.startDate || '?' }} ~ {{ version.endDate || '?' }}
        </span>
        <span v-if="version.storyTitle" class="meta-item meta-item--story">
          <el-icon><Document /></el-icon>{{ version.storyTitle }}
        </span>
      </div>
      <div class="version-card__team">
        <el-tooltip v-if="version.manager" :content="`产品经理: ${version.manager}`" placement="top">
          <el-avatar :size="24" :src="version.managerAvatar || ''">{{ version.manager?.charAt(0) }}</el-avatar>
        </el-tooltip>
        <el-tooltip v-if="version.devLeader" :content="`开发: ${version.devLeader}`" placement="top">
          <el-avatar :size="24" :src="version.devLeaderAvatar || ''">{{ version.devLeader?.charAt(0) }}</el-avatar>
        </el-tooltip>
        <el-tooltip v-for="(tl, idx) in (version.testLeaderNames || [])" :key="'tl'+idx" :content="`测试: ${tl}`" placement="top">
          <el-avatar :size="24" :src="(version.testLeaderAvatars || [])[idx] || ''">{{ tl?.charAt(0) }}</el-avatar>
        </el-tooltip>
      </div>
    </div>
    <div class="version-card__footer">
      <div class="version-card__stats">
        <span class="stat-chip">
          <el-icon><Tickets /></el-icon>{{ version.taskDone }}/{{ version.taskTotal }}
        </span>
        <span class="stat-chip stat-chip--bug" @click.stop="$emit('goBug')">
          <el-icon><WarningFilled /></el-icon>{{ version.bugCount }}
        </span>
      </div>
      <div class="version-card__progress">
        <el-progress
          :percentage="version.progress || 0"
          :stroke-width="6"
          :show-text="false"
          :color="progressColor"
        />
        <span class="progress-text">{{ version.progress || 0 }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import {
  Calendar, Document, Tickets, WarningFilled,
} from '@element-plus/icons-vue';

const props = defineProps({
  version: { type: Object, required: true },
});

defineEmits(['click', 'edit', 'delete', 'goBug', 'archive']);

const statusType = computed(() => ({
  未开始: 'info',
  进行中: 'primary',
  已完成: 'success',
  已暂停: 'warning',
}[props.version.status] || 'info'));

const progressColor = computed(() => {
  const p = props.version.progress || 0;
  if (p < 30) return '#909399';
  if (p < 70) return '#409eff';
  return '#67c23a';
});
</script>

<style scoped lang="scss">
.version-card {
  padding: 14px 18px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 8px;

  &:hover {
    border-color: #409eff;
    box-shadow: 0 2px 12px rgba(64, 158, 255, 0.1);
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__name {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }

  &__actions {
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover &__actions {
    opacity: 1;
  }

  &__body {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    color: #909399;
  }

  &__team {
    display: flex;
    gap: 4px;

    .el-avatar {
      background: linear-gradient(135deg, #409eff, #66b1ff);
      color: #fff;
      font-size: 11px;
    }
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__stats {
    display: flex;
    gap: 12px;
  }

  &__progress {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 140px;

    .el-progress {
      flex: 1;
    }
  }
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 3px;

  &--story {
    color: #409eff;
  }
}

.stat-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  color: #606266;

  &--bug {
    color: #f56c6c;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }
}

.progress-text {
  font-size: 12px;
  color: #606266;
  min-width: 32px;
  text-align: right;
}
</style>
