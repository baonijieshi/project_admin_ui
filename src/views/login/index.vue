<template>
  <div class="login-container">
    <div class="brand-logo">
      <div class="brand-text">
        <span class="brand-cn">旭辉平台</span>
        <span class="brand-en">Cherish</span>
      </div>
    </div>
    <el-form
      ref="loginFormRef"
      :model="loginForm"
      :rules="loginRules"
      class="login-form"
      autocomplete="on"
      label-position="left"
    >
      <div class="title-container">
        <h3 class="title">旭辉项目管理平台</h3>
      </div>

      <el-form-item prop="username">
        <el-input
          ref="usernameRef"
          v-model="loginForm.username"
          placeholder="用户名"
          name="username"
          type="text"
          autocomplete="on"
        >
          <template #prefix>
            <el-icon><User /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item prop="password">
        <el-input
          ref="passwordRef"
          v-model="loginForm.password"
          :type="passwordType"
          placeholder="密码"
          name="password"
          autocomplete="on"
          @keyup.enter="handleLogin"
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

      <div class="tips">
        <el-checkbox v-model="rememberMe">记住密码</el-checkbox>
        <router-link to="/forgot-password" class="forgot-link">
          忘记密码？
        </router-link>
      </div>

      <el-button
        :loading="loading"
        type="primary"
        style="width: 100%; margin-bottom: 20px"
        @click.prevent="handleLogin"
      >
        登录
      </el-button>

      <div class="register-link">
        还没有账号？
        <router-link to="/register">立即注册</router-link>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import {
  ref, reactive, nextTick, onMounted
} from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { ElMessage } from 'element-plus';

const router = useRouter();
const store = useStore();

const loginFormRef = ref(null);
const usernameRef = ref(null);
const passwordRef = ref(null);

const loginForm = reactive({
  username: 'admin',
  password: '123456',
});

const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

const passwordType = ref('password');
const loading = ref(false);
const rememberMe = ref(false);

const showPwd = () => {
  if (passwordType.value === 'password') {
    passwordType.value = '';
  } else {
    passwordType.value = 'password';
  }
  nextTick(() => {
    passwordRef.value.focus();
  });
};

const handleLogin = async () => {
  await loginFormRef.value.validate();
  loading.value = true;
  try {
    await store.dispatch('user/login', loginForm);
    ElMessage.success('登录成功');
    router.push({ path: '/dashboard' });
  } catch (error) {
    ElMessage.error('登录失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  if (loginForm.username === '') {
    usernameRef.value.focus();
  } else if (loginForm.password === '') {
    passwordRef.value.focus();
  }
});
</script>

<style lang="scss" scoped>
.login-container {
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

  .brand-logo {
    position: absolute;
    top: 40px;
    left: 50px;
    z-index: 10;

    .brand-text {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .brand-cn {
        font-size: 32px;
        font-weight: 700;
        background: linear-gradient(135deg, #e8956f 0%, #d4825f 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        letter-spacing: 2px;
        text-shadow: 0 2px 10px rgba(232, 149, 111, 0.3);
      }

      .brand-en {
        font-size: 18px;
        font-weight: 600;
        color: #d4825f;
        letter-spacing: 1px;
        opacity: 0.9;
        font-family: 'Arial', sans-serif;
      }
    }
  }

  .login-form {
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
    }

    .el-form-item {
      margin-bottom: 22px;
    }

    .tips {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 22px;

      .forgot-link {
        color: #d4825f;
        text-decoration: none;
        font-size: 14px;
        transition: all 0.3s;

        &:hover {
          color: #e8956f;
          text-decoration: underline;
        }
      }
    }

    .register-link {
      text-align: center;
      margin-bottom: 20px;
      font-size: 14px;
      color: #666;

      a {
        color: #d4825f;
        text-decoration: none;
        margin-left: 5px;
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
