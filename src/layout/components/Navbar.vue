<template>
  <div class="navbar">
    <breadcrumb class="breadcrumb-container" />

    <div class="right-menu">
      <notification-bell @toggle="notificationPanelVisible = !notificationPanelVisible" />
      <notification-panel v-model:visible="notificationPanelVisible" />
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
            <el-dropdown-item @click="openPasswordDialog">
              <el-icon><Lock /></el-icon>修改密码
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

    <!-- 修改密码对话框 -->
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="400px" :close-on-click-modal="false" @closed="resetPasswordForm">
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="80px">
        <el-form-item label="旧密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入旧密码" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入新密码（至少6位）" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="passwordSaving" @click="handleChangePassword">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {
  ref, computed, reactive, onMounted,
} from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Camera, SwitchButton, Upload, Lock,
} from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { uploadImage } from '@/api/upload';
import { changePassword } from '@/api/user';
import Breadcrumb from './Breadcrumb.vue';
import NotificationBell from './NotificationBell.vue';
import NotificationPanel from './NotificationPanel.vue';

const router = useRouter();
const store = useStore();

const notificationPanelVisible = ref(false);

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

// 修改密码
const passwordDialogVisible = ref(false);
const passwordSaving = ref(false);
const passwordFormRef = ref(null);
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});
const passwordRules = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) callback(new Error('两次输入的密码不一致'));
        else callback();
      },
      trigger: 'blur',
    },
  ],
};
const openPasswordDialog = () => { passwordDialogVisible.value = true; };
const resetPasswordForm = () => {
  passwordForm.oldPassword = '';
  passwordForm.newPassword = '';
  passwordForm.confirmPassword = '';
};
const handleChangePassword = async () => {
  if (!passwordFormRef.value) return;
  await passwordFormRef.value.validate();
  passwordSaving.value = true;
  try {
    const res = await changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    });
    ElMessage.success(res.message || '密码修改成功');
    passwordDialogVisible.value = false;
  } catch {
    ElMessage.error('修改失败，请检查旧密码是否正确');
  } finally {
    passwordSaving.value = false;
  }
};

onMounted(() => {
  store.dispatch('notification/startPolling');
});

const logout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await store.dispatch('notification/stopPolling');
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
  flex-shrink: 0;
  overflow: visible;
  position: relative;
  z-index: 10;
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
