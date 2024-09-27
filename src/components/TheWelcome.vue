<script setup></script>

<template>
  <h1>首頁</h1>
  <ul>
    <li>
      <router-link to="/login">登入</router-link>
    </li>
    <li>
      <router-link to="/general">客戶資料</router-link>
    </li>
    <li>
      <router-link to="/fuel-record">加油紀錄</router-link>
    </li>
    <li>
      <router-link to="/transfer-record">匯款紀錄</router-link>
    </li>
    <li>
      <router-link to="/reconciliation-invoice">對帳及發票查詢</router-link>
    </li>
  </ul>
</template>
