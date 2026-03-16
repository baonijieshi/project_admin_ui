<template>
  <div class="navbar">
    <breadcrumb class="breadcrumb-container" />

    <div class="right-menu">
      <el-dropdown class="avatar-container" trigger="click">
        <div class="avatar-wrapper">
          <el-avatar
            :size="32"
            :src="avatar || ''"
            class="user-avatar"
          >{{ userName ? userName.charAt(0) : '' }}</el-avatar>
          <span class="user-name">{{ userName }}</span>
          <el-icon class="el-icon--right"><CaretBottom /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="openAvatarDialog">
              <el-icon><Camera /></el-icon>修改头像
            </el-dropdown-item>
            <el-dropdown-item divided @click="logout">
              <el-icon><SwitchButton /></el-icon>退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 头像上传对话框 -->
    <el-dialog v-model="avatarDialogVisible" title="修改头像" width="400px" :close-on-click-modal="false">
      <div class="avatar-upload-area">
        <el-avatar :size="80" :src="previewUrl || avatar || ''">{{ userName ? userName.charAt(0) : '' }}</el-avatar>
        <el-upload
          class="avatar-uploader"
          :show-file-list="false"
          :before-upload="beforeUpload"
          :http-request="handleUpload"
          accept="image/*"
        >
          <el-button style="margin-top: 16px" :loading="uploading">
            <el-icon><Upload /></el-icon>选择图片
          </el-button>
        </el-upload>
        <div class="upload-tip">支持 jpg/png/gif，大小不超过 10MB</div>
      </div>
      <template #footer>
        <el-button @click="avatarDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!previewUrl" :loading="saving" @click="saveAvatar">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Camera, SwitchButton, Upload,
} from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { uploadImage } from '@/api/upload';
import Breadcrumb from './Breadcrumb.vue';

const router = useRouter();
const store = useStore();

const userName = computed(() => store.getters.name || '用户');
const avatar = computed(() => store.getters.avatar);

// 头像对话框
const avatarDialogVisible = ref(false);
const previewUrl = ref('');
const uploading = ref(false);
const saving = ref(false);

const openAvatarDialog = () => {
  previewUrl.value = '';
  avatarDialogVisible.value = true;
};

const beforeUpload = (file) => {
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 10MB');
    return false;
  }
  return true;
};

const handleUpload = async ({ file }) => {
  uploading.value = true;
  try {
    const res = await uploadImage(file);
    previewUrl.value = res.data.url;
  } catch {
    ElMessage.error('上传失败，请重试');
  } finally {
    uploading.value = false;
  }
};

const saveAvatar = async () => {
  if (!previewUrl.value) return;
  saving.value = true;
  try {
    await store.dispatch('user/updateAvatar', previewUrl.value);
    ElMessage.success('头像更新成功');
    avatarDialogVisible.value = false;
  } catch {
    ElMessage.error('保存失败，请重试');
  } finally {
    saving.value = false;
  }
};

const logout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await store.dispatch('user/logout');
    ElMessage.success('退出成功');
    router.push('/login');
  } catch {
    // 用户取消
  }
};
</script>

<style lang="scss" scoped>
.navbar {
  height: 50px;
  overflow: hidden;
  position: relative;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;

  .breadcrumb-container {
    flex: 0 0 auto;
  }

  .right-menu {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    height: 100%;

    .avatar-container {
      cursor: pointer;
      display: flex;
      align-items: center;
      height: 100%;

      .avatar-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;

        .user-avatar {
          flex-shrink: 0;
        }

        .user-name {
          font-size: 14px;
          color: #303133;
        }
      }
    }
  }
}

.avatar-upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;

  .upload-tip {
    margin-top: 8px;
    font-size: 12px;
    color: #909399;
  }
}
</style>
