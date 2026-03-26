<template>
  <div class="app-wrapper">
    <sidebar class="sidebar-container" />
    <div class="main-container">
      <navbar />
      <app-main />
    </div>
  </div>
</template>

<script setup>
import { Sidebar, Navbar, AppMain } from './components';
</script>

<style lang="scss" scoped>
.app-wrapper {
  position: relative;
  height: 100%;
  width: 100%;

  &::after {
    content: "";
    display: table;
    clear: both;
  }
}

.main-container {
  min-height: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.28s;
  margin-left: 210px;
  position: relative;
  background-color: #f0f2f5;
  overflow: hidden;
}

.sidebar-container {
  transition: width 0.28s;
  width: 210px !important;
  background-color: #304156;
  height: 100%;
  position: fixed;
  font-size: 0;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 1001;
  overflow: hidden;
}
</style>
