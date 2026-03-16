<template>
  <div class="forgot-password-container">
    <el-form
      ref="forgotFormRef"
      :model="forgotForm"
      :rules="forgotRules"
      class="forgot-form"
      label-position="left"
    >
      <div class="title-container">
        <h3 class="title">找回密码</h3>
        <p class="subtitle">请输入您的邮箱或手机号，我们将发送验证码</p>
      </div>

      <el-form-item prop="account">
        <el-input
          v-model="forgotForm.account"
          placeholder="邮箱或手机号"
          name="account"
          type="text"
        >
          <template #prefix>
            <el-icon><Message /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item prop="code">
        <el-input
          v-model="forgotForm.code"
          placeholder="验证码"
          name="code"
          type="text"
          style="width: calc(100% - 120px)"
        >
          <template #prefix>
            <el-icon><Key /></el-icon>
          </template>
        </el-input>
        <el-button
          :disabled="countdown > 0"
          style="width: 110px; margin-left: 10px"
          @click="sendCode"
        >
          {{ countdown > 0 ? `${countdown}秒后重试` : '发送验证码' }}
        </el-button>
      </el-form-item>

      <el-form-item prop="newPassword">
        <el-input
          v-model="forgotForm.newPassword"
          :type="passwordType"
          placeholder="新密码"
          name="newPassword"
        >
          <template #prefix>
            <el-icon><Lock /></el-icon>
          </template>
          <template #suffix>
            <el-icon class="show-pwd" @click="showPwd">
              <component :is="passwordType === 'password' ? 'View' : 'Hide'" />
            </el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item prop="confirmPassword">
        <el-input
          v-model="forgotForm.confirmPassword"
          type="password"
          placeholder="确认新密码"
          name="confirmPassword"
          @keyup.enter="handleReset"
        >
          <template #prefix>
            <el-icon><Lock /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-button
        :loading="loading"
        type="primary"
        style="width: 100%; margin-bottom: 20px"
        @click.prevent="handleReset"
      >
        重置密码
      </el-button>

      <div class="back-link">
        <router-link to="/login">
          <el-icon><ArrowLeft /></el-icon>
          返回登录
        </router-link>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

const router = useRouter();

const forgotFormRef = ref(null);

const validatePass = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入新密码'));
  } else if (value.length < 6) {
    callback(new Error('密码长度不能少于6位'));
  } else {
    if (forgotForm.confirmPassword !== '') {
      forgotFormRef.value.validateField('confirmPassword');
    }
    callback();
  }
};

const validateConfirmPass = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'));
  } else if (value !== forgotForm.newPassword) {
    callback(new Error('两次输入密码不一致'));
  } else {
    callback();
  }
};

const forgotForm = reactive({
  account: '',
  code: '',
  newPassword: '',
  confirmPassword: '',
});

const forgotRules = {
  account: [{ required: true, message: '请输入邮箱或手机号', trigger: 'blur' }],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
  newPassword: [{ required: true, validator: validatePass, trigger: 'blur' }],
  confirmPassword: [{ required: true, validator: validateConfirmPass, trigger: 'blur' }],
};

const passwordType = ref('password');
const loading = ref(false);
const countdown = ref(0);

const showPwd = () => {
  passwordType.value = passwordType.value === 'password' ? '' : 'password';
};

const sendCode = async () => {
  if (!forgotForm.account) {
    ElMessage.warning('请先输入邮箱或手机号');
    return;
  }

  try {
    // 这里应该调用发送验证码API
    await new Promise((resolve) => {
      setTimeout(() => resolve(), 500);
    });
    ElMessage.success('验证码已发送');
    countdown.value = 60;
    const timer = setInterval(() => {
      countdown.value -= 1;
      if (countdown.value <= 0) {
        clearInterval(timer);
      }
    }, 1000);
  } catch (error) {
    ElMessage.error('发送失败');
  }
};

const handleReset = async () => {
  await forgotFormRef.value.validate();
  loading.value = true;
  try {
    // 这里应该调用重置密码API
    await new Promise((resolve) => {
      setTimeout(() => resolve(), 1000);
    });
    ElMessage.success('密码重置成功，请登录');
    router.push('/login');
  } catch (error) {
    ElMessage.error('重置失败');
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.forgot-password-container {
  min-height: 100vh;
  width: 100%;
  background-image: url('@/assets/think.svg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8%;
  position: relative;

  .forgot-form {
    position: relative;
    width: 420px;
    max-width: 90%;
    padding: 40px 35px 30px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.92);
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
    z-index: 1;

    .title-container {
      position: relative;
      text-align: center;
      margin-bottom: 35px;

      .title {
        font-size: 28px;
        color: #d4825f;
        margin: 0 auto 10px;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(212, 130, 95, 0.15);
      }

      .subtitle {
        font-size: 14px;
        color: #666;
        margin: 0;
      }
    }

    .el-form-item {
      margin-bottom: 22px;
    }

    .back-link {
      text-align: center;
      margin-bottom: 20px;

      a {
        color: #d4825f;
        text-decoration: none;
        font-size: 14px;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-weight: 500;
        transition: all 0.3s;

        &:hover {
          color: #e8956f;
          text-decoration: underline;
        }
      }
    }

    .show-pwd {
      cursor: pointer;
      user-select: none;
      transition: color 0.3s;

      &:hover {
        color: #d4825f;
      }
    }

    :deep(.el-button--primary) {
      background: linear-gradient(135deg, #e8956f 0%, #d4825f 100%);
      border: none;
      border-radius: 25px;
      height: 45px;
      font-size: 16px;
      font-weight: 500;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(232, 149, 111, 0.4);
      }
    }

    :deep(.el-input__wrapper) {
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      transition: all 0.3s;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
    }
  }
}
</style>
