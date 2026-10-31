<template>
  <div class="home-page">
    <section class="home-intro">
      <div>
        <p class="home-eyebrow">工作台 / OVERVIEW</p>
        <h1>{{ greeting }}</h1>
        <p class="home-subtitle">从这里进入日常管理工作，快速查看生产进度与业务记录。</p>
      </div>
      <span class="home-date">{{ today }}</span>
    </section>

    <section class="quick-section" aria-labelledby="quick-title">
      <div class="section-heading">
        <div>
          <h2 id="quick-title">常用工作</h2>
          <p>按日常处理顺序快速进入</p>
        </div>
      </div>
      <div class="quick-grid">
        <button
          v-for="item in quickLinks"
          :key="item.name"
          class="quick-card"
          type="button"
          @click="navigateTo(item.route)">
          <span class="quick-icon"><component :is="item.icon" /></span>
          <span class="quick-copy">
            <strong>{{ item.label }}</strong>
            <small>{{ item.desc }}</small>
          </span>
          <el-icon class="card-arrow"><ArrowRight /></el-icon>
        </button>
      </div>
    </section>

    <section class="all-section" aria-labelledby="all-title">
      <div class="section-heading">
        <div>
          <h2 id="all-title">全部功能</h2>
          <p>按业务领域查找管理页面</p>
        </div>
      </div>
      <div class="group-grid">
        <div v-for="group in featureGroups" :key="group.title" class="function-group">
          <h3>{{ group.title }}</h3>
          <button
            v-for="item in group.cards"
            :key="item.name"
            type="button"
            class="function-link"
            @click="navigateTo(item.route)">
            <component :is="item.icon" class="function-icon" />
            <span>{{ item.label }}</span>
            <el-icon><ArrowRight /></el-icon>
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { localStore } from '@/composables/store'
  import { ArrowRight } from '@element-plus/icons-vue'
  import { navigationGroups as featureGroups } from '@/config/navigation'

  const router = useRouter()
  const user = localStore.get('user') || {}
  const username = user.nickname || user.username || ''
  const quickNames = ['production-board', 'production-plan', 'plan-operation-report', 'sale-order']
  const quickLinks = featureGroups
    .flatMap((group) => group.cards)
    .filter((item) => quickNames.includes(item.name))
  const today = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date())
  const greeting = computed(() => {
    const hour = new Date().getHours()
    const timeGreet = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好'
    return username ? `${timeGreet}，${username}` : `${timeGreet}，欢迎回来`
  })
  function navigateTo(route: string) {
    router.push(route)
  }
</script>

<style scoped>
  .home-page {
    max-width: 1400px;
    margin: 0 auto;
  }
  .home-intro {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    align-items: flex-end;
    padding: 10px 0 32px;
  }
  .home-eyebrow {
    margin: 0 0 10px;
    color: #2869bd;
    font-size: 11px;
    font-weight: 750;
    letter-spacing: 0.12em;
  }
  h1 {
    margin: 0;
    color: #172b47;
    font-size: clamp(25px, 3vw, 32px);
    font-weight: 700;
    letter-spacing: -0.03em;
  }
  .home-subtitle {
    margin: 9px 0 0;
    color: #687b94;
    font-size: 14px;
  }
  .home-date {
    padding-bottom: 4px;
    color: #8796aa;
    font-size: 12px;
    white-space: nowrap;
  }
  .section-heading {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  .section-heading h2 {
    margin: 0;
    color: #213651;
    font-size: 17px;
    font-weight: 700;
  }
  .section-heading p {
    margin: 4px 0 0;
    color: #8290a3;
    font-size: 12px;
  }
  .quick-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
  }
  .quick-card {
    display: flex;
    min-height: 112px;
    align-items: flex-start;
    gap: 12px;
    padding: 20px 16px;
    border: 1px solid #e5ebf2;
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 2px 12px #1b365208;
    text-align: left;
    transition:
      border-color 0.2s,
      box-shadow 0.2s,
      transform 0.2s;
  }
  .quick-card:hover,
  .quick-card:focus-visible {
    border-color: #a9c8eb;
    box-shadow: 0 8px 22px #1b365214;
    transform: translateY(-2px);
  }
  .quick-icon {
    display: grid;
    width: 38px;
    height: 38px;
    flex: none;
    place-items: center;
    border-radius: 9px;
    background: #eaf2fd;
    color: #2564b1;
  }
  .quick-icon :deep(svg) {
    width: 19px;
    height: 19px;
  }
  .quick-copy {
    display: grid;
    min-width: 0;
    gap: 7px;
  }
  .quick-copy strong {
    color: #213651;
    font-size: 14px;
  }
  .quick-copy small {
    color: #8190a4;
    font-size: 11px;
    line-height: 1.5;
  }
  .card-arrow {
    margin-left: auto;
    color: #9aacc1;
  }
  .all-section {
    margin-top: 38px;
  }
  .group-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }
  .function-group {
    padding: 19px 16px 15px;
    border: 1px solid #e5ebf2;
    border-radius: 12px;
    background: #fff;
  }
  .function-group h3 {
    margin: 0 4px 9px;
    color: #546985;
    font-size: 12px;
    font-weight: 750;
  }
  .function-link {
    display: flex;
    width: 100%;
    min-height: 37px;
    align-items: center;
    gap: 11px;
    padding: 6px 9px;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: #304660;
    font-size: 13px;
    text-align: left;
  }
  .function-link:hover,
  .function-link:focus-visible {
    background: #f0f5fc;
    color: #1d5eb7;
  }
  .function-link .function-icon {
    width: 16px;
    height: 16px;
    color: #6787ad;
  }
  .function-link .el-icon {
    margin-left: auto;
    color: #9aacc1;
    font-size: 12px;
  }
  @media (max-width: 1150px) {
    .quick-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .group-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 600px) {
    .home-intro {
      display: block;
      padding-bottom: 24px;
    }
    .home-date {
      display: block;
      margin-top: 14px;
    }
    .quick-grid,
    .group-grid {
      grid-template-columns: 1fr;
    }
    .quick-card {
      min-height: 90px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .quick-card {
      transition: none;
    }
  }
</style>
