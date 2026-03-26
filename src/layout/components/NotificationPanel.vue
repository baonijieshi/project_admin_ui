<template>
  <div v-if="visible" ref="panelRef" class="notification-panel">
    <div class="panel-header">
      <span class="panel-title">通知</span>
      <div class="panel-actions">
        <el-button
          type="primary"
          link
          :disabled="notifications.length === 0"
          @click="handleMarkAllRead"
        >
          全部标记为已读
        </el-button>
        <el-button
          type="danger"
          link
          :disabled="notifications.length === 0"
          @click="handleClearAll"
        >
          <el-icon><Delete /></el-icon>清空
        </el-button>
      </div>
    </div>

    <div class="panel-body">
      <div v-if="loading" class="panel-loading">
        <el-icon class="is-loading"><Loading /></el-icon>
      </div>

      <div v-else-if="notifications.length === 0" class="panel-empty">
        暂无通知
      </div>

      <div
        v-else
        v-for="item in notifications"
        :key="item.id"
        class="notification-card"
        :class="{ unread: !item.is_read }"
        @click="handleCardClick(item)"
      >
        <div class="card-icon">
          <el-icon :size="18">
            <component :is="getTypeIcon(item.notification_type)" />
          </el-icon>
        </div>
        <div class="card-content">
          <div class="card-header">
            <el-avatar :size="24" :src="item.sender_avatar || ''">
              {{ item.sender_name ? item.sender_name.charAt(0) : '' }}
            </el-avatar>
            <span class="sender-name">{{ item.sender_name || '系统' }}</span>
            <span class="card-time">{{ timeAgo(item.created_at) }}</span>
          </div>
          <div class="card-title">{{ item.title }}</div>
          <div class="card-summary">{{ truncateContent(item.content) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref, watch, onMounted, onBeforeUnmount, markRaw,
} from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  ChatDotRound, Warning, Tickets, Loading, Delete,
} from '@element-plus/icons-vue';
import { getNotificationList } from '@/api/notification';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:visible']);

const store = useStore();
const router = useRouter();

const panelRef = ref(null);
const notifications = ref([]);
const loading = ref(false);

// Icon mapping
const iconMap = {
  comment_reply: markRaw(ChatDotRound),
  bug_assigned: markRaw(Warning),
  bug_resolved: markRaw(Warning),
  bug_activated: markRaw(Warning),
  ticket_assigned: markRaw(Tickets),
};

function getTypeIcon(type) {
  return iconMap[type] || markRaw(ChatDotRound);
}

// Content truncation (Property 8)
function truncateContent(content) {
  if (!content) return '';
  if (content.length > 80) return content.slice(0, 80) + '...';
  return content;
}

// Relative time helper
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return dateStr.slice(0, 10);
}

// Route mapping (Property 10)
const routeMap = {
  story: (id) => ({ path: '/story', query: { openId: id } }),
  bug: (id) => ({ path: '/test/bug', query: { openId: id } }),
  ticket: (id) => ({ path: '/delivery/ticket', query: { openId: id } }),
};

// Load notifications when panel becomes visible
async function fetchNotifications() {
  loading.value = true;
  try {
    const res = await getNotificationList();
    notifications.value = res.data.list || [];
  } catch {
    notifications.value = [];
  } finally {
    loading.value = false;
  }
}

// Card click: mark read + navigate
async function handleCardClick(item) {
  try {
    if (!item.is_read) {
      await store.dispatch('notification/markRead', item.id);
      item.is_read = true;
    }

    const routeFn = routeMap[item.source_type];
    if (routeFn) {
      router.push(routeFn(item.source_id)).catch(() => {
        ElMessage.warning('该记录已被删除');
      });
    }

    emit('update:visible', false);
  } catch {
    ElMessage.warning('该记录已被删除');
  }
}

// Mark all as read
async function handleMarkAllRead() {
  try {
    await store.dispatch('notification/markAllRead');
    notifications.value.forEach((n) => { n.is_read = true; });
  } catch {
    ElMessage.error('操作失败，请重试');
  }
}

// Clear all notifications
async function handleClearAll() {
  try {
    await ElMessageBox.confirm('确定要清空所有通知吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await store.dispatch('notification/clearAll');
    notifications.value = [];
  } catch {
    // 用户取消或请求失败
  }
}

// Click outside detection
function onDocumentClick(e) {
  if (panelRef.value && !panelRef.value.contains(e.target)) {
    // Check if click is on the bell (parent handles toggle)
    const bell = document.querySelector('.notification-bell');
    if (bell && bell.contains(e.target)) return;
    emit('update:visible', false);
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      fetchNotifications();
    }
  },
);

onMounted(() => {
  document.addEventListener('click', onDocumentClick, false);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick, false);
});
</script>

<style lang="scss" scoped>
.notification-panel {
  position: absolute;
  top: 50px;
  right: 80px;
  width: 380px;
  max-height: 450px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;

  .panel-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }

  .panel-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.panel-body {
  max-height: 400px;
  overflow-y: auto;
  flex: 1;
}

.panel-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #909399;
}

.panel-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #909399;
  font-size: 14px;
}

.notification-card {
  display: flex;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f2f3f5;
  position: relative;

  &:hover {
    background-color: #f5f7fa;
  }

  &:last-child {
    border-bottom: none;
  }

  &.unread {
    background-color: #f0f9ff;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background-color: #409eff;
      border-radius: 0 2px 2px 0;
    }
  }

  .card-icon {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background-color: #f0f2f5;
    margin-right: 10px;
    margin-top: 2px;
    color: #606266;
  }

  .card-content {
    flex: 1;
    min-width: 0;

    .card-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;

      .sender-name {
        font-size: 13px;
        font-weight: 500;
        color: #303133;
      }

      .card-time {
        margin-left: auto;
        font-size: 12px;
        color: #909399;
        white-space: nowrap;
      }
    }

    .card-title {
      font-size: 13px;
      color: #303133;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-summary {
      font-size: 12px;
      color: #909399;
      line-height: 1.4;
      word-break: break-all;
    }
  }
}
</style>
